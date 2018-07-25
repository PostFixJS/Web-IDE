export function registerBuiltIns (interpreter) {
  interpreter.registerBuiltIn({
    name: 'println',
    execute: (interpreter) => {
      console.log(interpreter._stack.pop().value)
    }
  })
}
