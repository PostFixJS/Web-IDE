import * as monaco from 'monaco-editor'

export default {
  provideCompletionItems: (model, position) => {
    const items = []

    const lineIsEmputy = model.getLineContent(position.lineNumber).trim().length === 0
    if (lineIsEmputy) {
      items.push({
        label: 'Generate a function',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'Generate a function.',
        insertText: {
          value: '${1:name}: (${2:parameters}) {\n    $0\n} fun' // eslint-disable-line no-template-curly-in-string
        },
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column + 3
        }
      })
    }

    return items
  }
}
