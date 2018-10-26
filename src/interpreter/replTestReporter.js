import store from '../store'
import * as actions from '../actions'

let passed = 0
let failed = 0

function printLine (text) {
  store.dispatch(actions.addReplLine({ type: 'text', value: text }))
}

export function reportPassed (type, params, token) {
  passed++
  printLine('✓ Test passed')
}

export function reportFailed (type, params, token) {
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

export function report (passed, type, params, token) {
  if (passed) {
    reportPassed(type, params, token)
  } else {
    reportFailed(type, params, token)
  }
}

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

export function reset () {
  passed = 0
  failed = 0
}
