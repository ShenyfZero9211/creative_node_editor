/**
 * Main entry point — V5: paste properties, minimap, dialog, type checking
 */

import { RenderEngine } from './core/RenderEngine.js';
import { NodeCanvas } from './core/NodeCanvas.js';
import { WindowManager } from './core/WindowManager.js';
import { Clipboard } from './core/Clipboard.js';
import { ProjectManager } from './core/ProjectManager.js';
import { UndoManager } from './core/UndoManager.js';
import { Toolbar } from './ui/Toolbar.js';
import { MenuBar } from './ui/MenuBar.js';
import { ParamPanel } from './ui/ParamPanel.js';
import { ContextMenu } from './ui/ContextMenu.js';
import { PreviewPanel } from './ui/PreviewPanel.js';
import { Dialog } from './ui/Dialog.js';
import { createNode } from './nodes/NodeRegistry.js';

class App {
  constructor() {
    this.engine = new RenderEngine();
    this.windowManager = new WindowManager();
    this.engine.windowManager = this.windowManager;
    this.clipboard = new Clipboard();
    this.projectManager = new ProjectManager(this.engine);
    this.undoManager = new UndoManager();

    // Canvas
    const canvasEl = document.getElementById('node-canvas');
    this.nodeCanvas = new NodeCanvas(canvasEl, this.engine);

    // Param panel
    const panelContent = document.getElementById('param-panel-content');
    this.paramPanel = new ParamPanel(panelContent, () => this.engine.evaluate());
    this.paramPanel.onCommit = () => this._saveState();
    this.paramPanel.onDelete = () => {
      this.nodeCanvas.deleteSelectedNodes();
      this.paramPanel.clear();
      this.engine.evaluate();
    };
    this.paramPanel.onToggleInput = (node, key, enabled, info) => {
      // If we have transition info, sync connections automatically
      if (info && info.oldInputs && info.newInputs) {
        this.engine.connectionMgr.syncNodeConnections(node.id, info.oldInputs, info.newInputs);
      }
      this.engine.evaluate();
      this._saveState();
    };

    // Menu Bar
    const menuBarEl = document.getElementById('menu-bar');
    this.menuBar = new MenuBar(menuBarEl, {
      onNewProject: () => this._newProject(),
      onSaveProject: () => this.projectManager.saveProject(),
      onOpenProject: () => this.projectManager.openProject(),
      onCopy: () => this._copy(),
      onPaste: () => this._paste(),
      onDelete: () => this._deleteSelected(),
      onSelectAll: () => this.nodeCanvas.selectAll(),
      onResetView: () => this.nodeCanvas.resetView(),
      onFitAll: () => this.nodeCanvas.fitAll(),
      onToggleMinimap: () => {
        this.nodeCanvas.showMinimap = !this.nodeCanvas.showMinimap;
        const minimapEl = document.getElementById('minimap');
        if (minimapEl) minimapEl.style.display = this.nodeCanvas.showMinimap ? 'block' : 'none';
      },
      onFullscreen: () => this._toggleFullscreen(),
      onShowShortcuts: () => Dialog.showShortcuts(),
      onAbout: () => Dialog.showAbout(),
      onUndo: () => this._undo(),
      onRedo: () => this._redo(),
      // Dynamic state for edit menu
      getHasSelection: () => this.nodeCanvas.selectedNodeIds.size > 0,
      getHasClipboard: () => this.clipboard.hasNodes,
      getCanUndo: () => this.undoManager.canUndo,
      getCanRedo: () => this.undoManager.canRedo,
    });

    // Quick Toolbar
    const toolbarEl = document.getElementById('toolbar');
    this.toolbar = new Toolbar(toolbarEl, {
      onAddNode: (typeId) => this._addNodeAtCenter(typeId),
      onNewWindow: () => this._createPreviewPanel(),
    });

    // Context menu
    const ctxMenuEl = document.getElementById('context-menu');
    this.contextMenu = new ContextMenu(ctxMenuEl);
    this.contextMenu.onAddNode = (typeId, wx, wy) => this._addNode(typeId, wx, wy);
    this.contextMenu.onCopyNode = () => this._copy();
    this.contextMenu.onCopyProperties = () => this._copyProperties();
    this.contextMenu.onCopyJSON = () => this._copyJSON();
    this.contextMenu.onPasteNode = (wx, wy) => this._pasteAt(wx, wy);
    this.contextMenu.onPasteProperties = () => this._pasteProperties();
    this.contextMenu.onDelete = () => this._deleteSelected();

    // Canvas callbacks
    this.nodeCanvas.onNodeSelect = (node) => this.paramPanel.showNode(node);
    this.nodeCanvas.onMultiSelect = () => this.paramPanel.clear();
    this.nodeCanvas.onNodeDeselect = () => this.paramPanel.clear();
    this.nodeCanvas.onDragEnd = () => this._saveState();
    this.nodeCanvas.onConnectionChange = () => this._saveState();
    this.nodeCanvas.onContextMenu = (wx, wy, sx, sy, hitNodeId) => {
      const isMulti = this.nodeCanvas.selectedNodeIds.size > 1;
      const targetNode = hitNodeId ? this.engine.nodeMap.get(hitNodeId) : null;
      const targetType = targetNode?.type || null;
      this.contextMenu.show(
        sx, sy, wx, wy,
        hitNodeId, isMulti,
        this.clipboard.hasNodes,
        this.clipboard._propertiesNodeType,
        targetType
      );
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this._onKeyDown(e));

    // Preview panels
    this._previewPanels = [];

    // Start render loop
    this.engine.startLoop();

    // Demo pipeline
    this._addDemoNodes();
    this._createPreviewPanel();

    console.log('✦ Creative Node Editor V5 initialized');
  }

  _onKeyDown(e) {
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if (e.key === 'F11') {
      e.preventDefault();
      this._toggleFullscreen();
      return;
    }

    if (isInput) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'c': e.preventDefault(); this._copy(); break;
        case 'v': e.preventDefault(); this._paste(); break;
        case 'a': e.preventDefault(); this.nodeCanvas.selectAll(); break;
        case 's': e.preventDefault(); this.projectManager.saveProject(); break;
        case 'o': e.preventDefault(); this.projectManager.openProject(); break;
        case 'n': e.preventDefault(); this._newProject(); break;
        case 'z': e.preventDefault(); this._undo(); break;
        case 'y': e.preventDefault(); this._redo(); break;
      }
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      this._deleteSelected();
    }
  }

  // ===== Clipboard =====

  _copy() {
    const nodes = this.nodeCanvas.getSelectedNodes();
    if (nodes.length > 0) {
      const internalConnections = this.nodeCanvas.getInternalConnections(nodes);
      this.clipboard.copyNodes(nodes, internalConnections);
    }
  }

  _copyProperties() {
    const nodes = this.nodeCanvas.getSelectedNodes();
    if (nodes.length === 1) this.clipboard.copyProperties(nodes[0]);
  }

  _copyJSON() {
    const nodes = this.nodeCanvas.getSelectedNodes();
    if (nodes.length > 0) {
      const internalConns = this.nodeCanvas.getInternalConnections(nodes);
      // We don't currently support embedding connections in JSON clipboard for simplicity,
      // but we could in the future. For now, system clipboard remains plain JSON nodes.
      this.clipboard.copyJSON(nodes);
    }
  }

  _paste() {
    if (!this.clipboard.hasNodes) return;
    const baseOffset = 30;
    const firstData = this.clipboard._nodes[0];
    const targetPos = this.nodeCanvas.autoOffset(firstData.x + baseOffset, firstData.y + baseOffset);
    const finalOffsetX = targetPos.x - firstData.x;
    const finalOffsetY = targetPos.y - firstData.y;

    const newNodes = this.clipboard.paste(finalOffsetX, finalOffsetY);
    for (const node of newNodes) this.engine.addNode(node);
    
    // Finalize connections
    this.clipboard.applyPastedConnections(this.engine.connectionMgr, this.engine.nodeMap);

    this.nodeCanvas.deselectNode();
    for (const node of newNodes) {
      this.nodeCanvas.selectedNodeIds.add(node.id);
      node.selected = true;
    }
    this._saveState();
    this.engine.evaluate();
  }

  _pasteAt(wx, wy) {
    if (!this.clipboard.hasNodes) return;
    const data = this.clipboard._nodes;
    if (!data || data.length === 0) return;
    
    const targetPos = this.nodeCanvas.autoOffset(wx, wy);
    const offsetX = targetPos.x - data[0].x;
    const offsetY = targetPos.y - data[0].y;
    
    const newNodes = this.clipboard.paste(offsetX, offsetY);
    for (const node of newNodes) this.engine.addNode(node);
    
    // Finalize connections
    this.clipboard.applyPastedConnections(this.engine.connectionMgr, this.engine.nodeMap);

    this.nodeCanvas.deselectNode();
    for (const node of newNodes) {
      this.nodeCanvas.selectedNodeIds.add(node.id);
      node.selected = true;
    }
    this._saveState();
    this.engine.evaluate();
  }

  _pasteProperties() {
    const nodes = this.nodeCanvas.getSelectedNodes();
    if (nodes.length === 1) {
      this.clipboard.pasteProperties(nodes[0]);
      this.paramPanel.showNode(nodes[0]);
      this._saveState();
      this.engine.evaluate();
    }
  }

  _deleteSelected() {
    this.nodeCanvas.deleteSelectedNodes();
    this.paramPanel.clear();
    this._saveState();
    this.engine.evaluate();
  }

  // ===== Fullscreen =====

  _toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen failed:', err);
      });
    }
  }

  _newProject() {
    if (window.Dialog) {
      window.Dialog.showConfirm({
        title: '新建工程',
        message: '新建工程将清空当前所有内容，确定继续？',
        confirmText: '确定新建',
        onConfirm: () => {
          this.projectManager.newProject();
          this.paramPanel.clear();
          this.nodeCanvas.deselectNode();
          this.undoManager.clear();
        }
      });
    } else {
      if (confirm('新建工程将清空当前所有内容，确定继续？')) {
        this.projectManager.newProject();
        this.paramPanel.clear();
        this.nodeCanvas.deselectNode();
        this.undoManager.clear();
      }
    }
  }

  // ===== Undo / Redo =====

  _saveState() {
    this.undoManager.push(this.projectManager.serialize());
  }

  _undo() {
    const newState = this.undoManager.undo(this.projectManager.serialize());
    if (newState) {
      this.projectManager.loadProject(newState);
      this.paramPanel.clear();
    }
  }

  _redo() {
    const newState = this.undoManager.redo(this.projectManager.serialize());
    if (newState) {
      this.projectManager.loadProject(newState);
      this.paramPanel.clear();
    }
  }

  // ===== Node management =====

  _addNode(typeId, x, y) {
    const pos = this.nodeCanvas.autoOffset(x, y);
    const node = createNode(typeId, pos.x, pos.y);
    if (node) {
      this.engine.addNode(node);
      this.nodeCanvas.selectNode(node.id);
      this.paramPanel.showNode(node);
      this._saveState();
    }
    return node;
  }

  _addNodeAtCenter(typeId) {
    const rect = this.nodeCanvas.canvas.getBoundingClientRect();
    const world = this.nodeCanvas.screenToWorld(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    return this._addNode(typeId, world.x - 85, world.y - 40);
  }

  _createPreviewPanel() {
    const panelCount = this._previewPanels.length;
    const panel = new PreviewPanel({
      engine: this.engine,
      x: 20 + panelCount * 30,
      y: window.innerHeight - 280 - panelCount * 20,
      width: 380,
      height: 260,
      onClose: (p) => {
        this._previewPanels = this._previewPanels.filter(pp => pp !== p);
      },
    });
    panel.refreshScreenList();
    this._previewPanels.push(panel);
  }

  _addDemoNodes() {
    const shape = this._addNode('Shape', 50, 80);
    const text = this._addNode('Text', 50, 300);
    const pool = this._addNode('RenderPool', 320, 160);
    const renderer = this._addNode('Renderer', 560, 160);
    const screen = this._addNode('Screen', 800, 160);
    const color = this._addNode('Color', -200, 80);

    if (shape && pool)
      this.engine.connectionMgr.addConnection(shape.id, 0, pool.id, 0, this.engine.nodeMap);
    if (text && pool)
      this.engine.connectionMgr.addConnection(text.id, 0, pool.id, 0, this.engine.nodeMap);
    if (pool && renderer)
      this.engine.connectionMgr.addConnection(pool.id, 0, renderer.id, 0, this.engine.nodeMap);
    if (renderer && screen)
      this.engine.connectionMgr.addConnection(renderer.id, 0, screen.id, 0, this.engine.nodeMap);

    this.nodeCanvas.deselectNode();
    this.paramPanel.clear();
    this.engine.evaluate();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
