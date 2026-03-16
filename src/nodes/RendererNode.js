/**
 * RendererNode — manages rendering pipeline, quality settings
 */

import { Node } from '../core/Node.js';

export class RendererNode extends Node {
  constructor(x, y) {
    super('Renderer', x, y);
    this.title = '渲染';
    this.icon = '🎬';
    this.color = '#bc8cff';
    this.category = '管线';
    this.width = 170;

    this.addFixedInput('渲染池', 'renderData');
    this.addOutput('屏幕', 'screenData');

    this.addParam('bgColor', { type: 'color', label: '背景色', default: '#000000', noInputToggle: true });
    this.addParam('antialiasing', { type: 'boolean', label: '抗锯齿', default: true, noInputToggle: true });
  }

  evaluate(inputValues) {
    const renderData = inputValues[0];
    const p = this.paramValues;

    // Collect all drawables from the render pool
    const drawables = [];
    if (renderData && renderData.sources) {
      for (const src of renderData.sources) {
        if (src && src.draw) {
          drawables.push(src);
        }
      }
    }

    return {
      type: 'screenData',
      drawables,
      bgColor: p.bgColor,
      antialiasing: p.antialiasing,
    };
  }
}
