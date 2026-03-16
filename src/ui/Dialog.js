/**
 * Dialog — creates styled modal popups for About, Shortcuts, etc.
 */

export class Dialog {
  /**
   * Show a modal dialog
   * @param {Object} opts
   * @param {string} opts.title
   * @param {string|HTMLElement} opts.content - HTML string or DOM element
   * @param {string} [opts.width='420px']
   */
  static show(opts) {
    // Remove existing
    const existing = document.querySelector('.dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const box = document.createElement('div');
    box.className = 'dialog-box';
    if (opts.width) box.style.width = opts.width;

    // Header
    const header = document.createElement('div');
    header.className = 'dialog-header';

    const title = document.createElement('h3');
    title.textContent = opts.title;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'dialog-close';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => overlay.remove());
    header.appendChild(closeBtn);

    box.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'dialog-body';
    if (typeof opts.content === 'string') {
      body.innerHTML = opts.content;
    } else {
      body.appendChild(opts.content);
    }
    box.appendChild(body);

    overlay.appendChild(box);
    document.getElementById('app').appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Close on ESC
    const handler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handler);
      }
    };
    document.addEventListener('keydown', handler);
  }

  static showConfirm(opts) {
    const content = document.createElement('div');
    content.className = 'dialog-confirm';
    content.innerHTML = `<p>${opts.message}</p>`;

    const footer = document.createElement('div');
    footer.className = 'dialog-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'dialog-btn dialog-btn-secondary';
    cancelBtn.textContent = opts.cancelText || '取消';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'dialog-btn dialog-btn-primary';
    confirmBtn.textContent = opts.confirmText || '确定';

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    content.appendChild(footer);

    Dialog.show({
      title: opts.title || '确认',
      width: opts.width || '360px',
      content: content,
    });

    const overlay = document.querySelector('.dialog-overlay');
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
      if (opts.onCancel) opts.onCancel();
    });
    confirmBtn.addEventListener('click', () => {
      overlay.remove();
      if (opts.onConfirm) opts.onConfirm();
    });
  }



  static showAbout() {
    Dialog.show({
      title: '关于',
      width: '480px',
      content: `
        <div class="dialog-about">
          <div class="dialog-about-icon">✦</div>
          <h2>Creative Node Editor</h2>
          <p>这是一个可视化的实时节点式创意编程编辑器，由 <strong>SharpEye | 曙光3号</strong> 开发。</p>
          <p>参考了众多创意编程和互动艺术软件，如 <strong>VVVV</strong>、<strong>MaxMsp</strong>、<strong>TouchDesigner</strong> 等。</p>
          <p>基本框架已搭建完毕，可在此基础上扩展。其<em>"所见即所得"</em>核心理念贯穿始终，追求高效、实时、可视化。</p>
          <p>完整工程项目已上传至 Github，欢迎来围观~</p>
        </div>
      `,
    });
  }

  static showShortcuts() {
    const shortcuts = [
      ['Ctrl+C', '复制选中节点'],
      ['Ctrl+V', '粘贴节点'],
      ['Ctrl+A', '全选'],
      ['Ctrl+S', '保存工程'],
      ['Ctrl+O', '加载工程'],
      ['Ctrl+N', '新建工程'],
      ['Delete / Backspace', '删除选中节点'],
      ['F11', '全屏 (Windows级)'],
      ['中键拖拽', '平移视口'],
      ['右键拖拽', '平移视口'],
      ['右键单击节点', '节点菜单'],
      ['右键单击空白', '新建菜单'],
      ['滚轮', '缩放视口'],
      ['Ctrl+点击', '多选节点'],
      ['左键空白拖拽', '框选节点'],
      ['Escape', '退出全屏 / 关闭弹窗'],
    ];

    let html = '<table class="shortcuts-table"><tbody>';
    for (const [key, desc] of shortcuts) {
      html += `<tr><td class="shortcut-key">${key}</td><td class="shortcut-desc">${desc}</td></tr>`;
    }
    html += '</tbody></table>';

    Dialog.show({
      title: '⌨ 快捷键一览',
      width: '400px',
      content: html,
    });
  }
}

window.Dialog = Dialog;
