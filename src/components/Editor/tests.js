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
