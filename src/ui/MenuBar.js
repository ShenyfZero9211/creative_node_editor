/**
 * MenuBar — V2: dynamic state checking for edit menu items
 */

export class MenuBar {
  /**
   * @param {HTMLElement} container
   * @param {Object} callbacks
   */
  constructor(container, callbacks) {
    this.container = container;
    this.cb = callbacks;
    this._activeMenu = null;
    this._render();

    document.addEventListener('mousedown', (e) => {
      if (!this.container.contains(e.target)) this._closeAll();
    });
  }

  _render() {
    this.container.innerHTML = '';
    this.container.className = 'menu-bar';

    // Brand
    const brand = document.createElement('div');
    brand.className = 'mb-brand';
    brand.innerHTML = `<span class="mb-brand-icon">✦</span><span class="mb-brand-name">Creative Node Editor</span>`;
    this.container.appendChild(brand);

    // Menus
    const menus = [
      {
        label: '文件', items: [
          { label: '新建工程', shortcut: 'Ctrl+N', action: () => this.cb.onNewProject?.() },
          { type: 'separator' },
          { label: '保存工程', shortcut: 'Ctrl+S', action: () => this.cb.onSaveProject?.() },
          { label: '加载工程', shortcut: 'Ctrl+O', action: () => this.cb.onOpenProject?.() },
        ]
      },
      {
        label: '编辑', dynamic: true, buildItems: () => {
          const hasSelection = this.cb.getHasSelection?.() || false;
          const hasClipboard = this.cb.getHasClipboard?.() || false;
          const canUndo = this.cb.getCanUndo?.() || false;
          const canRedo = this.cb.getCanRedo?.() || false;
          return [
            { label: '撤销', shortcut: 'Ctrl+Z', action: () => this.cb.onUndo?.(), disabled: !canUndo },
            { label: '重做', shortcut: 'Ctrl+Y', action: () => this.cb.onRedo?.(), disabled: !canRedo },
            { type: 'separator' },
            { label: '复制', shortcut: 'Ctrl+C', action: () => this.cb.onCopy?.(), disabled: !hasSelection },
            { label: '粘贴', shortcut: 'Ctrl+V', action: () => this.cb.onPaste?.(), disabled: !hasClipboard },
            { label: '删除', shortcut: 'Del', action: () => this.cb.onDelete?.(), disabled: !hasSelection },
            { type: 'separator' },
            { label: '全选', shortcut: 'Ctrl+A', action: () => this.cb.onSelectAll?.() },
          ];
        }
      },
      {
        label: '视口', items: [
          { label: '重置视口', action: () => this.cb.onResetView?.() },
          { label: '适配全部节点', action: () => this.cb.onFitAll?.() },
          { type: 'separator' },
          { label: '视口地图', action: () => this.cb.onToggleMinimap?.() },
          { type: 'separator' },
          { label: '全屏', shortcut: 'F11', action: () => this.cb.onFullscreen?.() },
        ]
      },
      {
        label: '帮助', items: [
          { label: '快捷键一览', action: () => this.cb.onShowShortcuts?.() },
          { type: 'separator' },
          { label: '关于', action: () => this.cb.onAbout?.() },
        ]
      },
    ];

    this._menus = menus;
    this._menuEls = [];

    for (let i = 0; i < menus.length; i++) {
      const menu = menus[i];
      const menuEl = document.createElement('div');
      menuEl.className = 'mb-menu';

      const trigger = document.createElement('button');
      trigger.className = 'mb-trigger';
      trigger.textContent = menu.label;
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleMenu(i, menuEl);
      });
      trigger.addEventListener('mouseenter', () => {
        if (this._activeMenu && this._activeMenu !== menuEl) {
          this._toggleMenu(i, menuEl);
        }
      });
      menuEl.appendChild(trigger);

      const dropdown = document.createElement('div');
      dropdown.className = 'mb-dropdown';
      menuEl._dropdown = dropdown;
      menuEl._menuDef = menu;
      menuEl.appendChild(dropdown);

      this.container.appendChild(menuEl);
      this._menuEls.push(menuEl);
    }
  }

  _buildDropdown(menuEl) {
    const dropdown = menuEl._dropdown;
    const menu = menuEl._menuDef;
    dropdown.innerHTML = '';

    const items = menu.dynamic ? menu.buildItems() : menu.items;

    for (const item of items) {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'ctx-menu-separator';
        dropdown.appendChild(sep);
        continue;
      }
      const btn = document.createElement('button');
      btn.className = 'mb-dropdown-item' + (item.disabled ? ' disabled' : '');
      btn.innerHTML = `
        <span class="label">${item.label}</span>
        ${item.shortcut ? `<span class="shortcut">${item.shortcut}</span>` : ''}
      `;
      if (!item.disabled) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action();
          this._closeAll();
        });
      }
      dropdown.appendChild(btn);
    }
  }

  _toggleMenu(index, menuEl) {
    if (this._activeMenu === menuEl) {
      this._closeAll();
      return;
    }
    this._closeAll();
    this._buildDropdown(menuEl);
    menuEl.classList.add('active');
    this._activeMenu = menuEl;
  }

  _closeAll() {
    this.container.querySelectorAll('.mb-menu.active').forEach(m => m.classList.remove('active'));
    this._activeMenu = null;
  }
}
