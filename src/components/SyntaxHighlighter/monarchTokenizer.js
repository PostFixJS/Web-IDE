/**
 * @fileoverview A monarch grammar is already implemented to get syntax highlighting
 * for the Monaco editor, so instead of implementing yet another grammar for another
 * syntax highlighter, this is a string tokenizer that uses an existing Monaco rules.
 * 
 * This implementation might not cover all Monarch rules, but at least it works for
 * PostFix.
 */

/**
 * Given a Monarch grammar and a matching language rule, get the type of a token.
 * @param {IMonarchLanguage} grammar Monarch grammar
 * @param {IMonarchLanguageRule} item Monarch language rule
 * @param {string} token Actual matched token value
 * @returns {string} The type of the token
 */
function getType (grammar, item, token) {
  let type = null
  if (typeof item[1] === 'string') {
    type = item[1]
  } else if (item[1].token) {
    type = item[1].token
  } else if (item[1].cases) { // the token type is conditional
    for (const [ifCase, thenType] of Object.entries(item[1].cases)) {
      if (ifCase === '@keywords' && grammar.keywords.includes(token)) {
        type = thenType
        break
      }
    }
    if (type == null) {
      type = item[1].cases['@default']
    }
  }

  // special rules for opening/closing brackets
  if (type === '@brackets') {
    for (const bracketType of grammar.brackets) {
      if (bracketType[0] === token || bracketType[1] === token) {
        type = bracketType[2]
        break
      }
    }
  }

  return type
}

/**
 * Given a matching Monarch language rule, get the next state.
 * @param {IMonarchLanguageRule} item Monarch language rule
 * @returns {string} Next state
 */
function getNextState (item) {
  if (typeof item[2] === 'string') {
    return item[2]
  } else if (item[1].next) {
    return item[1].next
  }
  return null
}

/**
 * Prepare a Monarch regex to be used by JavaScript.
 * @param {IMonarchLanguage} grammar Monarch grammar
 * @param {RegExp} rawRegex Regular expression
 */
function getRegex (grammar, rawRegex) {
  let regex = rawRegex
  if (grammar.escapes) {
    regex = rawRegex.source.replace(/@escapes/g, grammar.escapes.source)
  }
  return new RegExp(regex, 'm')
}

/**
 * Get the token and next state from the given code.
 * @param {IMonarchLanguage} grammar Monarch grammar
 * @param {IMonarchLanguageRule[]} tokens Monarch language rules
 * @param {string} code Code to match
 * @returns {object} Token, type and next state of the match
 */
function getMatch (grammar, tokens, code) {
  for (const item of tokens) {
    if (Array.isArray(item)) { // this is a token
      const match = getRegex(grammar, item[0]).exec(code)
      if (match !== null && match.index === 0) {
        const type = getType(grammar, item, match[0])
        return {
          token: match[0],
          type,
          nextState: getNextState(item),
        }
      }
    } else if (item.include) {
      // this item includes the tokens of a different state
      const match = getMatch(grammar, grammar.tokenizer[item.include.substr(1)], code)
      if (match) {
        return match
      }
    }
  }
}

/**
 * Tokenize the given code using the given Monarch grammar.
 * @param {IMonarchLanguage} grammar Monarch grammar
 * @param {string} code Code
 * @return {object} Pairs of a token and a type, corresponding to the string
 */
export default function * tokenize (grammar, code) {
  let stateStack = ['@root']
  const state = () => stateStack[stateStack.length - 1]
  let i = 0

  while (i < code.length) {
    const match = getMatch(grammar, grammar.tokenizer[state().substr(1)], code.substr(i))
    yield { token: match.token, type: match.type }

    if (match.nextState === '@push') {
      stateStack.push(state())
    } else if (match.nextState === '@pop') {
      stateStack.pop()
    } else if (match.nextState) {
      stateStack.push(match.nextState)
    }
    i += match.token.length
  }
}
