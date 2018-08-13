import builtIns from 'postfixjs/doc/operators'

export const functions = [ ...builtIns.functions ]
export const variables = [ ...builtIns.variables ]

export function registerFunctions (...functionSignatures) {
  functions.push(...functionSignatures)
}

export function registerVariables (...variableDeclarations) {
  functions.push(...variableDeclarations)
}
