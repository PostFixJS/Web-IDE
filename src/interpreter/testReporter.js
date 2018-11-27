import store from '../store'
import * as actions from '../actions'

/**
 * Add a line to the output.
 * @param {string} text Text to print
 */
function printLine (text) {
  store.dispatch(actions.addOutput(`${text}\n`))
}

/**
 * Convert the test properties to an object.
 * @param {string} type Test type
 * @param {Array} params Test parameters (expected and actual values, optional tolerance)
 * @returns {object} Object with the test properties
 */
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

/**
 * Report a test result. This increments that statistics counter and displays a glyph in the editor.
 * @param {bool} passed Whether or not the test passed
 * @param {string} type Test type
 * @param {Array} params Test parameters (actual value, expected value, optional tolerance)
 * @param {Token} token Token of the test function
 */
export function report (passed, type, params, token) {
  store.dispatch(actions.reportTest(
    passed,
    type,
    { col: token.col, line: token.line },
    normalizeParams(type, params)
  ))
}

/**
 * Print the number of passed and failed tests to the output.
 */
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

/**
 * Reset the passed and failed test counters.
 */
export function reset () {
  store.dispatch(actions.resetTests())
}
