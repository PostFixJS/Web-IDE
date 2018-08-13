import * as types from 'postfixjs/types'
import * as actions from '../actions'
import store from '../store'

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
  interpreter.registerBuiltIn({
    name: 'println',
    execute: (interpreter) => {
      print(interpreter._stack.pop().value + '\n')
    }
  })

  interpreter.registerBuiltIn({
    name: 'print',
    execute: (interpreter) => {
      print(interpreter._stack.pop().value)
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
}
