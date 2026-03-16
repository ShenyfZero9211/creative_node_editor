/**
 * ContextMenu — V3: node menu with paste properties, blank menu with submenu
 */

import { getNodesByCategory } from '../nodes/NodeRegistry.js';

export class ContextMenu {
  constructor(el) {
    this.el = el;
    this._worldX = 0;
    this._worldY = 0;

    // Callbacks
    this.onAddNode = null;
    this.onCopyNode = null;
    this.onCopyProperties = null;
    this.onCopyJSON = null;
    this.onPasteNode = null;
    this.onPasteProperties = null;
    this.onDelete = null;

    document.addEventListener('mousedown', (e) => {
      if (!this.el.contains(e.target)) this.hide();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  /**
   * @param {number} sx screen X
   * @param {number} sy screen Y
   * @param {number} wx world X
   * @param {number} wy world Y
   * @param {string|null} hitNodeId
   * @param {boolean} isMulti
   * @param {boolean} hasClipboardNodes
   * @param {string|null} clipboardPropsType - type of node whose props were copied
   * @param {string|null} targetNodeType - type of right-clicked node
   */
  show(sx, sy, wx, wy, hitNodeId, isMulti, hasClipboardNodes, clipboardPropsType, targetNodeType) {
    this._worldX = wx;
    this._worldY = wy;
    this.el.innerHTML = '';

    if (hitNodeId) {
      this._buildNodeMenu(isMulti, clipboardPropsType, targetNodeType);
    } else {
      this._buildBlankMenu(hasClipboardNodes);
    }

    this.el.style.left = sx + 'px';
    this.el.style.top = sy + 'px';
    this.el.classList.remove('hidden');

    requestAnimationFrame(() => {
      const rect = this.el.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.el.style.left = (window.innerWidth - rect.width - 8) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        this.el.style.top = (window.innerHeight - rect.height - 8) + 'px';
      }
    });
  }

  _buildNodeMenu(isMulti, clipboardPropsType, targetNodeType) {
    // 复制节点
    this._addItem('📋', '复制节点', 'Ctrl+C', () => {
      this.onCopyNode?.();
      this.hide();
    });

    // 复制属性 (disabled for multi-select)
    this._addItem('📑', '复制属性', '', () => {
      if (!isMulti) this.onCopyProperties?.();
      this.hide();
    }, isMulti);

    // 粘贴属性 (enabled only if copied type matches target type)
    const canPasteProps = !isMulti && clipboardPropsType && clipboardPropsType === targetNodeType;
    this._addItem('📌', '粘贴属性', '', () => {
      if (canPasteProps) this.onPasteProperties?.();
      this.hide();
    }, !canPasteProps);

    // 复制JSON
    this._addItem('{ }', '复制JSON文本', '', () => {
      this.onCopyJSON?.();
      this.hide();
    });

    this._addSeparator();

    // 删除
    this._addItem('🗑', '删除', 'Del', () => {
      this.onDelete?.();
      this.hide();
    }, false, true);
  }

  _buildBlankMenu(hasClipboard) {
    // 粘贴节点
    this._addItem('📋', '粘贴节点', 'Ctrl+V', () => {
      this.onPasteNode?.(this._worldX, this._worldY);
      this.hide();
    }, !hasClipboard);

    this._addSeparator();

    // 新建节点 → submenu
    const categories = getNodesByCategory();
    const subParent = this._addSubmenuItem('➕', '新建节点');

    const submenu = document.createElement('div');
    submenu.className = 'ctx-submenu';

    for (const [cat, types] of categories) {
      const header = document.createElement('div');
      header.className = 'ctx-menu-header';
      header.textContent = cat;
      submenu.appendChild(header);

      for (const t of types) {
        const item = document.createElement('button');
        item.className = 'ctx-menu-item';
        item.innerHTML = `<span class="icon" style="background:${t.color}22;color:${t.color}">${t.icon}</span> ${t.label}`;
        item.addEventListener('click', () => {
          this.onAddNode?.(t.id, this._worldX, this._worldY);
          this.hide();
        });
        submenu.appendChild(item);
      }
    }

    subParent.appendChild(submenu);
  }

  _addItem(icon, label, shortcut, onClick, disabled = false, danger = false) {
    const item = document.createElement('button');
    item.className = 'ctx-menu-item' + (disabled ? ' disabled' : '') + (danger ? ' danger' : '');
    item.innerHTML = `
      <span class="icon">${icon}</span>
      <span class="label">${label}</span>
      ${shortcut ? `<span class="shortcut">${shortcut}</span>` : ''}
    `;
    if (!disabled) item.addEventListener('click', onClick);
    this.el.appendChild(item);
    return item;
  }

  _addSeparator() {
    const sep = document.createElement('div');
    sep.className = 'ctx-menu-separator';
    this.el.appendChild(sep);
  }

  _addSubmenuItem(icon, label) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ctx-submenu-parent';
    const item = document.createElement('button');
    item.className = 'ctx-menu-item has-submenu';
    item.innerHTML = `
      <span class="icon">${icon}</span>
      <span class="label">${label}</span>
      <span class="arrow">▶</span>
    `;
    wrapper.appendChild(item);
    this.el.appendChild(wrapper);
    return wrapper;
  }

  hide() {
    this.el.classList.add('hidden');
  }
}
