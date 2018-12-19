/**
 * Get a human-readable string representation of the given test result.
 * @param {object} test Test result object
 * @param {boolean} test.passed Whether the test passed
 * @param {string} test.type The test type
 * @param {object} test.params Test parameters, depend on the test type
 */
export function getTestResultMessage ({ passed, type, params }) {
  if (passed) {
    return '✓ Test passed'
  }

  if (type === 'test=') {
    const { actual, expected } = params
    return `✗ Expected \`${expected.toString()}\` but got \`${actual.toString()}\``
  } else if (type === 'test!=') {
    const {actual, expected } = params
    return `✗ Expected value not to equal \`${expected.toString()}\` but got \`${actual.toString()}\``
  } else if (type === 'test~=') {
    const { actual, expected, tolerance } = params
    return `✗ Expected value to to equal \`${expected.toString()}\` (within a tolerance of ±${tolerance.toString()}) but got \`${actual.toString()}\``
  } else if (type === 'test!~=') {
    const { actual, expected, tolerance } = params
    return `✗ Expected value not to equal \`${expected.toString()}\` (within a tolerance of ±${tolerance.toString()}) but got \`${actual.toString()}\``
  }
}
