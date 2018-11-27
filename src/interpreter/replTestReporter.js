import store from '../store'
import * as actions from '../actions'

let passed = 0
let failed = 0

/**
 * Print a line to the REPL.
 * @param {string} text Text to add to the REPL
 */
function printLine (text) {
  store.dispatch(actions.addReplLine({ type: 'text', value: text }))
}

/**
 * Report a test result. This increments that statistics counter and prints to the REPL.
 * @param {bool} passed Whether or not the test passed
 * @param {string} type Test type
 * @param {Array} params Test parameters (actual value, expected value, optional tolerance)
 * @param {Token} token Token of the test function
 */
export function report (passed, type, params, token) {
  if (passed) {
    passed++
    printLine('✓ Test passed')
  } else {
    failed++
    if (type === 'test=') {
      const [ actual, expected ] = params
      printLine(`✗ Test failed, expected ${expected.toString()} but got ${actual.toString()}`)
    } else if (type === 'test!=') {
      const [ actual, expected ] = params
      printLine(`✗ Test failed, expected value not to equal ${expected.toString()} but got ${actual.toString()}`)
    } else if (type === 'test~=') {
      const [ actual, expected, tolerance ] = params
      printLine(`✗ Test failed, expected value to equal ${expected.toString()} (within a tolerance of ±${tolerance.toString()}) but got ${actual.toString()}`)
    } else if (type === 'test!~=') {
      const [ actual, expected, tolerance ] = params
      printLine(`✗ Test failed, expected value not to equal ${expected.toString()} (within a tolerance of ±${tolerance.toString()}) but got ${actual.toString()}`)
    }
  }
}

/**
 * Print the number of passed and failed tests to the REPL.
 */
export function showStats () {
  const tests = passed + failed
  if (tests > 0) {
    if (failed === 0) {
      if (passed === 1) {
        printLine('✓ The test passed')
      } else {
        printLine(`✓ All ${tests} tests passed`)
      }
    } else {
      if (tests === 1) {
        printLine('✗ The test failed')
      } else {
        printLine(`✗ ${failed} of ${tests} tests failed`)
      }
    }
  }
}

/**
 * Reset the passed and failed test counters.
 */
export function reset () {
  passed = 0
  failed = 0
}
