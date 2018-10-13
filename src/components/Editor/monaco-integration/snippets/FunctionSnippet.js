import * as monaco from 'monaco-editor'

export default {
  provideCompletionItems: (model, position) => {
    return [{
      label: 'Generate a function',
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: 'Generate a function.',
      insertText: {
        value: '$1: ($2) {\n    $0\n} fun'
      },
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column + 3
      }
    }]
  }
}
