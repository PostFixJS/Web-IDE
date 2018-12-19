import { getTokenAt } from '../postfixUtil'
import DocParser from 'postfixjs/DocParser'
import { normalizeSymbol } from 'postfixjs/tokenUtils'
import * as builtIns from '../../../interpreter/doc'
import { getDatadefFunctions } from './datadef'
import { rangeToMonaco, positionFromMonaco, getFunctionsAtPosition } from './util'
import { getFunctionId } from '../../Documentation/Documentation'

/**
 * A hover provider that provides documentation for known functions, variables and symbols.
 * It supports built-in and user-defined objects.
 */
export default {
  provideHover: (model, position) => {
    const code = model.getValue()
    const token = getTokenAt(code, positionFromMonaco(position))
    if (token == null) return

    const usageMessages = []

    if (token.tokenType === 'REFERENCE') {
      const functions = DocParser.getFunctions(code, { withRanges: true })

      let builtInFunctions = builtIns.functions.filter((doc) => doc.name === token.token)
      if (builtInFunctions.length === 0) { // built-in functions take precedence
        usageMessages.push(...getFunctionHoverMessages(functions.filter((doc) => doc.name === token.token)))
      } else {
        usageMessages.push(...getFunctionHoverMessages(builtInFunctions, true))
      }


      const functionsAtPosition = getFunctionsAtPosition(functions, position)
      usageMessages.push(...getVariableHoverMessage(functionsAtPosition
        .map((fun) => fun.params.filter(({ name }) => name === token.token))
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
 * @param {boolean} showMore Whether to include a link to the docs (only available for built-in functions)
 * @returns Array of markdown objects that document the function
 */
function getFunctionHoverMessages (functionDocs, showMore = false) {
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
        showMore ? `${doc.description} [More…](pfdoc|${getFunctionId(doc)} "More…")` : doc.description,
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
