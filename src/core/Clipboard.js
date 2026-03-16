/**
 * Clipboard — manages copy/paste of nodes and properties
 */

import { createNode } from '../nodes/NodeRegistry.js';

export class Clipboard {
  constructor() {
    /** @type {Object[]|null} serialized node data */
    this._nodes = null;
    /** @type {Object[]|null} serialized connection data */
    this._connections = null;
    /** @type {Object|null} copied paramValues for "copy properties" */
    this._properties = null;
    /** @type {string|null} type of node whose properties were copied */
    this._propertiesNodeType = null;
    
    // Internal track for newly created nodes to restore connections
    this._lastPastedConnections = [];
  }

  /**
   * Copy one or more nodes and their internal connections
   * @param {import('./Node.js').Node[]} nodes
   * @param {import('./Connection.js').Connection[]} connections - only internal connections
   */
  copyNodes(nodes, connections = []) {
    this._nodes = nodes.map(n => n.toJSON());
    this._connections = connections.map(c => ({ ...c }));
  }

  /**
   * Copy a single node's paramValues
   * @param {import('./Node.js').Node} node
   */
  copyProperties(node) {
    this._properties = { ...node.paramValues };
    this._propertiesNodeType = node.type;
  }

  /**
   * Copy nodes as JSON text to system clipboard
   * @param {import('./Node.js').Node[]} nodes
   */
  async copyJSON(nodes) {
    const data = nodes.map(n => n.toJSON());
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  }

  /**
   * Paste copied nodes at an offset
   * @param {number} offsetX
   * @param {number} offsetY
   * @returns {import('./Node.js').Node[]} newly created nodes
   */
  paste(offsetX = 30, offsetY = 30) {
    if (!this._nodes || this._nodes.length === 0) return [];

    const newNodes = [];
    const idMap = new Map(); // oldId -> newNode

    // 1. Create all nodes
    for (const data of this._nodes) {
      const node = createNode(data.type, data.x + offsetX, data.y + offsetY);
      if (node) {
        // Restore param values
        for (const [key, val] of Object.entries(data.paramValues)) {
          if (key in node.paramValues) {
            node.paramValues[key] = val;
          }
        }
        // Restore param input toggles
        for (const [key, val] of Object.entries(data.paramInputEnabled || {})) {
          if (key in node.paramInputEnabled) {
            node.paramInputEnabled[key] = val;
            node.toggleParamInput(key, val);
          }
        }
        newNodes.push(node);
        idMap.set(data.id, node);
      }
    }

    // 2. Map internal connections to new nodes
    this._lastPastedConnections = [];
    if (this._connections && this._connections.length > 0) {
      for (const conn of this._connections) {
        const fromNode = idMap.get(conn.fromNodeId);
        const toNode = idMap.get(conn.toNodeId);
        if (fromNode && toNode) {
          this._lastPastedConnections.push({
            fromNodeId: fromNode.id,
            fromPortIndex: conn.fromPortIndex,
            toNodeId: toNode.id,
            toPortIndex: conn.toPortIndex
          });
        }
      }
    }

    return newNodes;
  }

  /**
   * Apply connections to the engine after nodes are added
   */
  applyPastedConnections(connectionMgr, nodeMap) {
    if (!this._lastPastedConnections || this._lastPastedConnections.length === 0) return;
    for (const c of this._lastPastedConnections) {
      connectionMgr.addConnection(c.fromNodeId, c.fromPortIndex, c.toNodeId, c.toPortIndex, nodeMap);
    }
    this._lastPastedConnections = [];
  }

  /**
   * Paste properties onto a target node
   * @param {import('./Node.js').Node} node
   * @returns {boolean}
   */
  pasteProperties(node) {
    if (!this._properties) return false;
    for (const [key, val] of Object.entries(this._properties)) {
      if (key in node.paramValues) {
        node.paramValues[key] = val;
      }
    }
    return true;
  }

  get hasNodes() { return this._nodes && this._nodes.length > 0; }
  get hasProperties() { return !!this._properties; }
}
