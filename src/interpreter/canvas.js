import { keyGet } from 'postfixjs/operators/impl/array'
import { popOperands } from 'postfixjs/typeCheck'
import createCancellationToken from 'postfixjs/util/cancellationToken'
import * as types from 'postfixjs/types'

export function registerBuiltIns (interpreter) {
  interpreter.registerBuiltIn({
    name: 'show',
    * execute (interpreter, token) {
    const [title, width, height, initialState, callbacks] = popOperands(interpreter, [
      { name: 'title', type: 'Str' },
      { name: 'width', type: 'Int' },
      { name: 'height', type: 'Int' },
      { name: 'initialState' },
      { name: 'callbacks', type: 'Arr' }
    ], token)
    
    const top = (window.outerHeight - height.value) / 2 + window.screenY
    const left = (window.outerWidth - width.value) / 2 + window.screenX
    
    const { cancel, token: cancelToken } = createCancellationToken()
    const win = window.open('about:blank', '_blank', `top=${top},left=${left},width=${width.value},height=${height.value}`)
    win.document.title = title.value
    win.addEventListener('unload', cancel)
    
    let state = initialState
    
    // TODO queue interpreter calls to prevent race conditions due to async execution
    const onDraw = keyGet(callbacks, new types.Sym('on-draw'), null)
    if (onDraw) {
      // global requestAnimationFrame
        const redraw = () => requestAnimationFrame(() => {
          if (cancelToken.cancelled) return
          interpreter._stack.push(state)
          Array.from(onDraw.execute(interpreter)) // TODO prevent infinite loops
          state = interpreter._stack.pop()
          win.state = state
          if (!cancelToken.cancelled) redraw()
        })
        setImmediate(redraw)
      }

      // const onKeyPress = keyGet(callbacks, new types.Sym('on-key-press'), null)
      // if (onKeyPress) {
      //   win.onkeypress = (e) => {
      //     interpreter._stack.push(new types.Str(e.key))
      //     Array.from(onKeyPress.execute(interpreter)) // TODO prevent infinite loops
      //   }
      // }

      yield {
        cancel,
        promise: new Promise((resolve) => {
          win.addEventListener('unload', () => resolve())
          cancelToken.onCancel(() => win.close())
        })
      }
    }
  })
}
