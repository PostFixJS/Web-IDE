import * as types from 'postfixjs/types'
import { popOperands, popOperand } from 'postfixjs/typeCheck'
import { registerFunctions } from './doc'

export function registerBuiltIns (interpreter) {
  registerFunctions({
    name: 'load-value',
    description: 'Load a string that was previously stored in the browser storage using store-value.',
    params: [{
      name: 'key',
      description: 'Key of the value to load',
      type: ':Str'
    }],
    returns: [{
      description: 'Value loaded from the storage or nil if not found',
      type: ':Str'
    }]
  }, {
    name: 'store-value',
    description: 'Store a string in the browser storage.',
    params: [{
      name: 'key',
      description: 'Storage key, used to laod the value later',
      type: ':Str'
    }, {
      name: 'value',
      description: 'Value to store',
      type: ':Str'
    }],
    returns: []
  })

  interpreter.registerBuiltIn({
    name: 'store-value',
    execute (interpreter, token) {
      const [ key, value ] = popOperands(interpreter, [
        { type: 'Str', name: 'key' },
        { type: 'Str', name: 'value' }
      ], token)
      localStorage.setItem(`storage.${key.value}`, value.value)
    }
  })

  interpreter.registerBuiltIn({
    name: 'load-value',
    execute (interpreter, token) {
      const key = popOperand(interpreter, { type: 'Str', name: 'key' }, token)
      const value = localStorage.getItem(`storage.${key.value}`)
      if (value != null) {
        interpreter._stack.push(new types.Str(value))
      } else {
        interpreter._stack.push(types.Nil.nil)
      }
    }
  })
}
