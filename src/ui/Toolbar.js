/**
 * Toolbar — Quick action bar (below menu bar)
 */

import { getNodesByCategory } from '../nodes/NodeRegistry.js';

export class Toolbar {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this._render();
  }

  _render() {
    const el = this.container;
    el.innerHTML = '';

    // Node type buttons
    const categories = getNodesByCategory();
    for (const [cat, types] of categories) {
      for (const t of types) {
        const btn = document.createElement('button');
        btn.className = 'toolbar-btn';
        btn.title = `添加 ${t.label} 节点`;
        btn.innerHTML = `<span style="color:${t.color}">${t.icon}</span> ${t.label}`;
        btn.addEventListener('click', () => {
          if (this.callbacks.onAddNode) this.callbacks.onAddNode(t.id);
        });
        el.appendChild(btn);
      }
    }

    // Spacer
    const spacer = document.createElement('div');
    spacer.className = 'toolbar-spacer';
    el.appendChild(spacer);

    // Separator
    el.appendChild(this._sep());

    // New Preview Window button
    const winBtn = document.createElement('button');
    winBtn.className = 'toolbar-btn';
    winBtn.title = '新建预览窗口';
    winBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="14" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
        <line x1="8" y1="5" x2="8" y2="10" stroke="currentColor" stroke-width="1.3"/>
        <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" stroke-width="1.3"/>
      </svg>
      预览窗口
    `;
    winBtn.addEventListener('click', () => {
      if (this.callbacks.onNewWindow) this.callbacks.onNewWindow();
    });
    el.appendChild(winBtn);
  }

  _sep() {
    const s = document.createElement('div');
    s.className = 'toolbar-separator';
    return s;
  }
}
