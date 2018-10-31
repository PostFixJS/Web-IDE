import { getTokenAt } from '../postfixUtil'
import DocParser from 'postfixjs/DocParser'
import { normalizeSymbol } from 'postfixjs/tokenUtils'
import * as monaco from 'monaco-editor'
import * as builtIns from '../../../interpreter/doc'
import { getDatadefFunctions } from './datadef'
import { positionToMonaco, rangeToMonaco } from './util'

export default {
  provideHover: (model, position) => {
    const code = model.getValue()
    const token = getTokenAt(code, position.lineNumber - 1, position.column - 1)
    if (token == null) return

    const usageMessages = []

    if (token.tokenType === 'REFERENCE') {
      const functions = DocParser.getFunctions(code, { withRanges: true })

      let builtInFunctions = builtIns.functions.filter((doc) => doc.name === token.token)
      if (builtInFunctions.length === 0) { // built-in functions take precedence
        usageMessages.push(...getFunctionHoverMessages(functions.filter((doc) => doc.name === token.token)))
      } else {
        usageMessages.push(...getFunctionHoverMessages(builtInFunctions))
      }


      const functionsAtPosition = functions.filter(({ source: { body } }) => {
        const bodyRange = new monaco.Range.fromPositions(positionToMonaco(body.start), positionToMonaco(body.end))
        return bodyRange.containsPosition(position)
      })
      usageMessages.push(...getVariableHoverMessage(functionsAtPosition
        .map((fun) => fun.params)
        .reduce((allParams, fnParams) => allParams.concat(fnParams), [])
      ))

      const datadefs = DocParser.getDatadefs(code)
      for (const datadef of datadefs) {
        // all generated functions start with the datadef name
        if (token.token.indexOf(datadef.name.substr(1).toLowerCase()) !== 0) {
          continue
        }
        const fun = getDatadefFunctions(datadef).find(({name}) => name === token.token)
        if (fun) {
          usageMessages.push(getFunctionHoverMessages([fun])[0])
          break
        }
      }

      const builtInVariables = builtIns.variables.filter((doc) => doc.name === token.token)
      if (builtInVariables.length === 0) { // built-in variables take precedence
        const variables = DocParser.getVariables(code)
        usageMessages.push(...getVariableHoverMessage(variables.filter((doc) => doc.name === token.token)))
      } else {
        usageMessages.push(...getVariableHoverMessage(builtInVariables))
      }
    } else if (token.tokenType === 'SYMBOL') {
      const normalizedSymbol = `:${normalizeSymbol(token.token)}`
      let docs = [
        ...builtIns.symbols.filter((doc) => doc.name === normalizedSymbol && doc.description != null),
        ...DocParser.getSymbols(code).filter((doc) => doc.name === normalizedSymbol && doc.description != null)
      ]
      usageMessages.push(...getSymbolHoverMessage(docs))
    }

    return {
      range: rangeToMonaco(token),
      contents: usageMessages
    }
  }
}

/**
 * Generate markdown text for documentation of a function.
 * @param {object[]} functionDocs DocParser output objects for a function
 * @returns Array of markdown objects that document the function
 */
function getFunctionHoverMessages (functionDocs) {
  return functionDocs.map((doc) => {
    let signature
    const params = doc.params
      .map(({ name, type }) => `${name}${type ? ` ${type}` : ''}`)
      .join(', ')
    const returns = doc.returns.map((r) => r.type).join(', ')
    if (returns.length > 0) {
      signature = `( ${params.length > 0 ? `${params} ` : ''}-> ${returns} ) fun`
    } else if (params.length > 0) {
      signature = `( ${params} ) fun`
    } else {
      // no returns, no params
      if (doc.source && doc.source.params == null) {
        // not even a param list
        signature = 'fun'
      } else {
        signature = '() fun'
      }
    }

    return {
      value: [
        `\`\`\`postfix\n${doc.name}: ${signature}\n\`\`\``,
        doc.description,
        ...doc.params.map((param) =>`*@param* \`${param.name}\`${param.description ? ` – ${param.description}` : ''}`),
        ...doc.returns.map((ret) =>`*@return* ${ret.description ? ret.description : `\`\`\`${ret.type}\`\`\``}`)
      ].join('  \n')
    }
  })
}

/**
 * Generate markdown text for documentation of a variable.
 * @param {object[]} variableDocs DocParser output objects for a variable
 * @returns Array of markdown objects that document the variable
 */
function getVariableHoverMessage (variableDocs) {
  return variableDocs.map((doc) => {
    return {
      value: [
        doc.type ? `\`\`\`postfix\n${doc.name} ${doc.type}\n\`\`\`` : `\`\`\`postfix\n${doc.name}\n\`\`\``,
        doc.description
      ].join('  \n')
    }
  })
}

/**
 * Generate markdown text for documentation of a variable.
 * @param {object[]} symbolDocs DocParser output objects for a symbol
 * @returns Array of markdown objects that document the variable
 */
function getSymbolHoverMessage (symbolDocs) {
  return symbolDocs.map((doc) => {
    return {
      value: [
        `\`\`\`postfix\n${doc.name}\n\`\`\``,
        doc.description
      ].join('  \n')
    }
  })
}
