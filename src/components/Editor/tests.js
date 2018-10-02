export function getTestResultMessage ({ passed, type, params }) {
  if (passed) {
    return 'Test passed'
  }

  if (type === 'test=') {
    const { actual, expected } = params
    return `Test failed: Expected \`${actual.toString()}\` to equal \`${expected.toString()}\``
  } else if (type === 'test!=') {
    const {actual, expected } = params
    return `Test failed: Expected \`${actual.toString()}\` not to equal ${expected.toString()}`
  } else if (type === 'test~=') {
    const { actual, expected, tolerance } = params
    return `Test failed: Expected \`${actual.toString()}\` to equal \`${expected.toString()}\` (within a tolerance of ±${tolerance.toString()})`
  } else if (type === 'test!~=') {
    const { actual, expected, tolerance } = params
    return `Test failed: Expected \`${actual.toString()}\` not to equal \`${expected.toString()}\` (within a tolerance of ±${tolerance.toString()})`
  }
}
