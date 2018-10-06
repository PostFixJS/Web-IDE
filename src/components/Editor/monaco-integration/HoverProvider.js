import { getTokenAt } from '../postfixUtil'
import DocParser from 'postfixjs/DocParser'
import { normalizeSymbol } from 'postfixjs/tokenUtils'
import * as monaco from 'monaco-editor'
import * as builtIns from '../../../interpreter/doc'
import { getDatadefFunctions } from './datadef'

export default {
  provideHover: (model, position) => {
    const code = model.getValue()
    const token = getTokenAt(code, position.lineNumber - 1, position.column - 1)

    if (token != null) {
      if (token.tokenType === 'REFERENCE') {
        let docs = builtIns.functions.filter((doc) => doc.name === token.token)
        if (docs.length === 0) { // built-in functions take precedence
          const functions = DocParser.getFunctions(code)
          docs = functions.filter((doc) => doc.name === token.token)
        }
        if (docs.length === 0) {
          const datadefs = DocParser.getDatadefs(code)
          for (const datadef of datadefs) {
            // all generated functions start with the datadef name
            if (token.token.indexOf(datadef.name.substr(1).toLowerCase()) !== 0) {
              continue
            }
            const fun = getDatadefFunctions(datadef).find(({name}) => name === token.token)
            if (fun) {
              docs = [fun]
              break
            }
          }
        }
        if (docs.length > 0) {
          const usageMessages = getFunctionHoverMessages(docs)
          const pos = token

          return {
            range: new monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
            contents: usageMessages
          }
        }

        docs = builtIns.variables.filter((doc) => doc.name === token.token)
        if (docs.length === 0) { // built-in variables take precedence
          const variables = DocParser.getVariables(code)
          docs = variables.filter((doc) => doc.name === token.token)
        }
        if (docs.length > 0) {
          const usageMessages = getVariableHoverMessage(docs)
          const pos = token

          return {
            range: new monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
            contents: usageMessages
          }
        }
      } else if (token.tokenType === 'SYMBOL') {
        const normalizedSymbol = `:${normalizeSymbol(token.token)}`
        let docs = [
          ...builtIns.symbols.filter((doc) => doc.name === normalizedSymbol && doc.description != null),
          ...DocParser.getSymbols(code).filter((doc) => doc.name === normalizedSymbol && doc.description != null)
        ]

        if (docs.length > 0) {
          const usageMessages = getSymbolHoverMessage(docs)
          const pos = token

          return {
            range: new monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
            contents: usageMessages
          }
        }
      }
    }
  }
}

/**
 * Generate markdown text for documentation of a function.
 * @param {object[]} functionDocs DocParser output objects for a function
 * @returns Array of markdown objects that document the function
 */
function getFunctionHoverMessages (functionDocs) {
  return [].concat(...functionDocs.map((doc) => {
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

    return {
      value: [
        `\`\`\`postfix\n${doc.name}: ${signature} fun\n\`\`\``,
        doc.description,
        ...doc.params.map((param) =>`*@param* \`${param.name}\`${param.description ? ` – ${param.description}` : ''}`),
        ...doc.returns.map((ret) =>`*@return* ${ret.description ? ret.description : `\`\`\`${ret.type}\`\`\``}`)
      ].join('  \n')
    }
  }))
}

/**
 * Generate markdown text for documentation of a variable.
 * @param {object[]} variableDocs DocParser output objects for a variable
 * @returns Array of markdown objects that document the variable
 */
function getVariableHoverMessage (variableDocs) {
  return [].concat(...variableDocs.map((doc) => {
    return {
      value: [
        `\`\`\`postfix\n${doc.name}\n\`\`\``,
        doc.description
      ].join('  \n')
    }
  }))
}

/**
 * Generate markdown text for documentation of a variable.
 * @param {object[]} symbolDocs DocParser output objects for a symbol
 * @returns Array of markdown objects that document the variable
 */
function getSymbolHoverMessage (symbolDocs) {
  return [].concat(...symbolDocs.map((doc) => {
    return {
      value: [
        `\`\`\`postfix\n${doc.name}\n\`\`\``,
        doc.description
      ].join('  \n')
    }
  }))
}
