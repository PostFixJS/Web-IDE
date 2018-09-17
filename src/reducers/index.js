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

export function input (state = {
  value: '',
  position: 0
}, action) {
  switch (action.type) {
    case actions.SET_INPUT:
      return {
        ...state,
        value: action.payload
      }
    case actions.SET_INPUT_POSITION:
      return {
        ...state,
        position: action.payload
      }
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

export function theme (state = 'light', action) {
  switch (action.type) {
    case actions.TOGGLE_THEME:
      return state === 'light' ? 'dark' : 'light'
    default:
      return state
  }
}
