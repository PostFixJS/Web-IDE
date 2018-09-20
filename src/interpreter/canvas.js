import { keyGet } from 'postfixjs/operators/impl/array'
import { popOperands } from 'postfixjs/typeCheck'
import * as types from 'postfixjs/types'

export function registerBuiltIns (interpreter) {
  interpreter.registerBuiltIn({
    name: 'show',
    execute (interpreter, token) {
      const [title, width, height, initialState, callbacks] = popOperands(interpreter, [
        { name: 'title', type: 'Str' },
        { name: 'width', type: 'Int' },
        { name: 'height', type: 'Int' },
        { name: 'initialState' },
        { name: 'callbacks', type: 'Arr' }
      ], token)

      const top = (window.outerHeight - height.value) / 2 + window.screenY
      const left = (window.outerWidth - width.value) / 2 + window.screenX

      const win = window.open('/index.html', '_blank', `top=${top},left=${left},width=${width.value},height=${height.value}`)
      win.document.title = title.value

      let state = initialState

      // TODO queue interpreter calls to prevent race conditions due to async execution
      let stopDraw = false
      const onDraw = keyGet(callbacks, new types.Sym('on-draw'), null)
      if (onDraw) {
        // global requestAnimationFrame
        const redraw = () => requestAnimationFrame(() => {
          interpreter._stack.push(state)
          Array.from(onDraw.execute(interpreter)) // TODO prevent infinite loops
          state = interpreter._stack.pop()
          win.state = state
          if (!stopDraw) redraw()
        })
        setImmediate(redraw)
      }

      const onKeyPress = keyGet(callbacks, new types.Sym('on-key-press'), null)
      if (onKeyPress) {
        win.onkeypress = (e) => {
          interpreter._stack.push(new types.Str(e.key))
          Array.from(onKeyPress.execute(interpreter)) // TODO prevent infinite loops
        }
      }

      win.addEventListener('unload', () => {
        stopDraw = true
      })
    }
  })
}
