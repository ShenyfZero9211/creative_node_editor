/**
 * NodeCanvas — V3 with multi-select, box selection, right-click pan
 */

const PORT_COLORS = {
  any: '#8b949e',
  color: '#f0883e',
  number: '#3fb950',
  float: '#39d2c0',
  integer: '#3fb950',
  renderSource: '#58a6ff',
  renderData: '#bc8cff',
  screenData: '#d29922',
  string: '#f778ba',
  url: '#f778ba',
};

export class NodeCanvas {
  constructor(canvasEl, engine) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.engine = engine;

    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 1;

    // Dragging
    this.draggingNode = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // Multi-drag offsets (for multi-select drag)
    this._multiDragOffsets = new Map(); // nodeId → {dx, dy}

    // Panning (middle-click or right-click drag)
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;

    // Connection dragging
    this.isConnecting = false;
    this.connectFromNode = null;
    this.connectFromPort = null;
    this.connectMouseX = 0;
    this.connectMouseY = 0;

    // Multi-select
    /** @type {Set<string>} */
    this.selectedNodeIds = new Set();
    this.onNodeSelect = null;      // (node) => void  -- single node
    this.onMultiSelect = null;     // (nodes) => void
    this.onNodeDeselect = null;

    // Box selection
    this.isBoxSelecting = false;
    this.boxStartX = 0;
    this.boxStartY = 0;
    this.boxEndX = 0;
    this.boxEndY = 0;

    // Right-click tracking (to distinguish click vs drag)
    this._rightDown = false;
    this._rightStartX = 0;
    this._rightStartY = 0;
    this._rightMoved = false;

    // Click tracking for connection
    this._mouseDownTime = 0;
    this._mouseDownX = 0;
    this._mouseDownY = 0;

    // Context menu callback
    this.onContextMenu = null; // (worldX, worldY, screenX, screenY, hitNodeId|null) => void
    this.onConnectionChange = null;

    // Minimap
    this.showMinimap = false;
    this._minimapCanvas = document.getElementById('minimap-canvas');
    this._minimapCtx = this._minimapCanvas?.getContext('2d');

    this._resize();
    this._bindEvents();
    this._animate();
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resize());
    const c = this.canvas;
    c.addEventListener('mousedown', (e) => this._onMouseDown(e));
    c.addEventListener('mousemove', (e) => this._onMouseMove(e));
    c.addEventListener('mouseup', (e) => this._onMouseUp(e));
    c.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    c.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // always prevent browser menu
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isConnecting) {
        this._cancelConnecting();
      }
    });
  }

  screenToWorld(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (sx - rect.left - this.offsetX) / this.zoom,
      y: (sy - rect.top - this.offsetY) / this.zoom,
    };
  }

  _onMouseDown(e) {
    // Right button → start panning or context menu
    if (e.button === 2) {
      this._rightDown = true;
      this._rightStartX = e.clientX;
      this._rightStartY = e.clientY;
      this._rightMoved = false;
      this.isPanning = true;
      this.panStartX = e.clientX - this.offsetX;
      this.panStartY = e.clientY - this.offsetY;
      this.canvas.classList.add('dragging');
      return;
    }

    // Middle button → pan
    if (e.button === 1) {
      this.isPanning = true;
      this.panStartX = e.clientX - this.offsetX;
      this.panStartY = e.clientY - this.offsetY;
      this.canvas.classList.add('dragging');
      return;
    }

    // Left button
    const world = this.screenToWorld(e.clientX, e.clientY);
    const nodes = this.engine.nodeMap;

    // Port hit
    for (const node of nodes.values()) {
      const portHit = node.hitTestPort(world.x, world.y);
      if (portHit) {
        // If already connecting, try to complete it (even if it's a mouse down)
        if (this.isConnecting && portHit.kind === 'input') {
          this._tryCompleteConnection(node, portHit);
          return;
        }

        if (portHit.kind === 'output') {
          this.isConnecting = true;
          this.connectFromNode = node;
          this.connectFromPort = portHit;
          this.connectMouseX = world.x;
          this.connectMouseY = world.y;
          this.canvas.classList.add('connecting');
        } else {
          // Drag from existing input connection
          const existing = this.engine.connectionMgr.getInputConnections(node.id)
            .find(c => c.toPortIndex === portHit.index);
          if (existing) {
            const fromNode = nodes.get(existing.fromNodeId);
            this.engine.connectionMgr.removeConnection(existing.id);
            this.isConnecting = true;
            this.connectFromNode = fromNode;
            this.connectFromPort = { kind: 'output', index: existing.fromPortIndex };
            this.connectMouseX = world.x;
            this.connectMouseY = world.y;
            this.canvas.classList.add('connecting');
            if (this.onConnectionChange) this.onConnectionChange();
          }
        }
        // Track for click detection
        this._mouseDownTime = Date.now();
        this._mouseDownX = e.clientX;
        this._mouseDownY = e.clientY;
        return;
      }
    }

    // If already in connecting mode but clicked elsewhere, cancel it UNLESS it's a very fast drag
    if (this.isConnecting) {
      this._cancelConnecting();
    }

    // Node hit
    const nodeArr = [...nodes.values()].reverse();
    for (const node of nodeArr) {
      if (node.hitTest(world.x, world.y)) {
        const isCtrl = e.ctrlKey || e.metaKey;

        if (isCtrl) {
          // Toggle selection of this node
          if (this.selectedNodeIds.has(node.id)) {
            this.selectedNodeIds.delete(node.id);
            node.selected = false;
          } else {
            this.selectedNodeIds.add(node.id);
            node.selected = true;
          }
          this._notifySelection();
        } else {
          // If clicking on an already-selected node in a multi-select, don't reset
          if (!this.selectedNodeIds.has(node.id)) {
            this._deselectAll();
            this.selectedNodeIds.add(node.id);
            node.selected = true;
            this._notifySelection();
          }
        }

        // Start dragging (multi or single)
        this.draggingNode = node;
        this.dragOffsetX = world.x - node.x;
        this.dragOffsetY = world.y - node.y;

        // Compute offsets for all selected nodes
        this._multiDragOffsets.clear();
        for (const id of this.selectedNodeIds) {
          const n = nodes.get(id);
          if (n) {
            this._multiDragOffsets.set(id, {
              dx: world.x - n.x,
              dy: world.y - n.y,
            });
          }
        }
        this.canvas.classList.add('dragging');
        return;
      }
    }

    // Click on empty space → start box selection
    if (!e.ctrlKey) {
      this._deselectAll();
    }
    this.isBoxSelecting = true;
    this.boxStartX = world.x;
    this.boxStartY = world.y;
    this.boxEndX = world.x;
    this.boxEndY = world.y;
  }

  _onMouseMove(e) {
    if (this.isPanning) {
      const dx = e.clientX - this._rightStartX;
      const dy = e.clientY - this._rightStartY;
      if (this._rightDown && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        this._rightMoved = true;
      }
      this.offsetX = e.clientX - this.panStartX;
      this.offsetY = e.clientY - this.panStartY;
      return;
    }

    const world = this.screenToWorld(e.clientX, e.clientY);

    if (this.draggingNode) {
      if (this.selectedNodeIds.size > 1) {
        // Multi-drag
        for (const [id, off] of this._multiDragOffsets) {
          const n = this.engine.nodeMap.get(id);
          if (n) {
            n.x = world.x - off.dx;
            n.y = world.y - off.dy;
          }
        }
      } else {
        this.draggingNode.x = world.x - this.dragOffsetX;
        this.draggingNode.y = world.y - this.dragOffsetY;
      }
      return;
    }

    if (this.isConnecting) {
      this.connectMouseX = world.x;
      this.connectMouseY = world.y;
      return;
    }

    if (this.isBoxSelecting) {
      this.boxEndX = world.x;
      this.boxEndY = world.y;
      return;
    }

    let cursor = 'default';
    for (const node of this.engine.nodeMap.values()) {
      if (node.hitTestPort(world.x, world.y)) { cursor = 'crosshair'; break; }
      if (node.hitTest(world.x, world.y)) { cursor = 'pointer'; break; }
    }
    this.canvas.style.cursor = cursor;
  }

  _onMouseUp(e) {
    // Right-click release without moving → context menu
    if (e.button === 2 && this._rightDown) {
      this._rightDown = false;
      this.isPanning = false;
      this.canvas.classList.remove('dragging');

      if (!this._rightMoved) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        // Check if right-clicking on a node
        let hitNodeId = null;
        const nodeArr = [...this.engine.nodeMap.values()].reverse();
        for (const node of nodeArr) {
          if (node.hitTest(world.x, world.y)) {
            hitNodeId = node.id;
            // If right-clicking a non-selected node, select it alone
            if (!this.selectedNodeIds.has(node.id)) {
              this._deselectAll();
              this.selectedNodeIds.add(node.id);
              node.selected = true;
              this._notifySelection();
            }
            break;
          }
        }
        if (this.onContextMenu) {
          this.onContextMenu(world.x, world.y, e.clientX, e.clientY, hitNodeId);
        }
      }
      return;
    }

    if (this.isConnecting) {
      const world = this.screenToWorld(e.clientX, e.clientY);
      const isDrag = (Date.now() - this._mouseDownTime > 300) || 
                     (Math.hypot(e.clientX - this._mouseDownX, e.clientY - this._mouseDownY) > 5);

      for (const node of this.engine.nodeMap.values()) {
        const portHit = node.hitTestPort(world.x, world.y);
        if (portHit && portHit.kind === 'input' && node.id !== this.connectFromNode.id) {
          this._tryCompleteConnection(node, portHit);
          return;
        }
      }
      
      // If it was a drag and we released on nothing, cancel
      if (isDrag) {
        this._cancelConnecting();
      }
      // If it's a short click, we keep isConnecting = true (it will follow mouse in move)
      return;
    }

    if (this.isBoxSelecting) {
      // Select all nodes inside the box
      const x1 = Math.min(this.boxStartX, this.boxEndX);
      const y1 = Math.min(this.boxStartY, this.boxEndY);
      const x2 = Math.max(this.boxStartX, this.boxEndX);
      const y2 = Math.max(this.boxStartY, this.boxEndY);

      // Only select if the box has some area (not just a click)
      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        for (const node of this.engine.nodeMap.values()) {
          node.computeHeight();
          const nx = node.x, ny = node.y;
          const nw = node.width, nh = node.height;
          // Node overlaps box
          if (nx + nw > x1 && nx < x2 && ny + nh > y1 && ny < y2) {
            this.selectedNodeIds.add(node.id);
            node.selected = true;
          }
        }
        this._notifySelection();
      }
      this.isBoxSelecting = false;
    }

    if (this.draggingNode) {
      if (this.onDragEnd) this.onDragEnd();
    }
    this.draggingNode = null;
    this._multiDragOffsets.clear();
    this.isPanning = false;
    this.canvas.classList.remove('dragging');
  }

  _tryCompleteConnection(targetNode, targetPort) {
    if (!this.connectFromNode || !this.connectFromPort) return;
    
    // Type compatibility check
    const fromP = this.connectFromNode.outputs[this.connectFromPort.index];
    const toP = targetNode.inputs[targetPort.index];
    if (fromP && toP && !this.engine.connectionMgr._isTypeCompatible(fromP.dataType, toP.dataType)) {
      console.warn(`Type mismatch: ${fromP.dataType} -> ${toP.dataType}`);
      this._cancelConnecting();
      return;
    }

    this.engine.connectionMgr.addConnection(
      this.connectFromNode.id, this.connectFromPort.index,
      targetNode.id, targetPort.index,
      this.engine.nodeMap
    );
    this.engine.evaluate();
    if (this.onConnectionChange) this.onConnectionChange();
    this._cancelConnecting();
  }

  _cancelConnecting() {
    this.isConnecting = false;
    this.connectFromNode = null;
    this.connectFromPort = null;
    this.canvas.classList.remove('connecting');
  }

  _onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(3, Math.max(0.1, this.zoom * zoomFactor));
    this.offsetX = mx - (mx - this.offsetX) * (newZoom / this.zoom);
    this.offsetY = my - (my - this.offsetY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    const zoomEl = document.getElementById('zoom-level');
    if (zoomEl) zoomEl.textContent = Math.round(this.zoom * 100) + '%';
  }

  // ===== Selection API =====

  selectNode(nodeId) {
    this._deselectAll();
    const node = this.engine.nodeMap.get(nodeId);
    if (node) {
      this.selectedNodeIds.add(nodeId);
      node.selected = true;
      if (this.onNodeSelect) this.onNodeSelect(node);
    }
  }

  deselectNode() {
    this._deselectAll();
  }

  selectAll() {
    for (const node of this.engine.nodeMap.values()) {
      this.selectedNodeIds.add(node.id);
      node.selected = true;
    }
    this._notifySelection();
  }

  getSelectedNodes() {
    const nodes = [];
    for (const id of this.selectedNodeIds) {
      const n = this.engine.nodeMap.get(id);
      if (n) nodes.push(n);
    }
    return nodes;
  }

  deleteSelectedNodes() {
    if (this.selectedNodeIds.size === 0) return;
    this.engine.removeNodes([...this.selectedNodeIds]);
    this.selectedNodeIds.clear();
    if (this.onNodeDeselect) this.onNodeDeselect();
  }

  /**
   * Find connections that exist only between the given nodes
   * @param {import('./Node.js').Node[]} nodes 
   */
  getInternalConnections(nodes) {
    const nodeIds = new Set(nodes.map(n => n.id));
    return this.engine.connectionMgr.connections.filter(c => 
      nodeIds.has(c.fromNodeId) && nodeIds.has(c.toNodeId)
    );
  }

  /** Fit view to all nodes */
  fitAll() {
    const nodes = [...this.engine.nodeMap.values()];
    if (nodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      n.computeHeight();
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }
    const rect = this.canvas.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const pad = 60;
    const graphW = maxX - minX + pad * 2;
    const graphH = maxY - minY + pad * 2;
    this.zoom = Math.min(cw / graphW, ch / graphH, 2);
    this.offsetX = (cw - graphW * this.zoom) / 2 - (minX - pad) * this.zoom;
    this.offsetY = (ch - graphH * this.zoom) / 2 - (minY - pad) * this.zoom;
    const zoomEl = document.getElementById('zoom-level');
    if (zoomEl) zoomEl.textContent = Math.round(this.zoom * 100) + '%';
  }

  resetView() {
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 1;
    const zoomEl = document.getElementById('zoom-level');
    if (zoomEl) zoomEl.textContent = '100%';
  }

  _deselectAll() {
    for (const id of this.selectedNodeIds) {
      const n = this.engine.nodeMap.get(id);
      if (n) n.selected = false;
    }
    this.selectedNodeIds.clear();
    if (this.onNodeDeselect) this.onNodeDeselect();
  }

  _notifySelection() {
    const nodes = this.getSelectedNodes();
    if (nodes.length === 1) {
      if (this.onNodeSelect) this.onNodeSelect(nodes[0]);
    } else if (nodes.length > 1) {
      if (this.onMultiSelect) this.onMultiSelect(nodes);
      else if (this.onNodeDeselect) this.onNodeDeselect();
    } else {
      if (this.onNodeDeselect) this.onNodeDeselect();
    }
  }

  // ===== RENDERING =====

  _animate() {
    this._draw();
    requestAnimationFrame(() => this._animate());
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.canvas.width / devicePixelRatio;
    const h = this.canvas.height / devicePixelRatio;

    ctx.clearRect(0, 0, w, h);

    // Detect overlaps once per frame
    this._nodeOverlapSet = this._detectOverlaps();

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoom, this.zoom);

    this._drawGrid(ctx, w, h);
    this._drawConnections(ctx);

    if (this.isConnecting && this.connectFromNode) {
      const startPos = this.connectFromNode.getPortGlobalPos('output', this.connectFromPort.index);
      this._drawBezier(ctx, startPos.x, startPos.y, this.connectMouseX, this.connectMouseY, '#58a6ff', 2, true);
    }

    for (const node of this.engine.nodeMap.values()) {
      this._drawNode(ctx, node);
    }

    // Draw box selection
    if (this.isBoxSelecting) {
      this._drawSelectionBox(ctx);
    }

    ctx.restore();

    // Draw minimap
    if (this.showMinimap) {
      this._drawMinimap();
    }
  }

  _drawGrid(ctx, w, h) {
    const gridSize = 20;
    const startX = Math.floor(-this.offsetX / this.zoom / gridSize) * gridSize;
    const startY = Math.floor(-this.offsetY / this.zoom / gridSize) * gridSize;
    const endX = startX + w / this.zoom + gridSize * 2;
    const endY = startY + h / this.zoom + gridSize * 2;

    ctx.strokeStyle = 'rgba(48, 54, 61, 0.4)';
    ctx.lineWidth = 0.5 / this.zoom;
    ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = startY; y < endY; y += gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();

    const majorSize = gridSize * 5;
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.7)';
    ctx.lineWidth = 1 / this.zoom;
    ctx.beginPath();
    const msx = Math.floor(startX / majorSize) * majorSize;
    const msy = Math.floor(startY / majorSize) * majorSize;
    for (let x = msx; x < endX; x += majorSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = msy; y < endY; y += majorSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();
  }

  _drawSelectionBox(ctx) {
    const x1 = Math.min(this.boxStartX, this.boxEndX);
    const y1 = Math.min(this.boxStartY, this.boxEndY);
    const x2 = Math.max(this.boxStartX, this.boxEndX);
    const y2 = Math.max(this.boxStartY, this.boxEndY);

    ctx.save();
    ctx.fillStyle = 'rgba(88,166,255,0.08)';
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeStyle = 'rgba(88,166,255,0.5)';
    ctx.lineWidth = 1 / this.zoom;
    ctx.setLineDash([6 / this.zoom, 4 / this.zoom]);
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawConnections(ctx) {
    for (const conn of this.engine.connectionMgr.connections) {
      const fromNode = this.engine.nodeMap.get(conn.fromNodeId);
      const toNode = this.engine.nodeMap.get(conn.toNodeId);
      if (!fromNode || !toNode) continue;

      const start = fromNode.getPortGlobalPos('output', conn.fromPortIndex);
      const end = toNode.getPortGlobalPos('input', conn.toPortIndex);
      const port = fromNode.outputs[conn.fromPortIndex];
      const color = PORT_COLORS[port?.dataType] || PORT_COLORS.any;
      this._drawBezier(ctx, start.x, start.y, end.x, end.y, color, 2);
    }
  }

  _drawBezier(ctx, x1, y1, x2, y2, color, width, dashed = false) {
    const cx = (x1 + x2) / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width / this.zoom;
    if (dashed) ctx.setLineDash([6 / this.zoom, 4 / this.zoom]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cx, y1, cx, y2, x2, y2);
    ctx.stroke();
    if (dashed) ctx.setLineDash([]);
    ctx.restore();
  }

  _drawNode(ctx, node) {
    node.computeHeight();
    const { x, y, width, height, headerHeight } = node;
    const r = 6;

    // Shadow
    ctx.save();
    ctx.shadowColor = node.selected ? 'rgba(88,166,255,0.3)' : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = node.selected ? 14 : 6;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#1c2128';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, r);
    ctx.fill();
    ctx.restore();

    // Border
    const isOverlapping = this._nodeOverlapSet?.has(node.id);
    if (isOverlapping) {
      // Red blinking effect
      const blink = (Math.sin(Date.now() / 150) + 1) / 2;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 60, 60, ${0.4 + blink * 0.6})`;
      ctx.lineWidth = (2 + blink * 2) / this.zoom;
      ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
      ctx.shadowBlur = (10 + blink * 10) / this.zoom;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, r);
      ctx.stroke();
      ctx.restore();
    }
    
    ctx.strokeStyle = node.selected ? '#58a6ff' : '#30363d';
    ctx.lineWidth = node.selected ? 1.5 / this.zoom : 1 / this.zoom;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, r);
    ctx.stroke();

    // Header fill
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, width, headerHeight, [r, r, 0, 0]);
    ctx.clip();
    ctx.fillStyle = node.color + '25';
    ctx.fillRect(x, y, width, headerHeight);
    ctx.restore();

    // Header bottom line
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 0.5 / this.zoom;
    ctx.beginPath();
    ctx.moveTo(x, y + headerHeight);
    ctx.lineTo(x + width, y + headerHeight);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#e6edf3';
    ctx.font = `600 ${11}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(node.icon + ' ' + node.title, x + 8, y + headerHeight / 2);

    // ID badge
    ctx.fillStyle = '#6e7681';
    ctx.font = `400 ${8}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(node.id.replace('node_', '#'), x + width - 6, y + headerHeight / 2);
    ctx.textAlign = 'left';

    // Ports
    this._drawPorts(ctx, node);
  }

  _drawPorts(ctx, node) {
    const portR = 5;
    const isSelected = node.selected;

    const inputVals = isSelected ? this.engine.lastInputValues.get(node.id) : null;
    const outputVal = isSelected ? this.engine.lastOutputValues.get(node.id) : null;

    for (let i = 0; i < node.inputs.length; i++) {
      const pos = node.getPortGlobalPos('input', i);
      const port = node.inputs[i];
      const color = PORT_COLORS[port.dataType] || PORT_COLORS.any;

      if (!port.isFixed) {
        ctx.strokeStyle = color + '60';
        ctx.lineWidth = 2 / this.zoom;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, (portR + 2) / this.zoom, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, portR / this.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 1.5 / this.zoom;
      ctx.stroke();

      ctx.fillStyle = '#8b949e';
      ctx.font = `400 ${10}px Inter, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(port.name, pos.x + 9, pos.y);

      if (isSelected && inputVals && (port.dataType === 'number' || port.dataType === 'float' || port.dataType === 'integer')) {
        const val = inputVals[i];
        if (val !== null && val !== undefined && typeof val === 'number') {
          this._drawValueBadge(ctx, pos.x + 9, pos.y + 11, val, color);
        }
      }
    }

    for (let i = 0; i < node.outputs.length; i++) {
      const pos = node.getPortGlobalPos('output', i);
      const port = node.outputs[i];
      const color = PORT_COLORS[port.dataType] || PORT_COLORS.any;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, portR / this.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 1.5 / this.zoom;
      ctx.stroke();

      ctx.fillStyle = '#8b949e';
      ctx.font = `400 ${10}px Inter, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.fillText(port.name, pos.x - 9, pos.y);

      if (isSelected && outputVal !== null && outputVal !== undefined && (port.dataType === 'number' || port.dataType === 'float' || port.dataType === 'integer')) {
        const val = Array.isArray(outputVal) ? outputVal[i] : outputVal;
        if (val !== null && val !== undefined && typeof val === 'number') {
          this._drawValueBadge(ctx, pos.x - 9, pos.y + 11, val, color, true);
        }
      }
    }
    ctx.textAlign = 'left';
  }

  _drawValueBadge(ctx, x, y, value, color, alignRight = false) {
    const text = Number.isInteger(value) ? value.toString() : value.toFixed(2);
    ctx.font = `600 ${9}px 'JetBrains Mono', monospace`;
    const metrics = ctx.measureText(text);
    const pw = metrics.width + 6;
    const ph = 13;
    const bx = alignRight ? x - pw : x;

    ctx.fillStyle = '#0d1117cc';
    ctx.beginPath();
    ctx.roundRect(bx, y - ph / 2, pw, ph, 3);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(bx, y - ph / 2, 2, ph);

    ctx.fillStyle = '#e6edf3';
    ctx.textBaseline = 'middle';
    ctx.textAlign = alignRight ? 'right' : 'left';
    ctx.fillText(text, alignRight ? bx + pw - 3 : bx + 4, y);
    ctx.textAlign = 'left';
  }

  _drawMinimap() {
    const mc = this._minimapCanvas;
    const mctx = this._minimapCtx;
    if (!mc || !mctx) return;

    const container = mc.parentElement;
    if (!container) return;

    // Show/hide minimap container
    container.style.display = this.showMinimap ? 'block' : 'none';
    if (!this.showMinimap) return;

    const mw = 160;
    const mh = 100;
    mc.width = mw * devicePixelRatio;
    mc.height = mh * devicePixelRatio;
    mc.style.width = mw + 'px';
    mc.style.height = mh + 'px';
    mctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    // Background
    mctx.fillStyle = 'rgba(13,17,23,0.85)';
    mctx.fillRect(0, 0, mw, mh);

    // Compute world bounds from all nodes
    const nodes = [...this.engine.nodeMap.values()];
    if (nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      n.computeHeight();
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }

    const pad = 100;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const scale = Math.min(mw / worldW, mh / worldH);
    const ox = (mw - worldW * scale) / 2;
    const oy = (mh - worldH * scale) / 2;

    // Draw nodes as small colored rectangles
    for (const n of nodes) {
      const nx = ox + (n.x - minX) * scale;
      const ny = oy + (n.y - minY) * scale;
      const nw = Math.max(n.width * scale, 3);
      const nh = Math.max(n.height * scale, 2);
      mctx.fillStyle = n.selected ? '#58a6ff' : (n.color || '#8b949e');
      mctx.fillRect(nx, ny, nw, nh);
    }

    // Draw viewport rectangle
    const rect = this.canvas.getBoundingClientRect();
    const vpLeft = (-this.offsetX / this.zoom);
    const vpTop = (-this.offsetY / this.zoom);
    const vpW = rect.width / this.zoom;
    const vpH = rect.height / this.zoom;

    const vx = ox + (vpLeft - minX) * scale;
    const vy = oy + (vpTop - minY) * scale;
    const vw = vpW * scale;
    const vh = vpH * scale;

    mctx.strokeStyle = 'rgba(255,255,255,0.6)';
    mctx.lineWidth = 1;
    mctx.strokeRect(vx, vy, vw, vh);

    mctx.fillStyle = 'rgba(88,166,255,0.08)';
    mctx.fillRect(vx, vy, vw, vh);
  }

  _detectOverlaps() {
    const overlaps = new Set();
    const nodes = [...this.engine.nodeMap.values()];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        // If nodes are within 5 pixels (inclusive)
        if (Math.abs(a.x - b.x) <= 5 && Math.abs(a.y - b.y) <= 5) {
          // Both are considered overlapping for warning purposes
          overlaps.add(a.id);
          overlaps.add(b.id);
        }
      }
    }
    return overlaps;
  }

  /**
   * Adjust coordinates to avoid perfect overlap with existing nodes
   */
  autoOffset(x, y, padding = 40) {
    let nx = x;
    let ny = y;
    let found;
    do {
      found = false;
      for (const node of this.engine.nodeMap.values()) {
        if (Math.abs(node.x - nx) < 5 && Math.abs(node.y - ny) < 5) {
          nx += padding;
          ny += padding;
          found = true;
          break;
        }
      }
    } while (found);
    return { x: nx, y: ny };
  }
}
