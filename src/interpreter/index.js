import * as types from 'postfixjs/types'
import { format } from 'postfixjs/operators/impl/format'
import * as actions from '../actions'
import store from '../store'
import { registerFunctions } from './doc'

function print (str) {
  store.dispatch(actions.addOutput(str))
}

function readLine () {
  const { value, position } = store.getState().input
  const nextNewline = value.indexOf('\n', position)
  let str = ''
  if (nextNewline >= 0) {
    str = value.substring(position, nextNewline)
    store.dispatch(actions.setInputPosition(nextNewline + 1))
  } else if (position < value.length) {
    str = value.substr(position)
    store.dispatch(actions.setInputPosition(value.length))
  }
  return str
}

function readChar () {
  const { value, position } = store.getState().input
  if (position < value.length) {
    store.dispatch(actions.setInputPosition(position + 1))
    return value.charCodeAt(position)
  } else {
    return -1
  }
}

export function registerBuiltIns (interpreter) {
  registerFunctions({
    name: 'print',
    description: 'Print a value.',
    params: [{
      name: 'value',
      description: 'Value to print',
      type: ':Obj'
    }],
    returns: []
  }, {
    name: 'println',
    description: 'Print a value and a line break.',
    params: [{
      name: 'value',
      description: 'Value to print',
      type: ':Obj'
    }],
    returns: []
  }, {
    name: 'printf',
    description: 'Format the given string using the given parameters and print it. This uses a C-style format string, e.g. `%d` is used for integers, `%s` for strings and so on.',
    params: [{
      name: 'format',
      description: 'Format string',
      type: ':Str'
    }, {
      name: 'params',
      description: 'Parameters',
      type: ':Arr'
    }],
    returns: []
  }, {
    name: 'printfln',
    description: 'Format the given string using the given parameters and print it and a line break. This uses a C-style format string, e.g. `%d` is used for integers, `%s` for strings and so on.',
    params: [{
      name: 'format',
      description: 'Format string',
      type: ':Str'
    }, {
      name: 'params',
      description: 'Parameters',
      type: ':Arr'
    }],
    returns: []
  }, {
    name: 'read-char',
    description: 'Read a single character from the input.',
    params: [],
    returns: [{
      type: ':Int',
      description: 'The character code of the character that was read, or -1 if no more characters are left to be read'
    }]
  }, {
    name: 'read-line',
    description: 'Read a line from the input.',
    params: [],
    returns: [{
      type: ':Str',
      description: 'The line that was read from the input'
    }]
  }, {
    name: 'read-flt',
    description: 'Read a line from the input and convert it to :Flt. Throws an error if the input cannot be converted to a float.',
    params: [],
    returns: [{
      type: ':Flt',
      description: 'The float that was read from the input'
    }]
  }, {
    name: 'read-int',
    description: 'Read a line from the input and convert it to :Int. Throws an error if the input cannot be converted to an integer.',
    params: [],
    returns: [{
      type: ':Int',
      description: 'The integer that was read from the input'
    }]
  }, {
    name: 'debugger',
    description: 'Pause the program execution and invoke the debugger. This is equivalent to setting a breakpoint.',
    params: [],
    returns: []
  })

  interpreter.registerBuiltIn({
    name: 'print',
    execute: (interpreter) => {
      print(interpreter._stack.pop().value)
    }
  })
 
  interpreter.registerBuiltIn({
    name: 'println',
    execute: (interpreter) => {
      print(interpreter._stack.pop().value + '\n')
    }
  })

  interpreter.registerBuiltIn({
    name: 'printf',
    execute: (interpreter, token) => {
      const params = interpreter._stack.pop()
      if (!(params instanceof types.Arr)) {
        throw new types.Err(`printf expects an :Arr with parameters as second argument but got ${params.getTypeName()} instead`, token)
      }
      const formatStr = interpreter._stack.popString().value
      print(format(formatStr, params))
    }
  })

  interpreter.registerBuiltIn({
    name: 'printfln',
    execute: (interpreter, token) => {
      const params = interpreter._stack.pop()
      if (!(params instanceof types.Arr)) {
        throw new types.Err(`printfln expects an :Arr with parameters as second argument but got ${params.getTypeName()} instead`, token)
      }
      const formatStr = interpreter._stack.popString().value
      print(format(formatStr, params) + '\n')
    }
  })

  interpreter.registerBuiltIn({
    name: 'read-char',
    execute: (interpreter) => {
      interpreter._stack.push(new types.Int(readChar()))
    }
  })

  interpreter.registerBuiltIn({
    name: 'read-line',
    execute: (interpreter) => {
      interpreter._stack.push(new types.Str(readLine()))
    }
  })

  interpreter.registerBuiltIn({
    name: 'read-flt',
    execute: (interpreter, token) => {
      const input = readLine().trim()
      const flt = parseFloat(input)
      if (isNaN(flt)) {
        throw new types.Err(`Cannot convert value "${input}" to :Flt`, token)
      }
      interpreter._stack.push(new types.Flt(flt))
    }
  })

  interpreter.registerBuiltIn({
    name: 'read-int',
    execute: (interpreter, token) => {
      const input = readLine().trim()
      const int = parseInt(input, 10)
      if (isNaN(int)) {
        throw new types.Err(`Cannot convert value "${input}" to :Int`, token)
      }
      interpreter._stack.push(new types.Int(int))
    }
  })

  interpreter.registerBuiltIn({
    name: 'debugger',
    execute: () => {}
  })
}
