import * as monaco from 'monaco-editor'
import DocParser from 'postfixjs/DocParser'
import * as builtIns from '../../../interpreter/doc'

export default {
  provideCompletionItems: (model, position) => {
    const code = model.getValue()
    const functions = DocParser.getFunctions(code)
    const variables = DocParser.getVariables(code)
    const datadefs = DocParser.getDatadefs(code)

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
      ...datadefs.reduce((items, datadef) => [...items, ...getDatadefCompletionItems(datadef)], [])
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

function getDatadefCompletionItems (datadef) {
  const datadefName = datadef.name.toLowerCase().substr(1)
  if (datadef.type === 'union') {
    return [{
      label: `${datadefName}?`,
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '( obj :Obj -> :Bool ) fun',
      documentation: {
        value: `Check if the given object is an instance of ${datadef.name}.`
      }
    }]
  } else {
    const constructorDoc = {
      description: `Create an instance of ${datadef.name}.`,
      params: datadef.fields,
      returns: [{
        type: datadef.name,
        description: `New ${datadef.name}`
      }]
    }
    const typecheckDoc = {
      description: `Check if the given object is an instance of ${datadef.name}.`,
      params: [{
        name: 'obj',
        type: ':Obj',
        description: 'Object'
      }],
      returns: [{
        type: ':Bool',
        description: `True if the object is an instance of ${datadef.name}, false otherwise`
      }]
    }
    return [{
      label: `${datadefName}.new`,
      kind: monaco.languages.CompletionItemKind.Constructor,
      detail: getFunctionSignature(constructorDoc),
      documentation: getFunctionHoverMessage(constructorDoc)
    }, {
      label: `${datadefName}?`,
      kind: monaco.languages.CompletionItemKind.Function,
      detail: getFunctionSignature(typecheckDoc),
      documentation: getFunctionHoverMessage(typecheckDoc)
    }, ...datadef.fields.map((field) => {
      const getterDoc = {
        description: `Get the ${field.name} field of the given ${datadef.name} instance.`,
        params: [{
          name: datadefName,
          type: datadef.name,
          description: `${datadef.name} instance`
        }],
        returns: [{
          type: field.type,
          description: field.description
        }]
      }
      return {
        label: `${datadefName}.${field.name}`,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: getFunctionSignature(getterDoc),
        documentation: getFunctionHoverMessage(getterDoc)
      }
    }), ...datadef.fields.map((field) => {
      const setterDoc = {
        description: `Set the ${field.name} field of the given ${datadef.name} instance.`,
        params: [{
          name: datadefName,
          type: datadef.name,
          description: `${datadef.name} instance`
        }, {
          name: field.name,
          type: field.type,
          description: field.description
        }],
        returns: [{
          type: datadef.name,
          description: `Updated ${datadef.name} instance`
        }]
      }
      return {
        label: `${datadefName}-${field.name}-set`,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: getFunctionSignature(setterDoc),
        documentation: getFunctionHoverMessage(setterDoc)
      }
    }), ...datadef.fields.map((field) => {
      const updaterDoc = {
        description: `Update the ${field.name} field of the given ${datadef.name} instance.`,
        params: [{
          name: datadefName,
          type: datadef.name,
          description: `${datadef.name} instance`
        }, {
          name: 'updater',
          type: ':ExeArr',
          description: `Update function that will be called with the current ${field.name} value (${field.type}) and must return a new value`
        }],
        returns: [{
          type: datadef.name,
          description: `Updated ${datadef.name} instance`
        }]
      }
      return {
        label: `${datadefName}-${field.name}-do`,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: getFunctionSignature(updaterDoc),
        documentation: getFunctionHoverMessage(updaterDoc)
      }
    })]
  }
}
