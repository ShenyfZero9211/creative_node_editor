/**
 * FloatNode — outputs a float value
 */

import { Node } from '../core/Node.js';

export class FloatNode extends Node {
  constructor(x, y) {
    super('Float', x, y);
    this.title = '小数';
    this.icon = '🔹';
    this.color = '#39d2c0';
    this.category = '参数';
    this.width = 140;

    this.addOutput('小数值', 'number');

    this.addParam('value', { type: 'number', label: '值', default: 0.0, min: -100, max: 100, step: 0.01, inputDataType: 'number' });
  }

  evaluate(inputValues) {
    this._applyInputOverrides(inputValues);
    return parseFloat(this.paramValues.value) || 0;
  }
}
