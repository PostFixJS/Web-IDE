import * as monaco from 'monaco-editor'
import DocParser from 'postfixjs/DocParser'
import * as builtIns from '../../../interpreter/doc'
import { getDatadefFunctions } from './datadef'

export default {
  provideCompletionItems: (model, position) => {
    const code = model.getValue()
    const functions = DocParser.getFunctions(code)
    const variables = DocParser.getVariables(code)
    const datadefs = DocParser.getDatadefs(code)
    const symbols = DocParser.getSymbols(code)

    return [
      ...functions.map((fun) => ({
        label: fun.name,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: getFunctionSignature(fun),
        documentation: getFunctionHoverMessage(fun)
      })),
      ...builtIns.functions.map((fun) => ({
        label: fun.name,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: getFunctionSignature(fun),
        documentation: getFunctionHoverMessage(fun)
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
      })),
      ...datadefs.reduce((items, datadef) => [
        ...items,
        ...getDatadefFunctions(datadef).map((fun) => ({
          label: fun.name,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: getFunctionSignature(fun),
          documentation: getFunctionHoverMessage(fun)
        }))
      ], []),
      ...symbols.map((sym) => ({
        label: sym.name,
        kind: monaco.languages.CompletionItemKind.Value,
        documentation: sym.description
      })),
      ...builtIns.symbols.map((sym) => ({
        label: sym.name,
        kind: monaco.languages.CompletionItemKind.Value,
        documentation: sym.description
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

/**
 * Generate markdown text for documentation of a function.
 * @param {object} doc DocParser output object for a function
 * @returns Markdown object that document the function
 */
export function getFunctionHoverMessage (doc) {
  return {
    value: [
      doc.description,
      ...doc.params.map((param) => `*@param* \`${param.name}\`${param.description ? ` – ${param.description}` : ''}`),
      ...doc.returns.map((ret) => `*@return* ${ret.description ? ret.description : `\`\`\`${ret.type}\`\`\``}`)
    ].join('  \n')
  }
}
