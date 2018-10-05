import { keyGet } from 'postfixjs/operators/impl/array'
import { popOperands, popOperand } from 'postfixjs/typeCheck'
import createCancellationToken from 'postfixjs/util/cancellationToken'
import * as types from 'postfixjs/types'
import { registerFunctions } from './doc'
import Image from './canvas/Image'

export function registerBuiltIns (interpreter) {
  interpreter.registerBuiltIn({
    name: 'show',
    * execute (interpreter, token) {
      const [title, width, height, initialState, callbacks] = popOperands(interpreter, [
        { name: 'title', type: 'Str' },
        { name: 'width', type: 'Num' },
        { name: 'height', type: 'Num' },
        { name: 'initialState' },
        { name: 'callbacks', type: 'Arr' }
      ], token)
      const windowWidth = Math.floor(width.value)
      const windowHeight = Math.floor(height.value)
      
      const top = (window.outerHeight - windowHeight) / 2 + window.screenY
      const left = (window.outerWidth - windowWidth) / 2 + window.screenX
      
      const { cancel, token: cancelToken } = createCancellationToken()
      let rejectAll
      let windowClosed = false
      const win = window.open('', '_blank', `top=${top},left=${left},width=${windowWidth},height=${windowHeight}`)
      win.document.title = title.value
      const canvas = win.document.createElement('canvas')
      canvas.style.margin = '0 auto'
      canvas.style.display = 'block'
      canvas.width = windowWidth
      canvas.height = windowHeight
      win.document.body.style.margin = 0
      win.document.body.appendChild(canvas)
      win.addEventListener('unload', () => { windowClosed = true })
      win.addEventListener('resize', () => {
        if (windowWidth > windowHeight) {
          // landscape canvas
          let newWidth = win.innerWidth
          let newHeight = windowHeight * newWidth / windowWidth
          if (newHeight > win.innerHeight) {
            newHeight = win.innerHeight
            newWidth = windowWidth * newHeight / windowHeight
          }
          canvas.width = newWidth
          canvas.height = newHeight
        } else {
          // portrait or square
          let newHeight = win.innerHeight
          let newWidth = windowWidth * newHeight / windowHeight
          if (newWidth > win.innerWidth) {
            newWidth = win.innerWidth
            newHeight = windowHeight * newWidth / windowWidth
          }
          canvas.width = newWidth
          canvas.height = newHeight
        }
      })

      // queue interpreter invocations to prevent race conditions due to async execution
      const enqueue = (() => {
        let cancelQueue = null
        cancelToken.onCancel(() => {
          if (cancelQueue != null) {
            cancelQueue()
          }
        })
        const runInQueue = async (obj) => {
          if (cancelToken.cancelled || windowClosed) return
          const { promise, cancel } = interpreter.__runner.runInner(obj)
          cancelQueue = cancel
          await promise
          cancelQueue = null
        }

        let queue = Promise.resolve()
        return (fn) => {
          queue = queue.then(async () => {
            if (cancelToken.cancelled) return
            try {
              await fn(runInQueue)
            } catch (e) {
              if (e.message !== 'Cancelled') {
                rejectAll(e)
              }
            }
          })
          return queue
        }
      })()
      
      let state = initialState

      const onDraw = keyGet(callbacks, new types.Sym('on-draw'), null)
      const onTick = keyGet(callbacks, new types.Sym('on-tick'), null)
      if (onTick && !(onTick instanceof types.Lam)) {
        throw new types.Err(`Expected on-tick callback to be a lambda function (:Lam) but got ${onTick.getTypeName()} instead`, onTick.origin || callbacks.origin)
      }
      const stopWhen = keyGet(callbacks, new types.Sym('stop-when'), null)
      if (stopWhen && !(stopWhen instanceof types.Lam)) {
        throw new types.Err(`Expected stop-when callback to be a lambda function (:Lam) but got ${onTick.getTypeName()} instead`, stopWhen.origin || callbacks.origin)
      }
      
      let prevTick = Date.now()
      const redraw = () => {
        if (cancelToken.cancelled) return
        enqueue(async (runObj) => {
          if (onTick) {
            interpreter._stack.push(state)
            if (onTick.params.params.length === 2) {
              const now = Date.now()
              interpreter._stack.push(new types.Int(now - prevTick))
              prevTick = now
            }
            await runObj(onTick)
            state = interpreter._stack.pop()
          }

          let image = null
          if (onDraw) {
            interpreter._stack.push(state)
            await runObj(onDraw)
            image = Image.from(interpreter._stack.pop())
          }
          // global requestAnimationFrame
          requestAnimationFrame(() => {
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.save()
            ctx.scale(canvas.width / width, canvas.height / height)
            image.draw(ctx)
            ctx.restore()
            if (!cancelToken.cancelled) redraw()
          })

          if (stopWhen) {
            interpreter._stack.push(state)
            await runObj(stopWhen)
            const stop = interpreter._stack.pop()
            if (!(stop instanceof types.Bool)) {
              cancel()
              throw new types.Err(`Expected on-stop to push a :Bool on the stack but got ${stop.getTypeName()} instead`, callbacks.origin)
            }
            if (stop.value) {
              cancel()
            }
          }
        })
      }
      setImmediate(redraw)

      const onKeyPress = keyGet(callbacks, new types.Sym('on-key-press'), null)
      if (onKeyPress) {
        if (!(onKeyPress instanceof types.Lam)) {
          throw new types.Err(`Expected on-key-press callback to be a lambda function (:Lam) but got ${onTick.getTypeName()} instead`, onKeyPress.origin || callbacks.origin)
        }
        win.addEventListener('keypress', (e) => {
          enqueue(async (runObj) => {
            interpreter._stack.push(state)
            interpreter._stack.push(new types.Str(e.key))
            await runObj(onKeyPress)
            state = interpreter._stack.pop()
          })
        })
      }

      const onKeyDown = keyGet(callbacks, new types.Sym('on-key-down'), null)
      if (onKeyDown instanceof types.Lam) {
        if (!(onKeyDown instanceof types.Lam)) {
          throw new types.Err(`Expected on-key-down callback to be a lambda function (:Lam) but got ${onTick.getTypeName()} instead`, onKeyDown.origin || callbacks.origin)
        }
        win.addEventListener('keydown', (e) => {
          enqueue(async (runObj) => {
            interpreter._stack.push(state)
            interpreter._stack.push(new types.Str(e.key))
            await runObj(onKeyDown)
            state = interpreter._stack.pop()
          })
        })
      }

      const onKeyUp = keyGet(callbacks, new types.Sym('on-key-up'), null)
      if (onKeyUp instanceof types.Lam) {
        if (!(onKeyUp instanceof types.Lam)) {
          throw new types.Err(`Expected on-key-up callback to be a lambda function (:Lam) but got ${onTick.getTypeName()} instead`, onKeyUp.origin || callbacks.origin)
        }
        win.addEventListener('keyup', (e) => {
          enqueue(async (runObj) => {
            interpreter._stack.push(state)
            interpreter._stack.push(new types.Str(e.key))
            await runObj(onKeyUp)
            state = interpreter._stack.pop()
          })
        })
      }

      // TODO mouse move, mouse down, mouse up

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

  interpreter.registerBuiltIn({
    name: 'show-image',
    * execute (interpreter, token) {
      const image = Image.from(popOperand(interpreter, { type: 'Arr' }, token))
      const windowWidth = Math.ceil(image.width)
      const windowHeight = Math.ceil(image.height)
      const { cancel, token: cancelToken } = createCancellationToken()
      
      const top = (window.outerHeight - windowHeight) / 2 + window.screenY
      const left = (window.outerWidth - windowWidth) / 2 + window.screenX
      const win = window.open('', '_blank', `top=${top},left=${left},width=${windowWidth},height=${windowHeight}`)
      win.document.title = 'Image viewer'
      const canvas = win.document.createElement('canvas')
      canvas.style.margin = '0 auto'
      canvas.style.display = 'block'
      canvas.width = image.width
      canvas.height = image.height
      win.document.body.style.margin = 0
      win.document.body.appendChild(canvas)
      image.draw(canvas.getContext('2d'))

      // TODO resize canvas and repaint when the window is resized

      yield {
        cancel,
        promise: new Promise((resolve, reject) => {
          win.addEventListener('unload', () => resolve())
          cancelToken.onCancel(() => win.close())
        })
      }
    }
  })

  interpreter.registerBuiltIn({
    name: 'image-width',
    execute (interpreter, token) {
      const image = Image.from(popOperand(interpreter, { type: 'Arr' }, token))
      interpreter._stack.push(new types.Flt(image.width))
    }
  })

  interpreter.registerBuiltIn({
    name: 'image-height',
    execute (interpreter, token) {
      const image = Image.from(popOperand(interpreter, { type: 'Arr' }, token))
      interpreter._stack.push(new types.Flt(image.height))
    }
  })

  registerFunctions({
    name: 'show',
    description: 'Open a window with a canvas to draw on.',
    params: [{
      name: 'title',
      description: 'Window title',
      type: ':Str'
    }, {
      name: 'width',
      description: 'Window width',
      type: ':Num'
    }, {
      name: 'height',
      description: 'Window height',
      type: ':Num'
    }, {
      name: 'initialState',
      description: 'Initial state',
      type: ':Obj'
    }, {
      name: 'callbacks',
      description: 'Event callbacks',
      type: ':Arr'
    }],
    returns: []
  }, {
    name: 'show-image',
    description: 'Display an image in a new window.',
    params: [{
      name: 'image',
      description: 'Image to show',
      type: ':Arr'
    }],
    returns: []
  }, {
    name: 'image-width',
    description: 'Get the width of an image.',
    params: [{
      name: 'image',
      description: 'Image definition',
      type: ':Arr'
    }],
    returns: [{
      type: ':Flt',
      description: 'Image width'
    }]
  }, {
    name: 'image-height',
    description: 'Get the height of an image.',
    params: [{
      name: 'image',
      description: 'Image definition',
      type: ':Arr'
    }],
    returns: [{
      type: ':Flt',
      description: 'Image height'
    }]
  })
}
