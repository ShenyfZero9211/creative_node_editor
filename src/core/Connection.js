/**
 * Connection Manager — V2 with multi-input support for RenderPool
 */

export class Connection {
  constructor(fromNodeId, fromPortIndex, toNodeId, toPortIndex) {
    this.id = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.fromNodeId = fromNodeId;
    this.fromPortIndex = fromPortIndex;
    this.toNodeId = toNodeId;
    this.toPortIndex = toPortIndex;
  }
}

export class ConnectionManager {
  constructor() {
    /** @type {Connection[]} */
    this.connections = [];
  }

  /**
   * Add a connection.
   * For RenderPool: allows multiple connections to the same input slot.
   * For other nodes: replaces existing connection on the same input.
   * @param {string} fromNodeId
   * @param {number} fromPortIndex
   * @param {string} toNodeId
   * @param {number} toPortIndex
   * @param {Map<string, import('./Node.js').Node>} nodeMap
   */
  addConnection(fromNodeId, fromPortIndex, toNodeId, toPortIndex, nodeMap) {
    if (fromNodeId === toNodeId) return null;

    const fromNode = nodeMap.get(fromNodeId);
    const toNode = nodeMap.get(toNodeId);
    if (!fromNode || !toNode) return null;

    // Type compatibility check
    const fromPort = fromNode.outputs[fromPortIndex];
    const toPort = toNode.inputs[toPortIndex];
    if (fromPort && toPort && !this._isTypeCompatible(fromPort.dataType, toPort.dataType)) {
      console.warn(`Type mismatch: ${fromPort.dataType} → ${toPort.dataType}`);
      return null;
    }

    // RenderPool nodes accept multiple connections to same slot
    if (toNode.type === 'RenderPool') {
      const exists = this.connections.find(
        c => c.fromNodeId === fromNodeId && c.fromPortIndex === fromPortIndex &&
             c.toNodeId === toNodeId && c.toPortIndex === toPortIndex
      );
      if (exists) return null;
    } else {
      // Regular: one connection per input port
      this.connections = this.connections.filter(
        c => !(c.toNodeId === toNodeId && c.toPortIndex === toPortIndex)
      );
    }

    const conn = new Connection(fromNodeId, fromPortIndex, toNodeId, toPortIndex);
    this.connections.push(conn);

    if (toNode) toNode.markDirty();
    return conn;
  }

  /**
   * Check if two port data types are compatible
   */
  _isTypeCompatible(fromType, toType) {
    if (fromType === toType) return true;
    if (fromType === 'any' || toType === 'any') return true;

    // Compatible groups
    const numericTypes = new Set(['number', 'float', 'integer']);
    if (numericTypes.has(fromType) && numericTypes.has(toType)) return true;

    // Render pipeline types
    const renderTypes = new Set(['renderSource', 'renderData', 'screenData']);
    // renderSource → renderData is OK (renderPool collects sources into data)
    // But we shouldn't cross render pipeline with value types
    if (renderTypes.has(fromType) && !renderTypes.has(toType)) return false;
    if (!renderTypes.has(fromType) && renderTypes.has(toType)) return false;

    return false;
  }

  removeConnection(connId) {
    this.connections = this.connections.filter(c => c.id !== connId);
  }

  removeNodeConnections(nodeId) {
    this.connections = this.connections.filter(
      c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
    );
  }

  /**
   * Remove connections involving a specific input port of a node
   */
  removePortConnections(nodeId, portIndex) {
    this.connections = this.connections.filter(
      c => !(c.toNodeId === nodeId && c.toPortIndex === portIndex)
    );
  }

  /**
   * Synchronize connection indices after a node's ports are rebuilt.
   * Uses stable identifiers (port name/key) to maintain connections.
   * @param {string} nodeId
   * @param {Port[]} oldInputs - the inputs array BEFORE the rebuild
   * @param {Port[]} newInputs - the inputs array AFTER the rebuild
   */
  syncNodeConnections(nodeId, oldInputs, newInputs) {
    const nodeConns = this.getInputConnections(nodeId);
    if (nodeConns.length === 0) return;

    // Create a mapping from old index -> stable ID (name/key)
    const oldIndexToId = new Map();
    oldInputs.forEach((p, idx) => {
      const stableId = p.paramKey || `fixed_${p.name}`;
      oldIndexToId.set(idx, stableId);
    });

    // Create a mapping from stable ID -> new index
    const idToNewIndex = new Map();
    newInputs.forEach((p, idx) => {
      const stableId = p.paramKey || `fixed_${p.name}`;
      idToNewIndex.set(stableId, idx);
    });

    const removedPorts = new Set();

    // Update or remove connections
    this.connections = this.connections.filter(c => {
      if (c.toNodeId !== nodeId) return true;
      
      const stableId = oldIndexToId.get(c.toPortIndex);
      const newIdx = idToNewIndex.get(stableId);

      if (newIdx !== undefined) {
        c.toPortIndex = newIdx;
        return true;
      } else {
        // Port no longer exists
        removedPorts.add(c.toPortIndex);
        return false;
      }
    });

    return removedPorts;
  }

  getInputConnections(nodeId) {
    return this.connections.filter(c => c.toNodeId === nodeId);
  }

  getOutputConnections(nodeId) {
    return this.connections.filter(c => c.fromNodeId === nodeId);
  }

  /**
   * Get all connections targeting a specific input port (for RenderPool multi-input)
   */
  getPortInputConnections(nodeId, portIndex) {
    return this.connections.filter(c => c.toNodeId === nodeId && c.toPortIndex === portIndex);
  }

  /**
   * Topological sort
   */
  topologicalSort(nodeMap) {
    const visited = new Set();
    const result = [];
    const visiting = new Set();

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) return;
      visiting.add(nodeId);

      const inConns = this.getInputConnections(nodeId);
      for (const conn of inConns) {
        visit(conn.fromNodeId);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      result.push(nodeId);
    };

    for (const nodeId of nodeMap.keys()) {
      visit(nodeId);
    }

    return result;
  }

  /**
   * Hit test a connection line
   */
  hitTestConnection(px, py, nodeMap, threshold = 8) {
    for (const conn of this.connections) {
      const fromNode = nodeMap.get(conn.fromNodeId);
      const toNode = nodeMap.get(conn.toNodeId);
      if (!fromNode || !toNode) continue;

      const start = fromNode.getPortGlobalPos('output', conn.fromPortIndex);
      const end = toNode.getPortGlobalPos('input', conn.toPortIndex);

      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        const p1 = bezierPoint(start, end, t1);
        const p2 = bezierPoint(start, end, t2);
        const dist = pointToSegmentDist(px, py, p1.x, p1.y, p2.x, p2.y);
        if (dist < threshold) return conn.id;
      }
    }
    return null;
  }
}

function bezierPoint(start, end, t) {
  const cx = (start.x + end.x) / 2;
  const cp1x = cx, cp1y = start.y;
  const cp2x = cx, cp2y = end.y;
  const mt = 1 - t;
  return {
    x: mt*mt*mt*start.x + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*end.x,
    y: mt*mt*mt*start.y + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*end.y,
  };
}

function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx*dx + dy*dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1)*dx + (py - y1)*dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t*dx), py - (y1 + t*dy));
}
