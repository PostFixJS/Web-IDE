import { MessageController } from 'monaco-editor/esm/vs/editor/contrib/message/messageController'

/**
 * Convert a PostFix position (zero-based col/line) to a Monaco position (one-based column/lineNumber).
 * @param {object} pos PostFix position (zero-based)
 * @return {object} Monaco position (one-based)
 */
export function positionToMonaco (pos) {
  return {
    lineNumber: pos.line + 1,
    column: pos.col + 1
  }
}

/**
 * Convert a Monaco position (one-based column/lineNumber) to a PostFix position (zero-based col/line).
 * @param {object} monacoPos Monaco position (one-based)
 * @returns {object} PostFix position (zero-based)
 */
export function positionFromMonaco (monacoPos) {
  return {
    line: monacoPos.lineNumber - 1,
    col: monacoPos.column - 1
  }
}

/**
 * Show a message at a specific position in the editor.
 * @param {IEditor} editor Monaco editor
 * @param {string} message Message to show
 * @param {object} position Position to show the message at, defaults to the current cursor position
 */
export function showMessage (editor, message, position = editor.getPosition()) {
  MessageController.get(editor).showMessage(message, position)
}
