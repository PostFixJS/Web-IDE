import * as monaco from 'monaco-editor'
import DocParser from 'postfixjs/DocParser'
import * as builtIns from '../../../interpreter/doc'
import { getDatadefFunctions } from './datadef'
import { positionToMonaco } from './util'

export default {
  provideCompletionItems: (model, position) => {
    const code = model.getValue()
    const functions = DocParser.getFunctions(code, { withRanges: true })
    const variables = DocParser.getVariables(code)
    const datadefs = DocParser.getDatadefs(code)
    const symbols = DocParser.getSymbols(code)

    // may be multiple functions if they are nested
    const functionsAtPosition = functions.filter(({ source: { body } }) => {
      const bodyRange = new monaco.Range.fromPositions(positionToMonaco(body.start), positionToMonaco(body.end))
      return bodyRange.containsPosition(position)
    })

    return [
      ...functionsAtPosition.map((fun) => fun.params.map((param) => ({
        label: param.name,
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: param.type || ':Obj',
        documentation: param.description
      }))).reduce((allParams, fnParams) => allParams.concat(fnParams), []),
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
      ...deduplicateSymbols(builtIns.symbols, symbols)
    ]
  }
}

function deduplicateSymbols (builtIns, userSymbols) {
  const symbols = new Map()
  for (const sym of builtIns) {
    symbols.set(sym.name, {
      label: sym.name,
      kind: monaco.languages.CompletionItemKind.Value,
      documentation: sym.description
    })
  }
  for (const sym of userSymbols) {
    if (symbols.has(sym.name)) {
      if (sym.description) { // existing description and new, user-provided description, so show both
        const other = symbols.get(sym.name)
        symbols.set(sym.name, {
          label: sym.name,
          kind: sym.name[1].toUpperCase() === sym.name[1] ? monaco.languages.CompletionItemKind.Class : monaco.languages.CompletionItemKind.Value,
          documentation: { value: `* ${other.documentation.value || other.documentation}\n* ${sym.description}` }
        })
      }
    } else {
      symbols.set(sym.name, {
        label: sym.name,
        kind: sym.name[1].toUpperCase() === sym.name[1] ? monaco.languages.CompletionItemKind.Class : monaco.languages.CompletionItemKind.Value,
        documentation: sym.description
      })
    }
  }
  return symbols.values()
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
