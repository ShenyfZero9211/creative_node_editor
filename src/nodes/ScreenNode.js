/**
 * ScreenNode — output window with resolution settings
 */

import { Node } from '../core/Node.js';

export class ScreenNode extends Node {
  constructor(x, y) {
    super('Screen', x, y);
    this.title = '屏幕';
    this.icon = '🖥';
    this.color = '#3fb950';
    this.category = '输出';
    this.width = 170;

    this.addFixedInput('渲染', 'screenData');

    this.addParam('windowTitle', { type: 'text', label: '窗口标题', default: 'Output', noInputToggle: true });
    this.addParam('resolutionW', { type: 'number', label: '宽度', default: 800, min: 320, max: 3840, step: 1, noInputToggle: true });
    this.addParam('resolutionH', { type: 'number', label: '高度', default: 600, min: 240, max: 2160, step: 1, noInputToggle: true });
    this.addParam('autoOpen', { type: 'boolean', label: '自动打开', default: false, noInputToggle: true });
  }

  evaluate(inputValues) {
    const screenData = inputValues[0];
    // Screen node passes data through — rendering handled by RenderEngine
    return screenData || { type: 'screenData', drawables: [], bgColor: '#000' };
  }
}
