/**
 * FloatingPanel — generic draggable, dockable panel component
 *
 * Creates a floating panel that can be dragged around the browser window.
 * Has a title bar with controls (close, etc.)
 */

export class FloatingPanel {
  /**
   * @param {Object} opts
   * @param {string} opts.title
   * @param {number} [opts.x=100]
   * @param {number} [opts.y=100]
   * @param {number} [opts.width=320]
   * @param {number} [opts.height=240]
   * @param {boolean} [opts.resizable=true]
   * @param {boolean} [opts.closable=true]
   * @param {Function} [opts.onClose]
   * @param {HTMLElement} [opts.parent=document.body]
   * @param {string} [opts.className='']
   */
  constructor(opts = {}) {
    this.x = opts.x ?? 100;
    this.y = opts.y ?? 100;
    this.width = opts.width ?? 320;
    this.height = opts.height ?? 240;
    this.title = opts.title ?? 'Panel';
    this.onClose = opts.onClose || null;
    this.parent = opts.parent || document.getElementById('app') || document.body;

    // Create DOM
    this.el = document.createElement('div');
    this.el.className = 'floating-panel' + (opts.className ? ' ' + opts.className : '');
    this.el.style.cssText = `left:${this.x}px;top:${this.y}px;width:${this.width}px;height:${this.height}px;`;

    // Header
    this.headerEl = document.createElement('div');
    this.headerEl.className = 'fp-header';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'fp-title';
    this.titleEl.textContent = this.title;
    this.headerEl.appendChild(this.titleEl);

    // Header controls
    this.controlsEl = document.createElement('div');
    this.controlsEl.className = 'fp-controls';

    if (opts.closable !== false) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'fp-btn fp-btn-close';
      closeBtn.innerHTML = '✕';
      closeBtn.title = '关闭';
      closeBtn.addEventListener('click', () => this.close());
      this.controlsEl.appendChild(closeBtn);
    }
    this.headerEl.appendChild(this.controlsEl);

    this.el.appendChild(this.headerEl);

    // Body
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'fp-body';
    this.el.appendChild(this.bodyEl);

    // Resize handle
    if (opts.resizable !== false) {
      const handle = document.createElement('div');
      handle.className = 'fp-resize-handle';
      this.el.appendChild(handle);
      this._bindResize(handle);
    }

    // Dragging
    this._bindDrag();

    // Bring to front on click
    this.el.addEventListener('mousedown', () => this.bringToFront());

    this.parent.appendChild(this.el);
  }

  setTitle(title) {
    this.title = title;
    this.titleEl.textContent = title;
  }

  /** Insert a control button before the close button */
  addHeaderButton(html, title, onClick) {
    const btn = document.createElement('button');
    btn.className = 'fp-btn';
    btn.innerHTML = html;
    btn.title = title;
    btn.addEventListener('click', onClick);
    // Insert before close button
    const close = this.controlsEl.querySelector('.fp-btn-close');
    if (close) this.controlsEl.insertBefore(btn, close);
    else this.controlsEl.appendChild(btn);
    return btn;
  }

  /** Insert a select dropdown in the header */
  addHeaderSelect(options, defaultVal, onChange) {
    const sel = document.createElement('select');
    sel.className = 'fp-select';
    for (const opt of options) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      o.selected = opt.value === defaultVal;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => onChange(sel.value));
    this.titleEl.innerHTML = '';
    this.titleEl.appendChild(sel);
    return sel;
  }

  bringToFront() {
    const panels = this.parent.querySelectorAll('.floating-panel');
    let maxZ = 200;
    panels.forEach(p => { maxZ = Math.max(maxZ, parseInt(p.style.zIndex || 200)); });
    this.el.style.zIndex = maxZ + 1;
  }

  close() {
    if (this.onClose) this.onClose(this);
    this.el.remove();
  }

  _bindDrag() {
    let startX, startY, startLeft, startTop;
    const onDown = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      const rect = this.el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      this.el.classList.add('fp-dragging');
    };
    const onMove = (e) => {
      this.x = startLeft + (e.clientX - startX);
      this.y = startTop + (e.clientY - startY);
      // Clamp to window bounds
      this.x = Math.max(0, Math.min(window.innerWidth - 60, this.x));
      this.y = Math.max(0, Math.min(window.innerHeight - 30, this.y));
      this.el.style.left = this.x + 'px';
      this.el.style.top = this.y + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.el.classList.remove('fp-dragging');
    };
    this.headerEl.addEventListener('mousedown', onDown);
  }

  _bindResize(handle) {
    let startX, startY, startW, startH;
    const onDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startY = e.clientY;
      startW = this.el.offsetWidth;
      startH = this.el.offsetHeight;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
    const onMove = (e) => {
      this.width = Math.max(200, startW + (e.clientX - startX));
      this.height = Math.max(120, startH + (e.clientY - startY));
      this.el.style.width = this.width + 'px';
      this.el.style.height = this.height + 'px';
      this.onResize?.();
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    handle.addEventListener('mousedown', onDown);
  }

  /** Called when panel is resized — override in subclass */
  onResize() {}
}
