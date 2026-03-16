/**
 * WindowManager — V2 with per-screen window management
 */

export class WindowManager {
  constructor() {
    /** @type {Map<string, {win: Window, screenNodeId: string}>} */
    this.windows = new Map();

    window.addEventListener('beforeunload', () => this.closeAll());
  }

  /**
   * Create or get output window for a specific screen node
   * @param {string} screenNodeId
   * @param {number} w - resolution width
   * @param {number} h - resolution height
   * @param {string} title
   * @returns {Window|null}
   */
  openForScreen(screenNodeId, w, h, title) {
    // If already open, return existing
    const existing = this.windows.get(screenNodeId);
    if (existing && !existing.win.closed) return existing.win;

    const win = window.open(
      `/output.html?id=${screenNodeId}`,
      screenNodeId,
      `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );

    if (win) {
      if (title) {
        // Set title after load
        win.addEventListener('load', () => { win.document.title = title; });
      }
      this.windows.set(screenNodeId, { win, screenNodeId });

      const check = setInterval(() => {
        if (win.closed) {
          clearInterval(check);
          this.windows.delete(screenNodeId);
        }
      }, 500);
    }

    return win;
  }

  /**
   * Send render data to a specific screen's window
   */
  sendToScreen(screenNodeId, dataUrl, w, h) {
    const entry = this.windows.get(screenNodeId);
    if (entry && !entry.win.closed) {
      entry.win.postMessage({ type: 'render', dataUrl, w, h }, '*');
    }
  }

  /**
   * Close a specific screen's window
   */
  closeScreen(screenNodeId) {
    const entry = this.windows.get(screenNodeId);
    if (entry && !entry.win.closed) entry.win.close();
    this.windows.delete(screenNodeId);
  }

  /**
   * Check if screen has an open window
   */
  isScreenOpen(screenNodeId) {
    const entry = this.windows.get(screenNodeId);
    if (entry && !entry.win.closed) return true;
    this.windows.delete(screenNodeId);
    return false;
  }

  closeAll() {
    for (const [, entry] of this.windows) {
      if (!entry.win.closed) entry.win.close();
    }
    this.windows.clear();
  }

  get count() {
    for (const [id, entry] of this.windows) {
      if (entry.win.closed) this.windows.delete(id);
    }
    return this.windows.size;
  }
}
