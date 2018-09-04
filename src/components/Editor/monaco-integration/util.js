/**
 * Convert a PostFix position (zero-based col/line) to a Monaco position (one-based column/lineNumber).
 * @param {object} pos PostFix position (zero-based)
 * @return {object} Monaco position (one-based)
 */
export function positionToMonaco (pos) {
  return {
    lineNumber: pos.line + 1,
    column: pos.col + 1
  }
}

/**
 * Convert a Monaco position (one-based column/lineNumber) to a PostFix position (zero-based col/line).
 * @param {object} monacoPos Monaco position (one-based)
 * @returns {object} PostFix position (zero-based)
 */
export function positionFromMonaco (monacoPos) {
  return {
    line: monacoPos.lineNumber - 1,
    col: monacoPos.column - 1
  }
}
