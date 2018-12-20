import builtIns from 'postfixjs/doc/operators'
import webideBuiltIns from './operators'

export const functions = [ ...builtIns.functions, ...webideBuiltIns.functions ]
export const variables = []
export const symbols = []

/**
 * Add function signatures to the documentation provider.
 * @param  {...object} functionSignatures Function signatures as returned by the DocParser
 */
export function registerFunctions (...functionSignatures) {
  functions.push(...functionSignatures)
}

/**
 * Add variables to the documentation provider.
 * @param  {...object} variableDeclarations Variables as returned by the DocParser
 */
export function registerVariables (...variableDeclarations) {
  functions.push(...variableDeclarations)
}

/**
 * Add symbols to the documentation provider.
 * @param  {...object} symbolDeclarations Symbols as returned by the DocParser
 */
export function registerSymbols (...symbolDeclarations) {
  symbols.push(...symbolDeclarations)
}
