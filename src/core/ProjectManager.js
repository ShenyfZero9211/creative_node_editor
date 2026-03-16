/**
 * ProjectManager — save/load project as JSON files
 */

import { createNode } from '../nodes/NodeRegistry.js';
import { Node } from './Node.js';

export class ProjectManager {
  /**
   * @param {import('./RenderEngine.js').RenderEngine} engine
   */
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * Serialize the entire project to JSON
   */
  serialize() {
    const nodes = [];
    for (const [, node] of this.engine.nodeMap) {
      nodes.push(node.toJSON());
    }

    const connections = this.engine.connectionMgr.connections.map(c => ({
      fromNodeId: c.fromNodeId,
      fromPortIndex: c.fromPortIndex,
      toNodeId: c.toNodeId,
      toPortIndex: c.toPortIndex,
    }));

    return {
      version: 1,
      timestamp: Date.now(),
      nodes,
      connections,
    };
  }

  /**
   * Save project — download as .json file
   */
  saveProject(filename = 'project.cne') {
    const data = this.serialize();
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Load project from JSON data
   * @param {Object} data
   * @param {Function} onNodeAdded - callback for each created node
   */
  loadProject(data, onNodeAdded) {
    if (!data || !data.nodes) {
      console.error('Invalid project data');
      return;
    }

    // Clear existing
    const ids = [...this.engine.nodeMap.keys()];
    for (const id of ids) {
      this.engine.removeNode(id);
    }

    // Find max ID number to avoid collision
    let maxId = 0;
    for (const nd of data.nodes) {
      const num = parseInt(nd.id.replace('node_', ''));
      if (num > maxId) maxId = num;
    }
    Node.resetIdCounter(maxId);

    // Create nodes with original IDs
    const nodeMap = new Map();
    for (const nd of data.nodes) {
      const node = createNode(nd.type, nd.x, nd.y);
      if (!node) continue;

      // Override the auto-generated ID with the saved ID
      node.id = nd.id;

      // Restore param values
      for (const [key, val] of Object.entries(nd.paramValues || {})) {
        if (key in node.paramValues) {
          node.paramValues[key] = val;
        }
      }

      // Restore param input toggles
      for (const [key, val] of Object.entries(nd.paramInputEnabled || {})) {
        if (key in node.paramInputEnabled) {
          node.paramInputEnabled[key] = val;
          node.toggleParamInput(key, val);
        }
      }

      // Special handling for TransformNode custom ports
      if (node._updateCustomPorts) {
        node._updateCustomPorts();
      }

      this.engine.addNode(node);
      nodeMap.set(nd.id, node);
      if (onNodeAdded) onNodeAdded(node);
    }

    // Restore connections
    for (const conn of (data.connections || [])) {
      this.engine.connectionMgr.addConnection(
        conn.fromNodeId, conn.fromPortIndex,
        conn.toNodeId, conn.toPortIndex,
        this.engine.nodeMap
      );
    }

    this.engine.evaluate();
  }

  /**
   * Open file dialog and load project
   */
  openProject(onNodeAdded) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cne,.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          this.loadProject(data, onNodeAdded);
        } catch (err) {
          console.error('Failed to load project:', err);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  /** Create new empty project */
  newProject() {
    const ids = [...this.engine.nodeMap.keys()];
    for (const id of ids) {
      this.engine.removeNode(id);
    }
    Node.resetIdCounter(0);
    this.engine.evaluate();
  }
}
