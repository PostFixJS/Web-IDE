import * as actions from '../actions'

export function code (state = localStorage.getItem('code') || '', action) {
  switch (action.type) {
    case actions.SET_CODE:
      return action.payload
    default:
      return state
  }
}

export function breakpoints (state = tryParseJSON(localStorage.getItem('breakpoints'), []), action) {
  switch (action.type) {
    case actions.SET_BREAKPOINTS:
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
  position: 0,
  isWaiting: false
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
    case actions.SET_INPUT_WAITING:
      return {
        ...state,
        isWaiting: action.payload
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
  fontSize: 14,
  enableProperTailCalls: false,
  showDocumentationPanel: true
}

export function settings (state = {
  ...defaultSettings,
  ...tryParseJSON(localStorage.getItem('settings'), {})
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
    case actions.SET_PROPER_TAILCALLS:
      return {
        ...state,
        enableProperTailCalls: action.payload
      }
    case actions.TOGGLE_DOCUMENTATION_PANEL:
      return {
        ...state,
        showDocumentationPanel: !state.showDocumentationPanel
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

export function serviceWorker (state = { installed: false, updateAvailable: false }, action) {
  switch (action.type) {
    case 'SW_UPDATED':
      return { ...state, updateAvailable: true }
    case 'SW_INSTALLED':
      return { ...state, installed: true }
    default:
      return state
  }
}

function tryParseJSON (json, defaultValue) {
  try {
    return JSON.parse(json) || defaultValue
  } catch (e) {
    return defaultValue
  }
}
