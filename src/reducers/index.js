import * as actions from '../actions'

export function output (state = '', action) {
  switch (action.type) {
    case actions.ADD_OUTPUT:
      return state + action.payload
    default:
      return state
  }
}
