export const ADD_OUTPUT = 'output/ADD_OUTPUT'
export const CLEAR_OUTPUT = 'output/CLEAR'
export const SET_STACK = 'stack/SET_STACK'
export const SET_DICTS = 'dicts/SET_DICTS'
export const SET_REPL_STACK = 'stack/SET_REPL_STACK'
export const SET_REPL_DICTS = 'dicts/SET_REPL_DICTS'
export const SET_INPUT = 'input/SET_INPUT'
export const SET_INPUT_POSITION = 'input/SET_POSITION'

export function addOutput (output) {
  return { type: ADD_OUTPUT, payload: output }
}

export function setStack (stack) {
  return { type: SET_STACK, payload: stack }
}

export function setDicts (dicts) {
  return { type: SET_DICTS, payload: dicts }
}

export function setReplStack (stack) {
  return { type: SET_REPL_STACK, payload: stack }
}

export function setReplDicts (dicts) {
  return { type: SET_REPL_DICTS, payload: dicts }
}

export function setInput (input) {
  return { type: SET_INPUT, payload: input }
}

export function setInputPosition (position) {
  return { type: SET_INPUT_POSITION, payload: position }
}
