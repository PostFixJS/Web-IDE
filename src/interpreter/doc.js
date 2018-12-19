import builtIns from 'postfixjs/doc/operators'
import webideBuiltIns from './operators'

export const functions = [ ...builtIns.functions, ...webideBuiltIns.functions ]
export const variables = []
export const symbols = []

export function registerFunctions (...functionSignatures) {
  functions.push(...functionSignatures)
}

export function registerVariables (...variableDeclarations) {
  functions.push(...variableDeclarations)
}

export function registerSymbols (...symbolDeclarations) {
  symbols.push(...symbolDeclarations)
}
