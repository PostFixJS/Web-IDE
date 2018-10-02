import store from '../store'
import * as actions from '../actions'

function normalizeParams (type, params) {
  switch (type) {
    case 'test=':
    case 'test!=':
      return {
        expected: params[1].toString(),
        actual: params[0].toString()
      }
    case 'test~=':
    case 'test!~=':
      return {
        expected: params[1].toString(),
        actual: params[0].toString(),
        tolerance: params[2].value
      }
    default:
      throw new Error(`Unsupported test type ${type}`)
  }
}

export function reportPassed (type, params, token) {
  store.dispatch(actions.reportTest(
    true,
    type,
    { col: token.col, line: token.line },
    normalizeParams(type, params)
  ))
}

export function reportFailed (type, params, token) {
  store.dispatch(actions.reportTest(
    false,
    type,
    { col: token.col, line: token.line },
    normalizeParams(type, params)
  ))
}

export function report (passed, type, params, token) {
  if (passed) {
    reportPassed(type, params, token)
  } else {
    reportFailed(type, params, token)
  }
}

export function showStats () {
  // TODO
}

export function reset () {
  store.dispatch(actions.resetTests())
}
