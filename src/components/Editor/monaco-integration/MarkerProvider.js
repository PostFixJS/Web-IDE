import * as monaco from 'monaco-editor'
import { debounce } from 'throttle-debounce'
import Lexer from 'postfixjs/Lexer'
import { readParamsList, normalizeSymbol } from 'postfixjs/tokenUtils'
import { isBuiltInType } from 'postfixjs/types/util'
import DocParser from 'postfixjs/DocParser'
import * as builtIns from '../../../interpreter/doc'
import { isTypeSym } from '../postfixUtil'
import { rangeToMonaco, getFunctionsAtPosition, positionToMonaco } from './util'
import { getDatadefFunctionNames } from './datadef'

/**
 * A class that checks the code and adds markers for warnings and errors.
 */
export default class MarkerProvider {
  /**
   * Create a new marker provider and listen for changes in the given editor.
   * @param {ITextEditor} editor Monaco editor
   */
  constructor (editor) {
    this.model = editor.getModel()
    this.model.onDidChangeContent(this.check)
    this.check()
  }

  /**
   * Check the code and update the markers.
   */
  check = debounce(500, () => {
    const code = this.model.getValue()
    const tokens = Lexer.parse(code)
    const functions = DocParser.getFunctions(code, { withRanges: true })
    const lambdaFunctions = DocParser.getLambdaFunctions(code, { withRanges: true })
    const datadefs = DocParser.getDatadefs(code)
    const variables = DocParser.getVariables(code)

    monaco.editor.setModelMarkers(this.model, 'webide', [
      ...this.checkBrackets(tokens),
      ...this.checkParamsLists(tokens, { datadefs }),
      ...this.checkReferences(tokens, { datadefs, functions, lambdaFunctions, variables })
    ])
  });

  /**
   * Check the given tokens for invalid parameter lists.
   * @param {Token[]} tokens Tokenized code
   * @param {object} data Additional data to be used
   * @param {object[]} data.datadefs Data definitions in the code
   * @yields {IMarkerData} Markers of errors
   */
  * checkParamsLists (tokens, data) {
    for (let i = 0; i < tokens.length; i++) {
      const paramsList = readParamsList(tokens, i)
      if (paramsList) {
        yield * this.checkParamsList(tokens.slice(paramsList.firstToken, paramsList.lastToken + 1), data)
        i = paramsList.lastToken // + 1 is done by the for loop
      }
    }
  }

  /**
   * Check the given tokens of a parameter list for invalid parameter lists.
   * @param {Token[]} tokens Tokens of a parameter list
   * @param {object} data Additional data to be used
   * @param {object[]} data.datadefs Data definitions in the code
   * @yields {IMarkerData} Markers of errors
   */
  * checkParamsList (tokens, { datadefs }) {
    let rightArrowPosition = tokens.findIndex((token) => token.tokenType === 'RIGHT_ARROW')
    const paramsEnd = rightArrowPosition >= 0 ? rightArrowPosition : tokens.length - 1

    // check params
    for (let i = 1; i < paramsEnd; i++) {
      const token = tokens[i]
      if (!(token.tokenType === 'REFERENCE' || token.tokenType === 'SYMBOL')) {
        yield error('The parameter list may only contain variable names and type names.', token)
      } else if (i === 0 && token.tokenType === 'SYMBOL') {
        yield error('Expected to find a variable name at the first position of the parameter list.', token)
      } else if (i > 0 && token.tokenType === 'SYMBOL' && tokens[i - 1].tokenType !== 'REFERENCE') {
        yield error('Expected a parameter name to precede this type name.', token)
      } else if (token.tokenType === 'REFERENCE' && builtIns.functions.some(({ name }) => name === token.token)) {
        yield warning(`${token.token} collides with a built-in with the same name. You should rename the parameter.`, token)
      } else if (token.tokenType === 'SYMBOL' && !isTypeSym(token.token)) {
        yield error(`${token.token} is not a valid type name.`, token)
      } else if (token.tokenType === 'SYMBOL' && !isBuiltInType(token.token) && !datadefs.some(({ name }) => name === normalizeSymbol(token.token, true))) {
        yield warning(`Unknown type name ${token.token}.`, token)
      }
    }

    // check returns, if any
    if (rightArrowPosition >= 0) {
      for (let i = rightArrowPosition + 1; i < tokens.length - 1; i++) {
        const token = tokens[i]
        if (token.tokenType !== 'SYMBOL') {
          yield error('The return list may only contain type names (e.g. :Int).', token)
        } else if (!isTypeSym(token.token)) {
          yield error(`${token.token} is not a valid type name.`, token)
        }
      }
    }
  }

  /**
   * Check the given tokens for matching brackets and yield error markers.
   * @param {Token[]} tokens Tokenized code
   * @yields {IMarkerData} Markers of errors
   */
  * checkBrackets (tokens) {
    const brackets = []
    for (const token of tokens) {
      const top = brackets[brackets.length - 1] && brackets[brackets.length - 1].tokenType

      switch (token.tokenType) {
        case 'PARAM_LIST_END':
          brackets.pop()
          if (top !== 'PARAM_LIST_START') {
            yield error('Expected matching opening bracket.', token)
          }
        break
        case 'ARR_END':
          brackets.pop()
          if (top !== 'ARR_START') {
            yield error('Expected matching opening bracket.', token)
          }
          break
        case 'EXEARR_END':
          brackets.pop()
          if (top !== 'EXEARR_START') {
            yield error('Expected matching opening bracket.', token)
          }
          break
        case 'PARAM_LIST_START':
        case 'ARR_START':
        case 'EXEARR_START':
          brackets.push(token)
          break
        default:
          // ignore other tokens
      }
    }

    for (const openBracket of brackets) {
      yield error('Expected matching closing bracket.', openBracket)
    }
  }

  /**
   * Check the given tokens for undefined references and yield error markers.
   * This uses heuristics, so it might not find all cases, especially it doesn't care about definition order.
   * @param {Token[]} tokens Tokenized code
   * @param {object} data Previously parsed definitions
   * @param {object} data.datadefs Datadefs found in the code
   * @param {object} data.functions Functions found in the code
   * @param {object} data.lambdaFunctions Lambda functions found in the code
   * @param {object} data.variables Variables found in the code
   * @yields {IMarkerData} Markers of errors
   */
  * checkReferences (tokens, { datadefs, functions, lambdaFunctions, variables }) {
    let paramListStack = []
    for (const token of tokens) {
      // ignore references in parameter lists as they are used to define variables
      if (token.tokenType === 'PARAM_LIST_END') {
        if (paramListStack.length > 0) {
          paramListStack.pop()
        }
      } else if (token.tokenType === 'PARAM_LIST_START') {
        paramListStack.push(token)
      }
      if (paramListStack.length > 0) continue
      if (token.tokenType !== 'REFERENCE') continue

      const name = token.token

      // check built-ins, functions and variables
      if (builtIns.functions.some((fun) => fun.name === name)) continue
      if (functions.some((fun) => fun.name === name)) continue
      if (variables.some((variable) => variable.name === name)) continue

      // check datadef functions
      if (datadefs.some((datadef) => getDatadefFunctionNames(datadef).some((fun) => fun === name))) continue

      // check if the reference is a function parameter inside a function
      const functionsAtPosition = getFunctionsAtPosition(functions, positionToMonaco(token))
      if (functionsAtPosition.length > 0 && token.token === 'recur') continue // recur is always defined inside a function
      if (functionsAtPosition.some(({ params }) => params && params.some((param) => param.name === token.token))) continue

      // check if the reference is a function parameter inside a lambda function
      const lambdaFunctionsAtPosition = getFunctionsAtPosition(lambdaFunctions, positionToMonaco(token))
      if (lambdaFunctionsAtPosition.some(({ params }) => params && params.some((param) => param.name === token.token))) continue

      // still not found, so the reference might be invalid
      yield warning(`Unknown function or variable name ${token.token}.`, token)
    }
  }
}

/**
 * Create an error marker.
 * @param {string} message Error message
 * @param {Token} token Source token
 * @returns {IMarkerData} Monaco error marker
 */
function error (message, token) {
  return {
    severity: monaco.MarkerSeverity.Error,
    message,
    ...rangeToMonaco(token)
  }
}

/**
 * Create a warning marker.
 * @param {string} message Warning message
 * @param {Token} token Source token
 * @returns {IMarkerData} Monaco warning marker
 */
function warning (message, token) {
  return {
    severity: monaco.MarkerSeverity.Warning,
    message,
    ...rangeToMonaco(token)
  }
}
