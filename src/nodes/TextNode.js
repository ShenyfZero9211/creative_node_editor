/**
 * TextNode — V2 renderable node with reasonable value ranges
 */

import { Node } from '../core/Node.js';

export class TextNode extends Node {
  constructor(x, y) {
    super('Text', x, y);
    this.title = '文本';
    this.icon = '𝐓';
    this.color = '#f778ba';
    this.category = '可渲染节点';
    this.width = 170;

    this.addOutput('渲染源', 'renderSource');

    this.addParam('elementId', { type: 'text', label: 'ID', default: 'text_1', noInputToggle: true });
    this.addParam('text', { type: 'textarea', label: '内容', default: 'Hello World', inputDataType: 'string' });
    this.addParam('x', { type: 'number', label: 'X', default: 400, min: 0, max: 800, step: 1, inputDataType: 'number' });
    this.addParam('y', { type: 'number', label: 'Y', default: 300, min: 0, max: 600, step: 1, inputDataType: 'number' });
    this.addParam('fontSize', { type: 'number', label: '字号', default: 48, min: 8, max: 120, step: 1, inputDataType: 'number' });
    this.addParam('fontFamily', { type: 'select', label: '字体', default: 'Inter', options: ['Inter', 'Arial', 'Georgia', 'Courier New', 'Impact'], noInputToggle: true });
    this.addParam('fontWeight', { type: 'select', label: '粗细', default: '400', options: ['300', '400', '500', '600', '700', '900'], noInputToggle: true });
    this.addParam('textAlign', { type: 'select', label: '对齐', default: 'center', options: ['left', 'center', 'right'], noInputToggle: true });
    this.addParam('fillColor', { type: 'color', label: '颜色', default: '#ffffff', inputDataType: 'color' });
    this.addParam('rotation', { type: 'number', label: '旋转', default: 0, min: 0, max: 360, step: 1, inputDataType: 'number' });
    this.addParam('opacity', { type: 'number', label: '透明度', default: 1, min: 0, max: 1, step: 0.05, inputDataType: 'number' });
  }

  evaluate(inputValues) {
    this._applyInputOverrides(inputValues);
    const p = this.paramValues;

    return {
      type: 'renderSource',
      elementId: p.elementId,
      zIndex: 1,
      draw: (ctx) => {
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.fillColor;
        ctx.font = `${p.fontWeight} ${p.fontSize}px ${p.fontFamily}`;
        ctx.textAlign = p.textAlign;
        ctx.textBaseline = 'middle';
        const lines = p.text.split('\n');
        const lh = p.fontSize * 1.3;
        const startY = -(lines.length * lh) / 2 + lh / 2;
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], 0, startY + i * lh);
        }
      },
    };
  }
}
