import * as monaco from 'monaco-editor'
import { debounce } from 'throttle-debounce'
import Lexer from 'postfixjs/Lexer'
import { readParamsList } from 'postfixjs/tokenUtils'
import * as builtIns from '../../../interpreter/doc'
import { isTypeSym } from '../postfixUtil'
import { rangeToMonaco } from './util'

/**
 * A class that checks the code and adds markers for warnings and errors.
 */
export default class MarkerProvier {
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
    const tokens = Lexer.parse(this.model.getValue())
    monaco.editor.setModelMarkers(this.model, 'webide', [
      ...this.checkBrackets(tokens),
      ...this.checkParamsLists(tokens)
    ])
  });

  /**
   * Check the given tokens for invalid parameter lists.
   * @param {Token[]} tokens Tokenized code
   * @yields {IMarkerData} Markers of errors
   */
  * checkParamsLists (tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const paramsList = readParamsList(tokens, i)
      if (paramsList) {
        yield * this.checkParamsList(tokens.slice(paramsList.firstToken, paramsList.lastToken + 1))
        i = paramsList.lastToken // + 1 is done by the for loop
      }
    }
  }

  /**
   * Check the given tokens of a parameter list for invalid parameter lists.
   * @param {Token[]} tokens Tokens of a parameter list
   * @yields {IMarkerData} Markers of errors
   */
  * checkParamsList (tokens) {
    let rightArrowPosition = tokens.findIndex((token) => token.tokenType === 'RIGHT_ARROW')
    const paramsEnd = rightArrowPosition >= 0 ? rightArrowPosition : tokens.length - 1

    // check params
    for (let i = 1; i < paramsEnd; i++) {
      const token = tokens[i]
      if (!(token.tokenType === 'REFERENCE' || token.tokenType === 'SYMBOL')) {
        yield {
          severity: monaco.MarkerSeverity.Error,
          message: 'The parameter list may only contain variable names and type names.',
          ...rangeToMonaco(token)
        }
      } else if (i === 0 && token.tokenType === 'SYMBOL') {
        yield {
          severity: monaco.MarkerSeverity.Error,
          message: 'Expected to find a variable name at the first position of the parameter list.',
          ...rangeToMonaco(token)
        }
      } else if (i > 0 && token.tokenType === 'SYMBOL' && tokens[i - 1].tokenType !== 'REFERENCE') {
        yield {
          severity: monaco.MarkerSeverity.Error,
          message: 'Expected a parameter name to preced this type name.',
          ...rangeToMonaco(token)
        }
      } else if (token.tokenType === 'REFERENCE' && builtIns.functions.some(({ name }) => name === token.token)) {
        yield {
          severity: monaco.MarkerSeverity.Warning,
          message: `${token.token} collides with a built-in with the same name. You should rename the parameter.`,
          ...rangeToMonaco(token)
        }
      } else if (token.tokenType === 'SYMBOL' && !isTypeSym(token.token)) {
        yield {
          severity: monaco.MarkerSeverity.Error,
          message: `${token.token} is not a valid type name.`,
          ...rangeToMonaco(token)
        }
      }

      // TODO check if the type is known (built-in or datadef'd) if the token is a symbol
    }

    // check returns, if any
    if (rightArrowPosition >= 0) {
      for (let i = rightArrowPosition + 1; i < tokens.length - 1; i++) {
        const token = tokens[i]
        if (token.tokenType !== 'SYMBOL') {
          yield {
            severity: monaco.MarkerSeverity.Error,
            message: 'The return list may only contain type names (e.g. :Int).',
            ...rangeToMonaco(token)
          }
        } else if (!isTypeSym(token.token)) {
          yield {
            severity: monaco.MarkerSeverity.Error,
            message: `${token.token} is not a valid type name.`,
            ...rangeToMonaco(token)
          }
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
            yield {
              severity: monaco.MarkerSeverity.Error,
              message: 'Expected matching opening bracket.',
              ...rangeToMonaco(token)
            }
          }
        break
        case 'ARR_END':
          brackets.pop()
          if (top !== 'ARR_START') {
            yield {
              severity: monaco.MarkerSeverity.Error,
              message: 'Expected matching opening bracket.',
              ...rangeToMonaco(token)
            }
          }
          break
        case 'EXEARR_END':
          brackets.pop()
          if (top !== 'EXEARR_START') {
            yield {
              severity: monaco.MarkerSeverity.Error,
              message: 'Expected matching opening bracket.',
              ...rangeToMonaco(token)
            }
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
      yield {
        severity: monaco.MarkerSeverity.Error,
        message: 'Expected matching closing bracket.',
        ...rangeToMonaco(openBracket)
      }
    }
  }
}
