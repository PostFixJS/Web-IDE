import * as actions from '../actions'

export function code (state = localStorage.getItem('code') || '', action) {
  switch (action.type) {
    case actions.SET_CODE:
      return action.payload
    default:
      return state
  }
}

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

const defaultSettings = {
  theme: 'light',
  fontSize: 14
}
function getSettings () {
  try {
    return JSON.parse(localStorage.getItem('settings'))
  } catch (e) {
    return {}
  }
}
export function settings (state = {
  ...defaultSettings,
  ...getSettings()
}, action) {
  switch (action.type) {
    case actions.SET_THEME:
      return {
        ...state,
        theme: action.payload
      }
    case actions.SET_FONTSIZE:
      return {
        ...state,
        fontSize: action.payload
      }
    default:
      return state
  }
}

export function tests (state = [], action) {
  switch (action.type) {
    case actions.ADD_TEST_RESULT:
      return [
        ...state,
        action.payload
      ]
    case actions.RESET_TESTS:
      return []
    default:
      return state
  }
}

export function replLines (state = [], action) {
  switch (action.type) {
    case actions.ADD_REPL_LINE:
      return [
        ...state,
        action.payload
      ]
    default:
      return state
  }
}
