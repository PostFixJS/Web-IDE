export const SET_CODE = 'editor/SET_CODE'
export const ADD_OUTPUT = 'output/ADD_OUTPUT'
export const CLEAR_OUTPUT = 'output/CLEAR'
export const SET_STACK = 'stack/SET_STACK'
export const SET_DICTS = 'dicts/SET_DICTS'
export const SET_INPUT = 'input/SET_INPUT'
export const SET_INPUT_POSITION = 'input/SET_POSITION'
export const TOGGLE_THEME = 'theme/TOGGLE'
export const ADD_TEST_RESULT = 'tests/ADD_TEST_RESULT'
export const RESET_TESTS = 'tests/RESET_TESTS'
export const ADD_REPL_LINE = 'repl/ADD_REPL_LINE'

export function setCode (code) {
  return { type: SET_CODE, payload: code }
}

export function addOutput (output) {
  return { type: ADD_OUTPUT, payload: output }
}

export function clearOutput () {
  return { type: CLEAR_OUTPUT }
}

export function setStack (stack) {
  return { type: SET_STACK, payload: stack }
}

export function setDicts (dicts) {
  return { type: SET_DICTS, payload: dicts }
}

export function setInput (input) {
  return { type: SET_INPUT, payload: input }
}

export function setInputPosition (position) {
  return { type: SET_INPUT_POSITION, payload: position }
}

export function toggleTheme () {
  return { type: TOGGLE_THEME }
}

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

export function resetTests () {
  return { type: RESET_TESTS }
}

export function addReplLine (line) {
  return { type: ADD_REPL_LINE, payload: line }
}
