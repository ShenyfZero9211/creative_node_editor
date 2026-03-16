import { Node } from '../core/Node.js';

export class CounterNode extends Node {
  constructor(x, y) {
    super('Counter', x, y);
    this.title = '计数器';
    this.icon = '🔢';
    this.color = '#3fb950';
    this.category = '状态';
    this.width = 160;

    this.addParam('min', { type: 'number', label: '最小值', default: 0 });
    this.addParam('max', { type: 'number', label: '最大值', default: 100 });
    this.addParam('interval', { type: 'number', label: '间隔(秒)', default: 1, min: 0.1, max: 60 });
    this.addParam('step', { type: 'number', label: '步长', default: 1 });

    this.addOutput('值', 'integer');

    this._currentValue = 0;
    this._lastUpdateTime = Date.now();
    this._initialized = false;
  }

  evaluate(inputValues) {
    const min = this.paramInputEnabled['min'] ? inputValues[0] : this.paramValues.min;
    const max = this.paramInputEnabled['max'] ? inputValues[1] : this.paramValues.max;
    const interval = this.paramInputEnabled['interval'] ? inputValues[2] : this.paramValues.interval;
    const step = this.paramInputEnabled['step'] ? inputValues[3] : this.paramValues.step;

    if (!this._initialized) {
      this._currentValue = min;
      this._initialized = true;
      this._lastUpdateTime = Date.now();
    }

    const now = Date.now();
    const intervalMs = interval * 1000;

    if (now - this._lastUpdateTime >= intervalMs) {
      this._currentValue += step;
      if (this._currentValue > max) {
        this._currentValue = min;
      }
      this._lastUpdateTime = now;
    }

    return Math.floor(this._currentValue);
  }
}
