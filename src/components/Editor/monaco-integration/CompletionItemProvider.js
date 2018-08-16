import * as monaco from 'monaco-editor'
import DocParser from 'postfixjs/DocParser'
import * as builtIns from '../../../interpreter/doc'

export default {
  provideCompletionItems: (model, position) => {
    const code = model.getValue()
    const functions = DocParser.getFunctions(code)
    const variables = DocParser.getVariables(code)

    return [
      ...functions.map((fun) => ({
        label: fun.name,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: getFunctionSignature(fun),
        documentation: fun.description
      })),
      ...builtIns.functions.map((fun) => ({
        label: fun.name,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: getFunctionSignature(fun),
        documentation: fun.description
      })),
      ...variables.map((fun) => ({
        label: fun.name,
        kind: monaco.languages.CompletionItemKind.Variable,
        documentation: fun.description
      })),
      ...builtIns.variables.map((fun) => ({
        label: fun.name,
        kind: monaco.languages.CompletionItemKind.Variable,
        documentation: fun.description
      }))
    ]
  }
}

/**
 * Generate markdown text for a function signature.
 * @param {object} doc DocParser output objects for a function
 * @returns Markdown string
 */
function getFunctionSignature (doc) {
  let signature
  const params = doc.params
    .map(({ name, type }) => `${name}${type ? ` ${type}` : ''}`)
    .join(', ')
  const returns = doc.returns.map((r) => r.type).join(', ')
  if (returns.length > 0) {
    signature = `(${params.length > 0 ? ` ${params}` : ''} -> ${returns} )`
  } else {
    signature = `(${params.length > 0 ? ` ${params} ` : ''})`
  }
  return `${signature} fun`
}
