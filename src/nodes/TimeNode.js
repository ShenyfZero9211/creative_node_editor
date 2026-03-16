/**
 * TimeNode — outputs continuously changing time value
 * Based on system time, continuously updates each frame
 */

import { Node } from '../core/Node.js';

export class TimeNode extends Node {
  constructor(x, y) {
    super('Time', x, y);
    this.title = '时间';
    this.icon = '⏱';
    this.color = '#d29922';
    this.category = '参数';
    this.width = 150;

    this.addOutput('时间(秒)', 'number');
    this.addOutput('毫秒', 'number');

    this.addParam('speed', { type: 'number', label: '速度', default: 1.0, min: 0.01, max: 10, step: 0.01, noInputToggle: true });
    this.addParam('mode', { type: 'select', label: '模式', default: 'elapsed',
      options: ['elapsed', 'sin', 'cos', 'sawtooth', 'ping-pong'],
      noInputToggle: true
    });

    this._startTime = Date.now();
  }

  evaluate() {
    const now = Date.now();
    const elapsed = (now - this._startTime) / 1000; // seconds
    const speed = this.paramValues.speed;
    const t = elapsed * speed;

    let output;
    switch (this.paramValues.mode) {
      case 'elapsed':
        output = t;
        break;
      case 'sin':
        output = Math.sin(t);
        break;
      case 'cos':
        output = Math.cos(t);
        break;
      case 'sawtooth':
        output = t % 1;
        break;
      case 'ping-pong':
        output = 1 - Math.abs((t % 2) - 1);
        break;
      default:
        output = t;
    }

    // Output index 0 = main output (multi-mode), index 1 = current milliseconds (0-999)
    const ms = now % 1000;
    return [output, ms];
  }
}
