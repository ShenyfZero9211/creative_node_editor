/**
 * IntegerNode — outputs an integer value
 */

import { Node } from '../core/Node.js';

export class IntegerNode extends Node {
  constructor(x, y) {
    super('Integer', x, y);
    this.title = '整数';
    this.icon = '🔢';
    this.color = '#3fb950';
    this.category = '参数';
    this.width = 140;

    this.addOutput('整数值', 'number');

    this.addParam('value', { type: 'number', label: '值', default: 0, min: -1000, max: 1000, step: 1, inputDataType: 'number' });
  }

  evaluate(inputValues) {
    this._applyInputOverrides(inputValues);
    return Math.round(this.paramValues.value);
  }
}
