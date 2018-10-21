import Lexer from 'postfixjs/Lexer'
import { normalizeSymbol } from 'postfixjs/tokenUtils'

export function getTokenAt (code, line, col) {
  const lexer = new Lexer()
  lexer.put(code)
  for (const token of lexer.getTokens()) {
    if (token.line === line && token.col <= col && token.endCol >= col) {
      return token
    } else if (token.line > line) {
      return null
    }
  }
  return null
}

export function getTokenAtOrNext (code, line, col) {
  const lexer = new Lexer()
  lexer.put(code)
  for (const token of lexer.getTokens()) {
    if (token.line === line && token.col <= col && token.endCol >= col) {
      return token
    } else if (token.line > line || (token.line === line && token.col > col)) {
      return token
    }
  }
  return null
}

/**
 * Check if a symbol is a type symbol (i.e. if the first letter is upper-case).
 * @param {string|object} symbolName An object with a name property or a string with the name of a symbol (with or without colon)
 * @return {boolean} Whether or not the symbol is a type symbol
 */
export function isTypeSym (symbolName) {
  const name = normalizeSymbol(symbolName.name || symbolName, false)
  return name[0] === name[0].toUpperCase()
}
