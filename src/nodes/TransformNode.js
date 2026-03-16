/**
 * TransformNode — V3: Two modes — preset expression and custom expression
 *
 * Preset mode: use built-in presets with "time" variable (from Time node input)
 * Custom mode: user writes expression with custom variables named "$name"
 *   → each $name auto-creates an input port that accepts numeric values
 *
 * Only ONE output: 结果 (number)
 */

import { Node } from '../core/Node.js';

// Built-in math functions
const MATH_FUNCS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  abs: Math.abs, sqrt: Math.sqrt, floor: Math.floor,
  ceil: Math.ceil, round: Math.round,
  min: Math.min, max: Math.max, pow: Math.pow,
  PI: Math.PI, TAU: Math.PI * 2,
  lerp: (a, b, t) => a + (b - a) * t,
  step: (edge, x) => x < edge ? 0 : 1,
  smoothstep: (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  },
  clamp: (x, lo, hi) => Math.max(lo, Math.min(hi, x)),
  random: () => Math.random(),
  noise: (v) => (Math.sin(v * 127.1) * 43758.5453) % 1,
  map: (v, inMin, inMax, outMin, outMax) =>
    outMin + (v - inMin) * (outMax - outMin) / (inMax - inMin),
};

/**
 * Safely evaluate a math expression
 * @param {string} expr
 * @param {Object} variables - key→value map of variables
 */
function evalExpression(expr, variables) {
  if (!expr || expr.trim() === '') return 0;
  try {
    const allVars = { ...variables, ...MATH_FUNCS };
    const keys = Object.keys(allVars);
    const vals = Object.values(allVars);
    const sanitized = expr.replace(/[^a-zA-Z0-9+\-*/%.(),\s_]/g, '');
    const fn = new Function(...keys, `"use strict"; return (${sanitized});`);
    const result = fn(...vals);
    return (typeof result === 'number' && isFinite(result)) ? result : 0;
  } catch {
    return 0;
  }
}

/**
 * Extract $name variable names from an expression string
 * Returns array of unique variable names (without the $ prefix)
 */
function extractCustomVars(expr) {
  if (!expr) return [];
  const matches = expr.match(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g);
  if (!matches) return [];
  const unique = [...new Set(matches.map(m => m.slice(1)))];
  return unique;
}

export class TransformNode extends Node {
  constructor(x, y) {
    super('Transform', x, y);
    this.title = '变换';
    this.icon = '⟳';
    this.color = '#39d2c0';
    this.category = '变换';
    this.width = 180;

    // Output
    this.addOutput('结果', 'number');

    // Mode switch
    this.addParam('useCustom', { type: 'boolean', label: '自定义模式', default: false, noInputToggle: true });

    // === Preset mode params ===
    this.addParam('presetFunc', { type: 'select', label: '预设函数', default: 'sin(time) * 100',
      options: [
        'time', 'sin(time)', 'cos(time)',
        'sin(time) * 100', 'cos(time) * 200',
        'sin(time) * 0.5 + 0.5',
        'abs(sin(time)) * 100',
        'lerp(0, 400, sin(time) * 0.5 + 0.5)',
        'map(sin(time), -1, 1, 0, 800)',
        'map(cos(time), -1, 1, 0, 600)',
        'noise(time) * 100',
        'floor(time) % 10 * 50',
        'smoothstep(0, 10, time) * 400',
      ],
      noInputToggle: true
    });

    // === Custom mode params ===
    this.addParam('customExpr', { type: 'text', label: '自定义表达式', default: '$x * 2 + $y', noInputToggle: true });

    // Internal: track the last set of custom variable names for port management
    this._customVarNames = [];
    this._customVarPorts = []; // dynamic fixed-input ports for $vars
    this._startTime = Date.now();

    // Initially build ports based on mode
    this._updateCustomPorts();
  }

  /**
   * Called when mode or expression changes — rebuild input ports for custom vars
   */
  _updateCustomPorts() {
    const isCustom = this.paramValues.useCustom;

    // Remove old custom var ports
    this.fixedInputs = [];

    if (isCustom) {
      // Parse custom expression for $name variables
      const vars = extractCustomVars(this.paramValues.customExpr);
      this._customVarNames = vars;

      // Add preset "time" input in custom mode too — always available
      this.fixedInputs.push({
        name: 'time', dataType: 'number', nodeId: this.id,
        index: -1, kind: 'input', isFixed: true, paramKey: null,
      });

      // Add a fixed input for each $variable
      for (const varName of vars) {
        this.fixedInputs.push({
          name: `$${varName}`, dataType: 'number', nodeId: this.id,
          index: -1, kind: 'input', isFixed: true, paramKey: null,
        });
      }
    } else {
      // Preset mode — only needs a time input
      this.fixedInputs.push({
        name: 'time (时间)', dataType: 'number', nodeId: this.id,
        index: -1, kind: 'input', isFixed: true, paramKey: null,
      });
    }

    const oldInputs = this._rebuildAllInputs();
    return { oldInputs, newInputs: this.inputs };
  }

  evaluate(inputValues) {
    const isCustom = this.paramValues.useCustom;
    const p = this.paramValues;

    if (isCustom) {
      // Custom mode
      // inputValues[0] = time (always first)
      // inputValues[1..N] = $var1, $var2, ...
      const timeVal = (typeof inputValues[0] === 'number') ? inputValues[0] : 0;

      // Build variables map replacing $ with the actual values
      const variables = { time: timeVal, t: timeVal };

      for (let i = 0; i < this._customVarNames.length; i++) {
        const varName = this._customVarNames[i];
        variables[varName] = (typeof inputValues[i + 1] === 'number') ? inputValues[i + 1] : 0;
      }

      // Replace $name with name in expression before evaluating
      let expr = p.customExpr || '';
      for (const varName of this._customVarNames) {
        expr = expr.replace(new RegExp('\\$' + varName, 'g'), varName);
      }

      return evalExpression(expr, variables);
    } else {
      // Preset mode
      const timeVal = (typeof inputValues[0] === 'number') ? inputValues[0] : 0;
      const variables = { time: timeVal, t: timeVal };
      return evalExpression(p.presetFunc, variables);
    }
  }
}
