import * as types from 'postfixjs/types'
import { format } from 'postfixjs/operators/impl/format'
import { popOperands, popOperand } from 'postfixjs/typeCheck'
import createCancellationToken from 'postfixjs/util/cancellationToken'
import * as actions from '../actions'
import store from '../store'
import { registerSymbols } from './doc'
import * as canvas from './canvas'
import * as storage from './storage'
import * as http from './http'

/**
 * Add a string to the output.
 * @param {string} str String to print
 */
function print (str) {
  store.dispatch(actions.addOutput(str))
}

/**
 * Wait for the user to provide input.
 * @param {object} cancelToken Cancellation token
 * @returns {Promise} A promise that resolves when new input is provided by the user
 */
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

/**
 * Read one line of input. If no input is available, wait for more input.
 * @param {object} cancelToken Cancellation token
 * @returns {string} One line of input
 */
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

/**
 * Read one character from the input. If no input is available, wait for more input.
 * @param {object} cancelToken Cancellation token
 * @returns {string} One character from the input
 */
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

/**
 * Add the input, output and debugger functions to the interpreter.
 * @param {Interpreter} interpreter PostFix interpreter
 */
export function registerBuiltIns (interpreter) {
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
