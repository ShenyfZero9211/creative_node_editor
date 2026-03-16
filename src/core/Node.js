/**
 * Node base class — V2 with dynamic port toggles and unique IDs
 */

let _nodeIdCounter = 0;

export class Node {
  /**
   * @param {string} type
   * @param {number} x
   * @param {number} y
   */
  constructor(type, x, y) {
    this.id = `node_${++_nodeIdCounter}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = 170;
    this.height = 0; // computed dynamically
    this.selected = false;
    this.headerHeight = 30;

    /**
     * Fixed input ports (not from param toggles).
     * @type {Port[]}
     */
    this.fixedInputs = [];

    /**
     * Dynamic input ports (from param toggles).
     * Rebuilt by rebuildDynamicInputs().
     * @type {Port[]}
     */
    this.dynamicInputs = [];

    /**
     * All input ports = fixedInputs + dynamicInputs (computed).
     * @type {Port[]}
     */
    this.inputs = [];

    /** @type {Port[]} */
    this.outputs = [];

    /**
     * Parameter definitions. key → ParamDef
     * @type {Object<string, ParamDef>}
     */
    this.params = {};

    /**
     * Current parameter values. key → value
     * @type {Object<string, any>}
     */
    this.paramValues = {};

    /**
     * Which params have their input port enabled. key → boolean
     * @type {Object<string, boolean>}
     */
    this.paramInputEnabled = {};

    this.title = type;
    this.color = '#58a6ff';
    this.icon = '●';
    this.category = '';

    this._dirty = true;
  }

  /** Serialize node to plain object */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      paramValues: { ...this.paramValues },
      paramInputEnabled: { ...this.paramInputEnabled },
    };
  }

  /** Reset global ID counter (for project loading) */
  static resetIdCounter(val = 0) {
    _nodeIdCounter = val;
  }

  static getIdCounter() {
    return _nodeIdCounter;
  }

  // ===== Port management =====

  /**
   * Add a fixed input port (not toggleable)
   */
  addFixedInput(name, dataType = 'any') {
    this.fixedInputs.push({
      name, dataType, nodeId: this.id,
      index: -1, // recomputed
      kind: 'input', isFixed: true, paramKey: null,
    });
    const oldInputs = this._rebuildAllInputs();
    return { oldInputs, newInputs: this.inputs };
  }

  /**
   * Add an output port
   */
  addOutput(name, dataType = 'any') {
    this.outputs.push({
      name, dataType, nodeId: this.id,
      index: this.outputs.length, kind: 'output',
    });
  }

  /**
   * Define a parameter with optional input toggle support.
   * @param {string} key
   * @param {ParamDef} def
   */
  addParam(key, def) {
    this.params[key] = def;
    this.paramValues[key] = def.default;
    // By default, input is disabled unless specified
    this.paramInputEnabled[key] = def.inputEnabledByDefault || false;
    this._rebuildAllInputs();
  }

  /**
   * Toggle a parameter's input port on/off
   */
  toggleParamInput(key, enabled) {
    if (!(key in this.params)) return;
    // Some params cannot be toggled (e.g. file, select)
    if (this.params[key].noInputToggle) return;
    this.paramInputEnabled[key] = enabled;
    const oldInputs = this._rebuildAllInputs();
    this._dirty = true;
    return { oldInputs, newInputs: this.inputs };
  }

  /**
   * Rebuild all inputs: fixed + dynamic from param toggles
   */
  _rebuildAllInputs() {
    const oldInputs = [...this.inputs];
    // Dynamic: params that have inputEnabled=true
    this.dynamicInputs = [];
    for (const [key, def] of Object.entries(this.params)) {
      if (this.paramInputEnabled[key] && !def.noInputToggle) {
        this.dynamicInputs.push({
          name: def.label,
          dataType: def.inputDataType || 'number',
          nodeId: this.id,
          index: -1,
          kind: 'input',
          isFixed: false,
          paramKey: key,
        });
      }
    }
    // Merge
    this.inputs = [...this.fixedInputs, ...this.dynamicInputs];
    // Reindex
    this.inputs.forEach((p, i) => { p.index = i; p.nodeId = this.id; });
    return oldInputs;
  }

  /**
   * Get the param key that an input port corresponds to (or null for fixed ports).
   */
  getInputParamKey(portIndex) {
    const port = this.inputs[portIndex];
    return port ? port.paramKey : null;
  }

  /**
   * Evaluate this node given input values. Override in subclasses.
   * inputValues[i] = value from connected node at inputs[i], or null.
   * Should apply dynamic input overrides to paramValues automatically.
   * @param {any[]} inputValues
   * @returns {any}
   */
  evaluate(inputValues) {
    return null;
  }

  /**
   * Apply connected input values to paramValues (call in evaluate)
   */
  _applyInputOverrides(inputValues) {
    for (let i = 0; i < this.inputs.length; i++) {
      const port = this.inputs[i];
      if (port.paramKey && inputValues[i] !== null && inputValues[i] !== undefined) {
        this.paramValues[port.paramKey] = inputValues[i];
      }
    }
  }

  markDirty() {
    this._dirty = true;
  }

  /**
   * Compute the height based on ports count
   */
  computeHeight() {
    const portRows = Math.max(this.inputs.length, this.outputs.length);
    this.height = this.headerHeight + Math.max(portRows, 1) * 24 + 14;
    return this.height;
  }

  /**
   * Get the position of a port (in node-local coords)
   */
  getPortPos(kind, index) {
    const py = this.headerHeight + 12 + index * 24;
    if (kind === 'input') {
      return { x: 0, y: py };
    }
    return { x: this.width, y: py };
  }

  getPortGlobalPos(kind, index) {
    const local = this.getPortPos(kind, index);
    return { x: this.x + local.x, y: this.y + local.y };
  }

  hitTest(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  hitTestPort(px, py, radius = 8) {
    for (let i = 0; i < this.inputs.length; i++) {
      const pos = this.getPortGlobalPos('input', i);
      if (Math.hypot(px - pos.x, py - pos.y) <= radius) {
        return { kind: 'input', index: i };
      }
    }
    for (let i = 0; i < this.outputs.length; i++) {
      const pos = this.getPortGlobalPos('output', i);
      if (Math.hypot(px - pos.x, py - pos.y) <= radius) {
        return { kind: 'output', index: i };
      }
    }
    return null;
  }

  hitTestHeader(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.headerHeight;
  }
}

/**
 * @typedef {Object} Port
 * @property {string} name
 * @property {string} dataType
 * @property {string} nodeId
 * @property {number} index
 * @property {'input'|'output'} kind
 * @property {boolean} [isFixed]
 * @property {string|null} [paramKey]
 */

/**
 * @typedef {Object} ParamDef
 * @property {string} type - 'number'|'color'|'text'|'select'|'file'|'boolean'|'textarea'|'url'
 * @property {string} label
 * @property {any} default
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {string[]} [options]
 * @property {boolean} [noInputToggle] - if true, this param cannot be toggled to an input port
 * @property {string} [inputDataType] - data type for the dynamic input port
 * @property {boolean} [inputEnabledByDefault]
 */
