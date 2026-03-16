/**
 * RenderPoolNode — container that collects renderable objects, dedup by ID
 */

import { Node } from '../core/Node.js';

export class RenderPoolNode extends Node {
  constructor(x, y) {
    super('RenderPool', x, y);
    this.title = '渲染池';
    this.icon = '📦';
    this.color = '#d29922';
    this.category = '管线';
    this.width = 170;

    // One fixed input for renderSource — accepts multiple connections
    this.addFixedInput('渲染对象', 'renderSource');

    this.addOutput('渲染', 'renderData');

    this.addParam('slotCount', { type: 'number', label: '最大数量', default: 10, min: 1, max: 100, step: 1, noInputToggle: true });
  }

  /**
   * inputValues[0] = array of renderSource objects (collected by RenderEngine)
   */
  evaluate(inputValues) {
    const sources = inputValues[0] || [];
    const maxSlots = this.paramValues.slotCount;

    // Limit to max slots
    const limited = sources.slice(0, maxSlots);

    return {
      type: 'renderData',
      sources: limited,
      count: limited.length,
    };
  }
}
