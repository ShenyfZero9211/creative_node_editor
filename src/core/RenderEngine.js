/**
 * RenderEngine — V2 pipeline: Renderable → RenderPool → Renderer → Screen
 */

import { ConnectionManager } from './Connection.js';

export class RenderEngine {
  constructor() {
    /** @type {Map<string, import('./Node.js').Node>} */
    this.nodeMap = new Map();
    this.connectionMgr = new ConnectionManager();

    /** @type {HTMLCanvasElement} */
    this.previewCanvas = null;
    this.previewCtx = null;

    // Default preview size
    this.previewWidth = 800;
    this.previewHeight = 600;

    // Window manager reference (set externally)
    this.windowManager = null;

    this._animating = false;

    // Per-screen offscreen canvases
    /** @type {Map<string, {canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}>} */
    this._screenBuffers = new Map();

    // Live port value tracking (for display on selected nodes)
    /** nodeId → output value */
    this.lastOutputValues = new Map();
    /** nodeId → inputValues array */
    this.lastInputValues = new Map();
  }

  setPreviewCanvas(canvas) {
    this.previewCanvas = canvas;
    this.previewCtx = canvas.getContext('2d');
    canvas.width = this.previewWidth;
    canvas.height = this.previewHeight;
    this._fitPreview();
  }

  _fitPreview() {
    if (!this.previewCanvas) return;
    const parent = this.previewCanvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const aspect = this.previewWidth / this.previewHeight;
    const parentAspect = (rect.width - 16) / (rect.height - 16);
    if (parentAspect > aspect) {
      this.previewCanvas.style.height = (rect.height - 16) + 'px';
      this.previewCanvas.style.width = (rect.height - 16) * aspect + 'px';
    } else {
      this.previewCanvas.style.width = (rect.width - 16) + 'px';
      this.previewCanvas.style.height = (rect.width - 16) / aspect + 'px';
    }
  }

  addNode(node) {
    this.nodeMap.set(node.id, node);
    this.evaluate();
  }

  removeNode(nodeId) {
    this.removeNodes([nodeId]);
  }

  /**
   * Delete multiple nodes efficiently
   * @param {string[]} nodeIds 
   */
  removeNodes(nodeIds) {
    if (!nodeIds || nodeIds.length === 0) return;
    for (const id of nodeIds) {
      this.connectionMgr.removeNodeConnections(id);
      this.nodeMap.delete(id);
      this._screenBuffers.delete(id);
    }
    this.evaluate();
  }

  /** Return all Screen nodes for preview panel selectors */
  getScreenNodes() {
    const screens = [];
    for (const [, node] of this.nodeMap) {
      if (node.type === 'Screen') screens.push(node);
    }
    return screens;
  }

  /**
   * Evaluate the full graph and render all screens
   */
  evaluate() {
    const order = this.connectionMgr.topologicalSort(this.nodeMap);
    const outputValues = new Map(); // nodeId → output value

    for (const nodeId of order) {
      const node = this.nodeMap.get(nodeId);
      if (!node) continue;

      const inputConns = this.connectionMgr.getInputConnections(nodeId);

      if (node.type === 'RenderPool') {
        // RenderPool: collect all renderSource inputs as array
        const sources = [];
        const seenIds = new Set();
        for (const conn of inputConns) {
          if (conn.toPortIndex === 0) {
            const sourceVal = outputValues.get(conn.fromNodeId);
            const val = Array.isArray(sourceVal) ? sourceVal[conn.fromPortIndex] : sourceVal;
            
            if (val && val.type === 'renderSource') {
              if (val.elementId && seenIds.has(val.elementId)) continue;
              if (val.elementId) seenIds.add(val.elementId);
              sources.push(val);
            }
          }
        }
        const inputArr = [sources];
        this.lastInputValues.set(nodeId, inputArr);
        const result = node.evaluate(inputArr);
        outputValues.set(nodeId, result);
      } else {
        // Standard: single value per input port
        const inputArr = new Array(node.inputs.length).fill(null);
        for (const conn of inputConns) {
          if (conn.toPortIndex < inputArr.length) {
            const sourceVal = outputValues.get(conn.fromNodeId);
            // If the source node returned an array, pick the value at fromPortIndex
            // Otherwise, just use the value as is (for backwards compatibility/single output)
            inputArr[conn.toPortIndex] = Array.isArray(sourceVal) ? sourceVal[conn.fromPortIndex] : sourceVal;
          }
        }
        const result = node.evaluate(inputArr);
        outputValues.set(nodeId, result);
        this.lastInputValues.set(nodeId, inputArr);
      }
    }

    // Persist output values for port display
    this.lastOutputValues = outputValues;

    // Render all Screen nodes
    this._renderScreens(outputValues);
  }

  _renderScreens(outputValues) {
    // Find all screen nodes
    const screenNodes = [];
    for (const [id, node] of this.nodeMap) {
      if (node.type === 'Screen') {
        screenNodes.push(node);
      }
    }

    // If no screen nodes, render first available render pool to preview
    if (screenNodes.length === 0) {
      this._renderPreviewFallback(outputValues);
      return;
    }

    // Render each screen
    let firstScreen = true;
    for (const screenNode of screenNodes) {
      const screenData = outputValues.get(screenNode.id);
      const rw = screenNode.paramValues.resolutionW || 800;
      const rh = screenNode.paramValues.resolutionH || 600;

      // Get or create offscreen buffer for this screen
      let buf = this._screenBuffers.get(screenNode.id);
      if (!buf || buf.canvas.width !== rw || buf.canvas.height !== rh) {
        const c = document.createElement('canvas');
        c.width = rw;
        c.height = rh;
        buf = { canvas: c, ctx: c.getContext('2d') };
        this._screenBuffers.set(screenNode.id, buf);
      }

      const ctx = buf.ctx;
      ctx.clearRect(0, 0, rw, rh);

      // Background
      const bgColor = screenData?.bgColor || '#000000';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, rw, rh);

      // Draw all renderables
      if (screenData && screenData.drawables) {
        const sorted = [...screenData.drawables].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        for (const item of sorted) {
          if (item.draw) {
            ctx.save();
            item.draw(ctx, rw, rh);
            ctx.restore();
          }
        }
      }

      // First screen → preview
      if (firstScreen) {
        this.previewWidth = rw;
        this.previewHeight = rh;
        if (this.previewCanvas) {
          this.previewCanvas.width = rw;
          this.previewCanvas.height = rh;
          this._fitPreview();
          this.previewCtx.clearRect(0, 0, rw, rh);
          this.previewCtx.drawImage(buf.canvas, 0, 0);
        }
        firstScreen = false;
      }

      // Send to output window if one exists for this screen
      if (this.windowManager) {
        const dataUrl = buf.canvas.toDataURL('image/png');
        this.windowManager.sendToScreen(screenNode.id, dataUrl, rw, rh);
      }
    }
  }

  _renderPreviewFallback(outputValues) {
    // Try to find any renderable output and display it
    if (!this.previewCanvas) return;
    const ctx = this.previewCtx;
    const rw = this.previewWidth;
    const rh = this.previewHeight;
    ctx.clearRect(0, 0, rw, rh);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, rw, rh);

    for (const [nodeId, val] of outputValues) {
      if (val && val.type === 'renderSource' && val.draw) {
        ctx.save();
        val.draw(ctx, rw, rh);
        ctx.restore();
      }
    }
  }

  startLoop() {
    if (this._animating) return;
    this._animating = true;
    const loop = () => {
      if (!this._animating) return;
      this.evaluate();
      requestAnimationFrame(loop);
    };
    loop();
  }

  stopLoop() {
    this._animating = false;
  }
}
