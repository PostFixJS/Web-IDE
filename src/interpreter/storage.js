import * as types from 'postfixjs/types'
import { popOperands, popOperand } from 'postfixjs/typeCheck'

/**
 * Add the storage functions to the interpreter.
 * @param {Interpreter} interpreter PostFix interpreter
 */
export function registerBuiltIns (interpreter) {
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
