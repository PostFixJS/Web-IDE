import Lexer from 'postfixjs/Lexer'

export function getTokenAt (code, line, col) {
  const lexer = new Lexer()
  lexer.put(code)
  for (const token of lexer.getTokens()) {
    if (token.line === line && token.col <= col && token.token.length + token.col >= col) {
      return token
    } else if (token.line > line) {
      return null
    }
  }
  return null
}
