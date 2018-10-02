import store from '../store'
import * as actions from '../actions'

function printLine (text) {
  store.dispatch(actions.addOutput(`${text}\n`))
}

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
  const tests = store.getState().tests
  const passed = tests.filter((t) => t.passed).length
  const failed = tests.length - passed
  if (tests.length > 0) {
    if (failed === 0) {
      if (passed === 1) {
        printLine('✓ The test passed')
      } else {
        printLine(`✓ All ${tests.length} tests passed`)
      }
    } else {
      if (tests.length === 1) {
        printLine('✗ The test failed')
      } else {
        printLine(`✗ ${failed} of ${tests.length} tests failed`)
      }
    }
  }
}

export function reset () {
  store.dispatch(actions.resetTests())
}
