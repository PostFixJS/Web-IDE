import * as actions from '../actions'

export function output (state = '', action) {
  switch (action.type) {
    case actions.ADD_OUTPUT:
      return state + action.payload
    case actions.CLEAR_OUTPUT:
      return ''
    default:
      return state
  }
}

export function stack (state = [], action) {
  switch (action.type) {
    case actions.SET_STACK:
      return action.payload
    default:
      return state
  }
}

export function dicts (state = [], action) {
  switch (action.type) {
    case actions.SET_DICTS:
      return action.payload
    default:
      return state
  }
}
