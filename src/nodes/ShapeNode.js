/**
 * ShapeNode — V2 renderable node with reasonable value ranges
 */

import { Node } from '../core/Node.js';

export class ShapeNode extends Node {
  constructor(x, y) {
    super('Shape', x, y);
    this.title = '图形';
    this.icon = '◆';
    this.color = '#58a6ff';
    this.category = '可渲染节点';
    this.width = 170;

    this.addOutput('渲染源', 'renderSource');

    this.addParam('elementId', { type: 'text', label: 'ID', default: 'shape_1', noInputToggle: true });
    this.addParam('shape', { type: 'select', label: '形状', default: 'rect', options: ['rect', 'circle', 'triangle', 'ellipse', 'star', 'line'], noInputToggle: true });
    this.addParam('x', { type: 'number', label: 'X', default: 400, min: 0, max: 800, step: 1, inputDataType: 'number' });
    this.addParam('y', { type: 'number', label: 'Y', default: 300, min: 0, max: 600, step: 1, inputDataType: 'number' });
    this.addParam('width', { type: 'number', label: '宽', default: 100, min: 1, max: 500, step: 1, inputDataType: 'number' });
    this.addParam('height', { type: 'number', label: '高', default: 100, min: 1, max: 500, step: 1, inputDataType: 'number' });
    this.addParam('rotation', { type: 'number', label: '旋转', default: 0, min: 0, max: 360, step: 1, inputDataType: 'number' });
    this.addParam('fillColor', { type: 'color', label: '填充色', default: '#58a6ff', inputDataType: 'color' });
    this.addParam('strokeColor', { type: 'color', label: '描边色', default: '#ffffff', inputDataType: 'color' });
    this.addParam('strokeWidth', { type: 'number', label: '描边宽', default: 0, min: 0, max: 10, step: 0.5, inputDataType: 'number' });
    this.addParam('opacity', { type: 'number', label: '透明度', default: 1, min: 0, max: 1, step: 0.05, inputDataType: 'number' });
  }

  evaluate(inputValues) {
    this._applyInputOverrides(inputValues);
    const p = this.paramValues;

    return {
      type: 'renderSource',
      elementId: p.elementId,
      zIndex: 0,
      draw: (ctx) => {
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.fillColor;
        if (p.strokeWidth > 0) {
          ctx.strokeStyle = p.strokeColor;
          ctx.lineWidth = p.strokeWidth;
        }
        const hw = p.width / 2, hh = p.height / 2;
        switch (p.shape) {
          case 'rect':
            ctx.beginPath(); ctx.rect(-hw, -hh, p.width, p.height); ctx.fill();
            if (p.strokeWidth > 0) ctx.stroke(); break;
          case 'circle':
            ctx.beginPath(); ctx.arc(0, 0, Math.min(hw, hh), 0, Math.PI * 2); ctx.fill();
            if (p.strokeWidth > 0) ctx.stroke(); break;
          case 'ellipse':
            ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); ctx.fill();
            if (p.strokeWidth > 0) ctx.stroke(); break;
          case 'triangle':
            ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh); ctx.closePath(); ctx.fill();
            if (p.strokeWidth > 0) ctx.stroke(); break;
          case 'star': {
            const spikes = 5, outerR = Math.min(hw, hh), innerR = outerR * 0.4;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
              const r = i % 2 === 0 ? outerR : innerR;
              const a = (Math.PI * i) / spikes - Math.PI / 2;
              if (i === 0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
              else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
            }
            ctx.closePath(); ctx.fill();
            if (p.strokeWidth > 0) ctx.stroke(); break;
          }
          case 'line':
            ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0);
            ctx.strokeStyle = p.fillColor; ctx.lineWidth = p.strokeWidth || 2; ctx.stroke(); break;
        }
      },
    };
  }
}
