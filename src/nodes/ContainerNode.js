import { Node } from '../core/Node.js';

export class ContainerNode extends Node {
  constructor(x, y) {
    super('Container', x, y);
    this.title = '容器';
    this.icon = '📦';
    this.color = '#bc8cff';
    this.category = '演算';
    this.width = 180;

    // Parameters
    this.addParam('itemType', { 
      type: 'select', 
      label: '项目类型', 
      default: 'number',
      options: ['number', 'string', 'color', 'image', 'any'],
      noInputToggle: true 
    });
    
    this.addParam('count', { 
      type: 'number', 
      label: '数量', 
      default: 2, 
      min: 1, 
      max: 20, 
      step: 1,
      noInputToggle: true 
    });

    this.addParam('index', { 
      type: 'number', 
      label: '索引 (Index)', 
      default: 0, 
      min: 0, 
      max: 19, 
      step: 1 
    });

    // Output
    this.addOutput('输出', 'any');

    this._updatePorts();
  }

  /**
   * Rebuild ports when itemType or count changes
   */
  _updatePorts() {
    const type = this.paramValues.itemType || 'number';
    const count = Math.floor(this.paramValues.count) || 1;
    
    // Update output type to match itemType
    if (this.outputs[0]) {
      this.outputs[0].dataType = type;
    }

    // Set max for index parameter
    const idxParam = this.params['index'];
    if (idxParam) {
      idxParam.max = Math.max(0, count - 1);
      if (this.paramValues.index > idxParam.max) {
        this.paramValues.index = idxParam.max;
      }
    }

    // Build fixed inputs
    this.fixedInputs = [];
    for (let i = 0; i < count; i++) {
      this.fixedInputs.push({
        name: `项目 ${i}`,
        dataType: type,
        nodeId: this.id,
        index: -1,
        kind: 'input',
        isFixed: true,
        paramKey: null
      });
    }

    const oldInputs = this._rebuildAllInputs();
    return { oldInputs, newInputs: this.inputs };
  }

  // Override toggleParamInput if needed, or just let _updatePorts handle it.
  // We need to trigger _updatePorts when params change.
  
  evaluate(inputValues) {
    const count = Math.floor(this.paramValues.count) || 1;
    let index = 0;

    // Find if 'index' param has an input port enabled
    const indexPortIdx = this.inputs.findIndex(p => p.paramKey === 'index');
    if (indexPortIdx >= 0) {
      index = Math.floor(inputValues[indexPortIdx]) || 0;
    } else {
      index = Math.floor(this.paramValues.index) || 0;
    }

    // Fixed inputs (items) start at index 0 of the inputValues array
    // (since rebuildAllInputs puts fixedInputs first)
    
    // Clamp index
    const actualIndex = Math.max(0, Math.min(count - 1, index));
    
    return inputValues[actualIndex] !== undefined ? inputValues[actualIndex] : null;
  }

  // We need a hook to update ports when params change in ParamPanel
  // Node.js doesn't have a standardized "onParamChanged" besides evaluate
  // TransformNode uses _updateCustomPorts called from ParamPanel via a special case?
  // No, main.js/ParamPanel.js needs to know.
}
