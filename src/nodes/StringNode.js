import { Node } from '../core/Node.js';

export class StringNode extends Node {
  constructor(x, y) {
    super('String', x, y);
    this.title = '字符串';
    this.icon = '𝐒';
    this.color = '#3fb950'; // Same as Integer/Float for consistency as a param
    this.category = '参数';
    this.width = 160;

    this.addParam('value', { 
      type: 'textarea', 
      label: '文本内容', 
      default: '', 
      inputDataType: 'string' 
    });

    this.addOutput('内容', 'string');
  }

  evaluate(inputValues) {
    this._applyInputOverrides(inputValues);
    return this.paramValues.value || '';
  }
}
