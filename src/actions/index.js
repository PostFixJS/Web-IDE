export const ADD_OUTPUT = 'output/ADD_OUTPUT'
export const CLEAR_OUTPUT = 'output/CLEAR'

export function addOutput (output) {
  return { type: ADD_OUTPUT, payload: output }
}
