import Lexer from 'postfixjs/Lexer'
import { parseParamsList, readParamsList } from 'postfixjs/tokenUtils'
import * as monaco from 'monaco-editor'

/**
 * A completion provider that generates a function documentation placeholder.
 */
export default {
  triggerCharacters: ['<'],
  provideCompletionItems: (model, position) => {
    // check if the user is completing a documentation comment for a function
    var textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    })
    if (textUntilPosition.match(/#<$/)) {
      var textAfterPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column + 3,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineMaxColumn(model.getLineCount())
      })
      const tokens = Lexer.parse(textAfterPosition)

      if (tokens.length >= 2 && tokens[0].tokenType === 'SYMBOL' && tokens[1].tokenType === 'PARAM_LIST_START') {
        const paramsListTokens = readParamsList(tokens, 1)

        if (paramsListTokens) {
          const params = parseParamsList(tokens.slice(paramsListTokens.firstToken, paramsListTokens.lastToken + 1))

          return {
            suggestions: [{
              label: 'Generate function documentation',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Generate a documentation comment for the function in the next line.',
              insertText: [
                '', '$1',
                ...params.params.map((param, i) => `@param ${param.name} $${i + 2}`),
                ...params.returns.map((ret, i) => `@return $${i + params.params.length + 2}`),
                '>#$0'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column + 3
              }
            }]
          }
        }
      }
    }
    return { suggestions: [] }
  }
}
