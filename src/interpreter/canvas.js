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
      let rejectAll
      const win = window.open('about:blank', '_blank', `top=${top},left=${left},width=${width.value},height=${height.value}`)
      win.document.title = title.value
      const canvas = win.document.createElement('canvas')
      canvas.width = width.value
      canvas.height = height.value
      win.document.body.style.margin = 0
      win.document.body.appendChild(canvas)
      win.addEventListener('unload', cancel)

      // queue interpreter invocations to prevent race conditions due to async execution
      const enqueue = (() => {
        let queue = Promise.resolve()
        return (fn) => {
          queue = queue.then(fn)
          return queue
        }
      })()
      let cancelQueue = null
      cancelToken.onCancel(() => {
        if (cancelQueue != null) {
          cancelQueue()
        }
      })
      const runInQueue = async (obj) => {
        const { promise, cancel } = interpreter.runObj(obj)
        cancelQueue = cancel
        await promise
        cancelQueue = null
      }
      
      let state = initialState

      const onDraw = keyGet(callbacks, new types.Sym('on-draw'), null)
      const onTick = keyGet(callbacks, new types.Sym('on-tick'), null)
      const redraw = () => {
        if (cancelToken.cancelled) return
        enqueue(async () => {
          // TODO prevent infinite loops, allow debugging (i.e. use a runner)
          try {
            if (onTick) {
              interpreter._stack.push(state)
              await runInQueue(onTick)
              state = interpreter._stack.pop()
            }

            let image = null
            if (onDraw) {
              interpreter._stack.push(state)
              await runInQueue(onDraw)
              if (cancelToken.cancelled) return
              image = interpreter._stack.pop()
            }
            // global requestAnimationFrame
            requestAnimationFrame(() => {
              const ctx = canvas.getContext('2d')
              ctx.clearRect(0, 0, canvas.width, canvas.height)

              switch (image.items[0].name) {
                case 'square': {
                  const size = image.items[1]
                  ctx.beginPath()
                  ctx.rect(0, 0, size.value, size.value)
                  if (image.items.length >= 3) {
                    ctx.fillStyle = image.items[2].value
                    ctx.fill()
                  }
                  if (image.items.length >= 4) {
                    ctx.strokeStyle = image.items[3].value
                    ctx.stroke()
                  }
                  break
                }
                default:
                  break
              }
              if (!cancelToken.cancelled) redraw()
            })
          } catch (e) {
            cancel()
            if (e.message !== 'cancelled') {
              rejectAll(e)
            }
          }
        })
      }
      setImmediate(redraw)

      const onKeyPress = keyGet(callbacks, new types.Sym('on-key-press'), null)
      if (onKeyPress) {
        win.onkeypress = (e) => {
          enqueue(async () => {
            // TODO prevent infinite loops, allow debugging (i.e. use a runner)
            interpreter._stack.push(new types.Str(e.key))
            try {
              await runInQueue(onKeyPress)
            } catch (e) {
              cancel()
              if (e.message !== 'cancelled') {
                rejectAll(e)
              }
            }
          })
        }
      }

      yield {
        cancel,
        promise: new Promise((resolve, reject) => {
          rejectAll = reject
          win.addEventListener('unload', () => resolve())
          cancelToken.onCancel(() => win.close())
        })
      }
    }
  })
}
