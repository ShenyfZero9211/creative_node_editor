/**
 * ColorNode — V2 parameter node, outputs a color value
 */

import { Node } from '../core/Node.js';

export class ColorNode extends Node {
  constructor(x, y) {
    super('Color', x, y);
    this.title = '颜色';
    this.icon = '🎨';
    this.color = '#f0883e';
    this.category = '参数';
    this.width = 140;

    this.addOutput('颜色值', 'color');

    this.addParam('color', { type: 'color', label: '颜色', default: '#ff6b6b', inputDataType: 'color' });
  }

  evaluate(inputValues) {
    this._applyInputOverrides(inputValues);
    return this.paramValues.color;
  }
}
