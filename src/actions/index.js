/**
 * @fileoverview This file contains Redux action types and action generators (i.e. helper functions that generate actions).
 */

export const SET_CODE = 'editor/SET_CODE'
export const SET_BREAKPOINTS = 'editor/SET_BREAKPOINTS'
export const ADD_OUTPUT = 'output/ADD_OUTPUT'
export const CLEAR_OUTPUT = 'output/CLEAR'
export const SET_STACK = 'stack/SET_STACK'
export const SET_DICTS = 'dicts/SET_DICTS'
export const SET_INPUT = 'input/SET_INPUT'
export const SET_INPUT_POSITION = 'input/SET_POSITION'
export const SET_INPUT_WAITING = 'input/SET_WAITING'
export const SET_THEME = 'settings/SET_THEME'
export const SET_FONTSIZE = 'settings/SET_FONTSIZE'
export const SET_PROPER_TAILCALLS = 'settings/SET_PROPER_TAILCALLS'
export const TOGGLE_DOCUMENTATION_PANEL = 'settings/TOGGLE_DOCUMENTATION_PANEL'
export const ADD_TEST_RESULT = 'tests/ADD_TEST_RESULT'
export const RESET_TESTS = 'tests/RESET_TESTS'
export const ADD_REPL_LINE = 'repl/ADD_REPL_LINE'

/**
 * Set the main editor content.
 * @param {string} code New editor content
 */
export function setCode (code) {
  return { type: SET_CODE, payload: code }
}

/**
 * Add text to the output.
 * @param {string} output Additional output
 */
export function addOutput (output) {
  return { type: ADD_OUTPUT, payload: output }
}

/**
 * Clear the output.
 */
export function clearOutput () {
  return { type: CLEAR_OUTPUT }
}

/**
 * Set the stack.
 * @param {object} stack New stack array
 */
export function setStack (stack) {
  return { type: SET_STACK, payload: stack }
}

/**
 * Set the dictionary stack.
 * @param {object} dicts New dictionary stack
 */
export function setDicts (dicts) {
  return { type: SET_DICTS, payload: dicts }
}

/**
 * Set the input text.
 * @param {string} input Input value
 */
export function setInput (input) {
  return { type: SET_INPUT, payload: input }
}

/**
 * Set the input position.
 * @param {number} position Zero-based index of the first input character that was not read yet
 */
export function setInputPosition (position) {
  return { type: SET_INPUT_POSITION, payload: position }
}

/**
 * Start or stop waiting for the user to provide input.
 * @param {boolean} waiting True to wait, false to stop waiting
 */
export function waitForInput (waiting) {
  return { type: SET_INPUT_WAITING, payload: waiting }
}

/**
 * Set the theme of the IDE.
 * @param {string} theme Theme name (light or dark)
 */
export function setTheme (theme) {
  return { type: SET_THEME, payload: theme }
}

/**
 * Set the font size of all editors.
 * @param {number} fontSize Font size, in pixels
 */
export function setFontSize (fontSize) {
  return { type: SET_FONTSIZE, payload: fontSize }
}

/**
 * Enable or disable proper tail calls.
 * @param {boolean} enabled True to enable proper tail calls, false to disable them
 */
export function setProperTailCalls (enabled) {
  return { type: SET_PROPER_TAILCALLS, payload: enabled }
}

/**
 * Toggle the documentation panel.
 */
export function toggleDocumentationPanel () {
  return { type: TOGGLE_DOCUMENTATION_PANEL }
}

/**
 * Report the results of a test.
 * @param {boolean} passed Whether the test passed
 * @param {string} type The type of the test
 * @param {object} position The position (line, column) of the test
 * @param {object} params The parameters of the test
 */
export function reportTest (passed, type, position, params) {
  return {
    type: ADD_TEST_RESULT,
    payload: {
      passed,
      type,
      position,
      params
    }
  }
}

/**
 * Remove all test results.
 */
export function resetTests () {
  return { type: RESET_TESTS }
}

/**
 * Add a line to the REPL.
 * @param {object} line Line content and type
 */
export function addReplLine (line) {
  return { type: ADD_REPL_LINE, payload: line }
}

/**
 * Set the breakpoints in the editor.
 * @param {array} breakpoints Breakpoints
 */
export function setBreakpoints (breakpoints) {
  return { type: SET_BREAKPOINTS, payload: breakpoints }
}
