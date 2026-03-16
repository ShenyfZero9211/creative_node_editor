/**
 * UrlNode — outputs a URL string for image nodes
 */

import { Node } from '../core/Node.js';

export class UrlNode extends Node {
  constructor(x, y) {
    super('Url', x, y);
    this.title = 'URL';
    this.icon = '🔗';
    this.color = '#f778ba';
    this.category = '参数';
    this.width = 170;

    this.addOutput('URL', 'url');

    this.addParam('url', { type: 'url', label: 'URL', default: '', inputDataType: 'url' });
  }

  evaluate(inputValues) {
    this._applyInputOverrides(inputValues);
    return this.paramValues.url || '';
  }
}
