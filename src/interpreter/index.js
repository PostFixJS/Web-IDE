import * as actions from '../actions'
import store from '../store'

function print (str) {
  store.dispatch(actions.addOutput(str))
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
}
