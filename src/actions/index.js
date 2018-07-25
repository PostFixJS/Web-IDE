export const ADD_OUTPUT = 'output/ADD_OUTPUT'

export function addOutput (output) {
  return { type: ADD_OUTPUT, payload: output }
}
