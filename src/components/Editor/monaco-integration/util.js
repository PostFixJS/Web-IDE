import * as monaco from 'monaco-editor'
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
 * Convert a PostFix position (zero-based col/line/endCol/endLine) to a Monaco range (one-based column/lineNumber).
 * @param {object} pos PostFix range (zero-based)
 * @return {object} Monaco range (one-based)
 */
export function rangeToMonaco (range) {
  return new monaco.Range(
    range.line + 1,
    range.col + 1,
    range.endLine + 1,
    range.endCol + 1
  )
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

/**
 * Disable the command palette of the given editor that is shown by pressing F1.
 * @param {IEditor} editor Monaco editor
 */
export function disableCommandPalette (editor) {
  // disable F1 to open the command palette (https://github.com/Microsoft/monaco-editor/issues/419)
  editor.addAction({
    id: 'remove-command-palette',
    label: '',
    run: () => {},
    keybindings: [monaco.KeyCode.F1, monaco.KeyMod.Alt | monaco.KeyCode.F1]
  })
}

/**
 * Get the functions at a given position.
 * @param {object[]} functions Functions as returned by the DocParser
 * @param {object} position Monaco position (one-based)
 * @returns {object[]} Functions at the given position, may be multiple functions if they are nested
 */
export function getFunctionsAtPosition (functions, position) {
  return functions.filter(({ source: { body } }) => {
    const bodyRange = new monaco.Range.fromPositions(positionToMonaco(body.start), positionToMonaco(body.end))
    return bodyRange.containsPosition(position)
  })
}
