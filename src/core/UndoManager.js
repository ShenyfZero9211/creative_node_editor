/**
 * UndoManager — manages history stack for the project
 */

export class UndoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;
  }

  /**
   * Push a new state to the undo stack
   * @param {Object} state - Serialized project state
   */
  push(state) {
    const json = JSON.stringify(state);
    
    // Don't push if it's the same as the last state
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === json) {
      return;
    }

    this.undoStack.push(json);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
  }

  /**
   * Undo to the previous state
   * @param {Object} currentState - Current state of the project
   * @returns {Object|null}
   */
  undo(currentState) {
    if (this.undoStack.length === 0) return null;

    // Save current state to redo stack
    this.redoStack.push(JSON.stringify(currentState));
    
    const stateStr = this.undoStack.pop();
    // If the state we popped is exactly the same as current, pop another one
    // (This helps if we pushed the current state right before undo)
    if (stateStr === JSON.stringify(currentState) && this.undoStack.length > 0) {
      this.redoStack.push(stateStr);
      return JSON.parse(this.undoStack.pop());
    }

    return JSON.parse(stateStr);
  }

  /**
   * Redo to the next available state
   * @param {Object} currentState - Current state to save for undo
   * @returns {Object|null}
   */
  redo(currentState) {
    if (this.redoStack.length === 0) return null;

    this.undoStack.push(JSON.stringify(currentState));
    return JSON.parse(this.redoStack.pop());
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
}
