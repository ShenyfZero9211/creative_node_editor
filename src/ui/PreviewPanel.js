/**
 * PreviewPanel — Floating preview window with screen selector
 *
 * - Dropdown to select which Screen node to render
 * - Scaled thumbnail rendering (not full-pixel)
 * - "原窗口" button: opens original-ratio view in overlay
 * - Fullscreen support with ESC exit
 */

import { FloatingPanel } from './FloatingPanel.js';

export class PreviewPanel extends FloatingPanel {
  /**
   * @param {Object} opts
   * @param {import('../core/RenderEngine.js').RenderEngine} opts.engine
   * @param {Function} [opts.onClose]
   */
  constructor(opts) {
    super({
      title: '预览',
      x: opts.x ?? 20,
      y: opts.y ?? (window.innerHeight - 260),
      width: opts.width ?? 360,
      height: opts.height ?? 240,
      resizable: true,
      closable: true,
      onClose: opts.onClose,
      className: 'preview-panel',
    });

    this.engine = opts.engine;
    this.selectedScreenId = null;

    // Screen selector dropdown
    this._screenSelect = this.addHeaderSelect([], '', (val) => {
      this.selectedScreenId = val || null;
    });

    // Fullscreen button
    this.fullscreenBtn = this.addHeaderButton('⛶', '全屏渲染 (ESC退出)', () => this._toggleFullscreen());
    this.fullscreenBtn.classList.add('fp-btn-fullscreen');

    // Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'preview-canvas-inner';
    this.canvas.style.cssText = 'width:100%;height:100%;background:#000;border-radius:4px;display:block;';
    this.bodyEl.style.cssText = 'padding:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;';
    this.bodyEl.appendChild(this.canvas);

    this._ctx = this.canvas.getContext('2d');
    this._animLoop = null;
    this._startRendering();

    // Track panel ID
    this._panelId = 'preview_' + Date.now();
    this._isManualFullscreen = false;

    // Listen for fullscreen change
    document.addEventListener('fullscreenchange', () => {
      this._updateFullscreenState();
    });

    // Handle ESC for manual fullscreen with high priority
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isManualFullscreen) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Capture ESC to exit preview first
        this._toggleFullscreen();
      }
    }, true); // Use capture phase
  }

  _updateFullscreenState() {
    const isNativeFS = document.fullscreenElement === this.canvas;
    this._isFullscreen = isNativeFS || this._isManualFullscreen;
    
    // Sync class
    if (this._isManualFullscreen) this.canvas.classList.add('manual-fullscreen');
    else this.canvas.classList.remove('manual-fullscreen');
  }

  _toggleFullscreen() {
    const isAppFS = !!document.fullscreenElement && document.fullscreenElement !== this.canvas;

    if (isAppFS) {
      // Toggle simulated CSS-based fullscreen overlay
      this._isManualFullscreen = !this._isManualFullscreen;
      this._updateFullscreenState();
    } else {
      // Native API logic
      this._isManualFullscreen = false; // clean up manual state
      this.canvas.classList.remove('manual-fullscreen');

      if (document.fullscreenElement === this.canvas) {
        document.exitFullscreen();
      } else {
        this.canvas.requestFullscreen().catch(err => {
          console.warn('Canvas fullscreen failed:', err);
        });
      }
    }
  }

  /** Update the screen selector dropdown with current Screen nodes */
  refreshScreenList() {
    const screens = this.engine.getScreenNodes();
    const currentVal = this.selectedScreenId;

    this._screenSelect.innerHTML = '';

    if (screens.length === 0) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = '(无屏幕节点)';
      this._screenSelect.appendChild(o);
      this.selectedScreenId = null;
      return;
    }

    for (const s of screens) {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.paramValues.windowTitle || s.id;
      o.selected = s.id === currentVal;
      this._screenSelect.appendChild(o);
    }

    // Auto-select first if current selection is gone
    if (!screens.find(s => s.id === currentVal)) {
      this.selectedScreenId = screens[0].id;
      this._screenSelect.value = this.selectedScreenId;
    }
  }

  _startRendering() {
    const render = () => {
      this._renderPreview();
      this._animLoop = requestAnimationFrame(render);
    };
    render();
  }

  _renderPreview() {
    const isNativeFS = document.fullscreenElement === this.canvas;
    const isFS = isNativeFS || this._isManualFullscreen;

    let cw, ch;
    
    if (isFS) {
      cw = window.innerWidth;
      ch = window.innerHeight;
    } else {
      const rect = this.bodyEl.getBoundingClientRect();
      cw = Math.floor(rect.width - 8);
      ch = Math.floor(rect.height - 8);
    }

    const dpr = isFS ? devicePixelRatio : Math.min(devicePixelRatio, 2); // use full dpr in fs

    if (cw < 10 || ch < 10) return;

    // Refresh screen list periodically
    if (Math.random() < 0.05) this.refreshScreenList();

    const screenId = this.selectedScreenId;
    if (!screenId) {
      // No screen selected — show empty
      if (this.canvas.width !== cw || this.canvas.height !== ch) {
        this.canvas.width = cw;
        this.canvas.height = ch;
      }
      this._ctx.fillStyle = '#111';
      this._ctx.fillRect(0, 0, cw, ch);
      this._ctx.fillStyle = '#555';
      this._ctx.font = '12px Inter, sans-serif';
      this._ctx.textAlign = 'center';
      this._ctx.textBaseline = 'middle';
      this._ctx.fillText('添加屏幕节点以预览', cw / 2, ch / 2);
      return;
    }

    // Get screen buffer
    const buf = this.engine._screenBuffers.get(screenId);
    if (!buf) {
      if (this.canvas.width !== cw || this.canvas.height !== ch) {
        this.canvas.width = cw;
        this.canvas.height = ch;
      }
      this._ctx.fillStyle = '#111';
      this._ctx.fillRect(0, 0, cw, ch);
      return;
    }

    // Scaled rendering — fit buffer into panel canvas maintaining aspect ratio
    const srcW = buf.canvas.width;
    const srcH = buf.canvas.height;
    const aspect = srcW / srcH;
    const panelAspect = cw / ch;

    let drawW, drawH;
    if (panelAspect > aspect) {
      drawH = ch;
      drawW = ch * aspect;
    } else {
      drawW = cw;
      drawH = cw / aspect;
    }

    // Use lower resolution for preview (scaled down)
    const scaledW = Math.floor(drawW * dpr);
    const scaledH = Math.floor(drawH * dpr);

    if (this.canvas.width !== scaledW || this.canvas.height !== scaledH) {
      this.canvas.width = scaledW;
      this.canvas.height = scaledH;
      this.canvas.style.width = drawW + 'px';
      this.canvas.style.height = drawH + 'px';
    }

    this._ctx.clearRect(0, 0, scaledW, scaledH);
    this._ctx.drawImage(buf.canvas, 0, 0, srcW, srcH, 0, 0, scaledW, scaledH);
  }


  close() {
    if (this._animLoop) cancelAnimationFrame(this._animLoop);
    super.close();
  }

  onResize() {
    // Canvas will auto-adjust in next render frame
  }
}
