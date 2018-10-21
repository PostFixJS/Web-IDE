import * as types from 'postfixjs/types'
import { format } from 'postfixjs/operators/impl/format'
import { popOperands, popOperand } from 'postfixjs/typeCheck'
import createCancellationToken from 'postfixjs/util/cancellationToken'
import * as actions from '../actions'
import store from '../store'
import { registerFunctions, registerSymbols } from './doc'
import * as canvas from './canvas'
import * as storage from './storage'
import * as http from './http'

function print (str) {
  store.dispatch(actions.addOutput(str))
}

function waitForInput (cancelToken) {
  return new Promise((resolve) => {
    store.dispatch(actions.waitForInput(true))
    let oldInput = store.getState().input.value
    const oldLineCount = oldInput.split('\n').length
    const removeListener = store.subscribe(() => {
      const input = store.getState().input.value
      if (input !== oldInput) {
        oldInput = input
        if (input.split('\n').length > oldLineCount) {
          // a new line was added
          store.dispatch(actions.waitForInput(false))
          removeListener()
          resolve()
        }
      }
    })
    cancelToken.onCancel(() => {
      store.dispatch(actions.waitForInput(false))
      removeListener()
      resolve()
    })
  })
}

async function readLine (cancelToken) {
  const { value, position } = store.getState().input
  const nextNewline = value.indexOf('\n', position)
  let str = ''
  if (nextNewline >= 0) {
    str = value.substring(position, nextNewline)
    store.dispatch(actions.setInputPosition(nextNewline + 1))
  } else if (position < value.length) {
    str = value.substr(position)
    store.dispatch(actions.setInputPosition(value.length))
  } else {
    await waitForInput(cancelToken)
    if (cancelToken.cancelled) return
    return readLine(cancelToken)
  }
  return str
}

async function readChar (cancelToken) {
  const { value, position } = store.getState().input
  if (position < value.length) {
    store.dispatch(actions.setInputPosition(position + 1))
    return value.charCodeAt(position)
  } else {
    await waitForInput(cancelToken)
    if (cancelToken.cancelled) return
    return readChar(cancelToken)
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
      description: 'The character code of the character that was read'
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
    execute (interpreter, token) {
      const value = popOperand(interpreter, { type: ['Num', 'Bool', 'Str'] }, token)
      print(value.value)
    }
  })

  interpreter.registerBuiltIn({
    name: 'println',
    execute (interpreter, token) {
      const value = popOperand(interpreter, { type: ['Num', 'Bool', 'Str'] }, token)
      print(value.value + '\n')
    }
  })

  interpreter.registerBuiltIn({
    name: 'printf',
    execute (interpreter, token) {
      const [ formatStr, params ] = popOperands(interpreter, [
        { name: 'formatStr', type: 'Str' },
        { name: 'params', type: 'Arr' }
      ], token)
      print(format(formatStr.value, params))
    }
  })

  interpreter.registerBuiltIn({
    name: 'printfln',
    execute (interpreter, token) {
      const [ formatStr, params ] = popOperands(interpreter, [
        { name: 'formatStr', type: 'Str' },
        { name: 'params', type: 'Arr' }
      ], token)
      print(format(formatStr.value, params) + '\n')
    }
  })

  interpreter.registerBuiltIn({
    name: 'read-char',
    * execute (interpreter) {
      const { cancel, token: cancelToken } = createCancellationToken()
      const char = yield {
        promise: readChar(cancelToken),
        cancel
      }
      if (cancelToken.cancelled) return
      interpreter._stack.push(new types.Int(char))
    }
  })

  interpreter.registerBuiltIn({
    name: 'read-line',
    * execute (interpreter) {
      const { cancel, token: cancelToken } = createCancellationToken()
      const content = yield {
        promise: readLine(cancelToken),
        cancel
      }
      if (cancelToken.cancelled) return
      interpreter._stack.push(new types.Str(content))
    }
  })

  interpreter.registerBuiltIn({
    name: 'read-flt',
    * execute (interpreter, token) {
      const { cancel, token: cancelToken } = createCancellationToken()
      const input = (yield {
        promise: readLine(cancelToken),
        cancel
      }).trim()
      if (cancelToken.cancelled) return

      if (input.length === 0) {
        throw new types.Err('No more input available', token)
      }
      const flt = parseFloat(input)
      if (isNaN(flt)) {
        throw new types.Err(`Cannot convert value "${input}" to :Flt`, token)
      }
      interpreter._stack.push(new types.Flt(flt))
    }
  })

  interpreter.registerBuiltIn({
    name: 'read-int',
    * execute (interpreter, token) {
      const { cancel, token: cancelToken } = createCancellationToken()
      const input = (yield {
        promise: readLine(cancelToken),
        cancel
      }).trim()
      if (cancelToken.cancelled) return

      if (input.length === 0) {
        throw new types.Err('No more input available', token)
      }
      const int = parseInt(input, 10)
      if (isNaN(int)) {
        throw new types.Err(`Cannot convert value "${input}" to :Int`, token)
      }
      interpreter._stack.push(new types.Int(int))
    }
  })

  interpreter.registerBuiltIn({
    name: 'debugger',
    execute () {
      // handled by the runner
    }
  })

  canvas.registerBuiltIns(interpreter)
  storage.registerBuiltIns(interpreter)
  http.registerBuiltIns(interpreter)

  registerSymbols({
    name: ':Arr',
    description: 'The type of an array. The arrays indices start at zero.'
  }, {
    name: ':Bool',
    description: 'Type for boolean values, i.e. true and false.'
  }, {
    name: ':Err',
    description: 'Error type which stops the program immediately when it is executed.'
  }, {
    name: ':ExeArr',
    description: 'The type of an executable array.'
  }, {
    name: ':Flt',
    description: 'Type for floating point numbers.'
  }, {
    name: ':Int',
    description: 'Type for integer numbers.',
  }, {
    name: ':Lam',
    description: 'The type of a lambda function, i.e. an executable array with a dictionary.'
  }, {
    name: ':Marker',
    description: 'An internal type that is used to keep track of array and executable array brackets.'
  }, {
    name: ':Nil',
    description: 'The nil type which is used to express the absense of a value.'
  }, {
    name: ':Num',
    description: 'Union type for any number (float or integer).'
  }, {
    name: ':Obj',
    description: 'Base type of all PostFix types. Everything (except nil) is an object in PostFix.'
  }, {
    name: ':Op',
    description: 'An internal type used for all operators that are implemented in JavaScript.'
  }, {
    name: ':Params',
    description: 'The type of parameter lists.'
  }, {
    name: ':Ref',
    description: 'An internal type used for references to variables from a dictionary.'
  }, {
    name: ':Str',
    description: 'Type for strings. The character indices start at zero.'
  }, {
    name: ':Sym',
    description: 'A type for symbols, which can be used to name objects.'
  })
}
