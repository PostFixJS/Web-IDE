export const ADD_OUTPUT = 'output/ADD_OUTPUT'
export const CLEAR_OUTPUT = 'output/CLEAR'
export const SET_STACK = 'stack/SET_STACK'
export const SET_DICTS = 'dicts/SET_DICTS'

export function addOutput (output) {
  return { type: ADD_OUTPUT, payload: output }
}

export function setStack (stack) {
  return { type: SET_STACK, payload: stack }
}

export function setDicts (dicts) {
  return { type: SET_DICTS, payload: dicts }
}
