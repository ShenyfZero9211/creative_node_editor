/**
 * ParamPanel — V3 with Transform mode-aware display
 */

import { ImageNode } from '../nodes/ImageNode.js';
import { TransformNode } from '../nodes/TransformNode.js';
import { ContainerNode } from '../nodes/ContainerNode.js';

export class ParamPanel {
  constructor(contentEl, onParamChange) {
    this.contentEl = contentEl;
    this.onParamChange = onParamChange;
    this.currentNode = null;
    this.onDelete = null;
    /** called when a param input toggle changes — must rebuild ports */
    this.onToggleInput = null;
    /** called when a user finishes editing a param (for undo) */
    this.onCommit = null;
  }

  showNode(node) {
    this.currentNode = node;
    this.contentEl.innerHTML = '';

    // Node info card
    const info = document.createElement('div');
    info.className = 'node-info-card';
    info.innerHTML = `
      <div class="node-info-icon" style="background:${node.color}22;color:${node.color}">${node.icon}</div>
      <div class="node-info-details">
        <div class="node-info-type">${node.title}</div>
        <div class="node-info-id">${node.id}</div>
      </div>
    `;
    this.contentEl.appendChild(info);

    // Param group
    const group = document.createElement('div');
    group.className = 'param-group';

    const groupTitle = document.createElement('div');
    groupTitle.className = 'param-group-title';
    groupTitle.innerHTML = `<span class="node-color-dot" style="background:${node.color}"></span> 参数`;
    group.appendChild(groupTitle);

    for (const [key, def] of Object.entries(node.params)) {
      // Transform node: conditionally show/hide params based on mode
      if (node instanceof TransformNode) {
        const isCustom = node.paramValues.useCustom;
        if (isCustom && key === 'presetFunc') continue; // hide preset in custom mode
        if (!isCustom && key === 'customExpr') continue; // hide custom in preset mode
      }
      const row = this._createParamRow(node, key, def);
      group.appendChild(row);
    }

    this.contentEl.appendChild(group);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'param-delete-btn';
    delBtn.textContent = '🗑 删除节点';
    delBtn.addEventListener('click', () => {
      if (this.onDelete) this.onDelete(node);
    });
    this.contentEl.appendChild(delBtn);
  }

  clear() {
    this.currentNode = null;
    this.contentEl.innerHTML = '<p class="empty-hint">选择一个节点查看属性</p>';
  }

  _createParamRow(node, key, def) {
    const row = document.createElement('div');
    row.className = 'param-row';

    // Input toggle (only for toggleable params)
    if (!def.noInputToggle) {
      const toggle = document.createElement('button');
      toggle.className = 'param-input-toggle';
      const isEnabled = node.paramInputEnabled[key];
      toggle.classList.toggle('active', isEnabled);
      toggle.title = isEnabled ? '关闭输入端口' : '开启输入端口';
      toggle.innerHTML = isEnabled ? '⊙' : '○';
      toggle.addEventListener('click', () => {
        const newState = !node.paramInputEnabled[key];
        const info = node.toggleParamInput(key, newState);
        if (this.onToggleInput) this.onToggleInput(node, key, newState, info);
        // Refresh panel
        this.showNode(node);
        this.onParamChange(node);
      });
      row.appendChild(toggle);
    }

    // Label
    const label = document.createElement('span');
    label.className = 'param-label';
    label.textContent = def.label;
    row.appendChild(label);

    // Control (dimmed if input is enabled — value comes from connection)
    const control = document.createElement('div');
    control.className = 'param-control';
    if (node.paramInputEnabled[key]) {
      control.classList.add('param-input-active');
    }

    switch (def.type) {
      case 'number':
        control.appendChild(this._createSlider(node, key, def));
        break;
      case 'color':
        control.appendChild(this._createColorPicker(node, key, def));
        break;
      case 'text':
      case 'url':
        control.appendChild(this._createTextInput(node, key, def));
        break;
      case 'textarea':
        control.appendChild(this._createTextarea(node, key, def));
        break;
      case 'select':
        control.appendChild(this._createSelect(node, key, def));
        break;
      case 'file':
        control.appendChild(this._createFileInput(node, key, def));
        break;
      case 'boolean':
        control.appendChild(this._createCheckbox(node, key, def));
        break;
    }

    row.appendChild(control);
    return row;
  }

  _createSlider(node, key, def) {
    const wrap = document.createElement('div');
    wrap.className = 'param-slider-wrap';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'param-slider';
    slider.min = def.min ?? 0;
    slider.max = def.max ?? 100;
    slider.step = def.step ?? 1;
    slider.value = node.paramValues[key];

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'param-number-input';
    numInput.min = def.min ?? 0;
    numInput.max = def.max ?? 100;
    numInput.step = def.step ?? 1;
    numInput.value = node.paramValues[key];

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      node.paramValues[key] = v;
      numInput.value = v;
      node.markDirty();
      this.onParamChange(node);

      // ContainerNode: update ports on count change
      if (key === 'count' && node instanceof ContainerNode) {
        const info = node._updatePorts();
        if (this.onToggleInput) this.onToggleInput(node, key, true, info);
        this.showNode(node);
      }
    });

    numInput.addEventListener('input', () => {
      const v = parseFloat(numInput.value);
      if (!isNaN(v)) {
        node.paramValues[key] = v;
        numInput.value = v;
        slider.value = v;
        node.markDirty();
        this.onParamChange(node);

        // ContainerNode: update ports on count change
        if (key === 'count' && node instanceof ContainerNode) {
          const info = node._updatePorts();
          if (this.onToggleInput) this.onToggleInput(node, key, true, info);
          this.showNode(node);
        }
      }
    });

    const commit = () => { if (this.onCommit) this.onCommit(node); };
    slider.addEventListener('change', commit);
    numInput.addEventListener('blur', commit);

    wrap.appendChild(slider);
    wrap.appendChild(numInput);
    return wrap;
  }

  _createColorPicker(node, key, def) {
    const wrap = document.createElement('div');
    wrap.className = 'param-color-wrap';

    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'param-color-input';
    input.value = node.paramValues[key] || '#ffffff';

    const hex = document.createElement('span');
    hex.className = 'param-color-hex';
    hex.textContent = node.paramValues[key] || '#ffffff';

    input.addEventListener('input', () => {
      node.paramValues[key] = input.value;
      hex.textContent = input.value;
      node.markDirty();
      this.onParamChange(node);
    });
    input.addEventListener('change', () => {
      if (this.onCommit) this.onCommit(node);
    });

    wrap.appendChild(input);
    wrap.appendChild(hex);
    return wrap;
  }

  _createTextInput(node, key, def) {
    const wrap = document.createElement('div');
    wrap.className = 'param-input-with-button';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'param-text-input';
    input.value = node.paramValues[key] || '';
    if (def.type === 'url') input.placeholder = 'https://... 或点击右侧选择文件';
    if (key === 'customExpr') input.placeholder = '例: $x * 2 + $y';

    wrap.appendChild(input);

    // If it's a URL type, add a file picker button next to it
    if (def.type === 'url') {
      const fileBtn = document.createElement('button');
      fileBtn.className = 'param-url-file-btn';
      fileBtn.innerHTML = '📁';
      fileBtn.title = '选择本地文件';
      
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';

      fileBtn.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
          if (node instanceof ImageNode) {
            node.loadImageFromFile(file);
            input.value = `local://${file.name}`;
            node.paramValues[key] = input.value;
            node.markDirty();
            this.onParamChange(node);
            if (this.onCommit) this.onCommit(node);
          } else {
            const url = URL.createObjectURL(file);
            input.value = url;
            node.paramValues[key] = url;
            node.markDirty();
            this.onParamChange(node);
            if (this.onCommit) this.onCommit(node);
          }
        }
      });

      wrap.appendChild(fileBtn);
      wrap.appendChild(fileInput);
    }

    // Debounce for custom expression port rebuild
    let exprTimer = null;
    input.addEventListener('input', () => {
      node.paramValues[key] = input.value;
      node.markDirty();
      this.onParamChange(node);

      // If this is the custom expression field on a Transform node, rebuild ports
      if (key === 'customExpr' && node instanceof TransformNode) {
        clearTimeout(exprTimer);
        exprTimer = setTimeout(() => {
          const info = node._updateCustomPorts();
          // Remove connections to ports that no longer exist
          if (this.onToggleInput) this.onToggleInput(node, key, true, info);
          this.showNode(node); // refresh panel
        }, 400);
      }
    });

    input.addEventListener('blur', () => {
      if (this.onCommit) this.onCommit(node);
    });

    return wrap;
  }

  _createTextarea(node, key, def) {
    const ta = document.createElement('textarea');
    ta.className = 'param-textarea';
    ta.value = node.paramValues[key] || '';
    ta.rows = 3;

    ta.addEventListener('input', () => {
      node.paramValues[key] = ta.value;
      node.markDirty();
      this.onParamChange(node);
    });
    ta.addEventListener('blur', () => {
      if (this.onCommit) this.onCommit(node);
    });

    return ta;
  }

  _createSelect(node, key, def) {
    const sel = document.createElement('select');
    sel.className = 'param-select';

    for (const opt of (def.options || [])) {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      o.selected = node.paramValues[key] === opt;
      sel.appendChild(o);
    }

    sel.addEventListener('change', () => {
      node.paramValues[key] = sel.value;
      node.markDirty();
      this.onParamChange(node);
      if (this.onCommit) this.onCommit(node);

      // ContainerNode: update ports on type change
      if (key === 'itemType' && node instanceof ContainerNode) {
        const info = node._updatePorts();
        if (this.onToggleInput) this.onToggleInput(node, key, true, info);
        this.showNode(node);
      }
    });

    return sel;
  }



  _createCheckbox(node, key, def) {
    const wrap = document.createElement('div');
    wrap.className = 'param-checkbox-wrap';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'param-checkbox';
    cb.checked = !!node.paramValues[key];

    const label = document.createElement('span');
    label.className = 'param-checkbox-label';
    label.textContent = cb.checked ? '开' : '关';

    cb.addEventListener('change', () => {
      node.paramValues[key] = cb.checked;
      label.textContent = cb.checked ? '开' : '关';
      node.markDirty();

      // Transform node: mode switch → rebuild ports and refresh panel
      if (key === 'useCustom' && node instanceof TransformNode) {
        const info = node._updateCustomPorts();
        if (this.onToggleInput) this.onToggleInput(node, key, true, info);
        this.onParamChange(node);
        this.showNode(node); // re-render panel with correct fields
        return;
      }

      this.onParamChange(node);
      if (this.onCommit) this.onCommit(node);
    });

    wrap.appendChild(cb);
    wrap.appendChild(label);
    return wrap;
  }
}
