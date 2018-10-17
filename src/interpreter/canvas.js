import { keyGet } from 'postfixjs/operators/impl/array'
import { popOperands, popOperand } from 'postfixjs/typeCheck'
import createCancellationToken from 'postfixjs/util/cancellationToken'
import * as types from 'postfixjs/types'
import { registerFunctions, registerSymbols } from './doc'
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
      if (onDraw && !(onDraw instanceof types.Lam)) {
        throw new types.Err(`Expected on-draw callback to be a lambda function (:Lam) but got ${onDraw.getTypeName()} instead`, onDraw.origin || callbacks.origin)
      }
      const stopWhen = keyGet(callbacks, new types.Sym('stop-when'), null)
      if (stopWhen && !(stopWhen instanceof types.Lam)) {
        throw new types.Err(`Expected stop-when callback to be a lambda function (:Lam) but got ${stopWhen.getTypeName()} instead`, stopWhen.origin || callbacks.origin)
      }
      
      let prevTick = Date.now()
      const redraw = () => {
        if (cancelToken.cancelled) return
        enqueue(async (runObj) => {
          if (onTick) {
            interpreter._stack.push(state)
            if (onTick.params && onTick.params.params.length === 2) {
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
            image = await Image.from(interpreter._stack.pop())
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
              throw new types.Err(`Expected on-stop to push a :Bool on the stack but got ${stop.getTypeName()} instead`, stop.origin || callbacks.origin)
            }
            if (stop.value) {
              cancel()
            }
          }
        })
      }
      setImmediate(redraw)

      const onKeyDown = keyGet(callbacks, new types.Sym('on-key-press'), null)
      if (onKeyDown instanceof types.Lam) {
        if (!(onKeyDown instanceof types.Lam)) {
          throw new types.Err(`Expected on-key-press callback to be a lambda function (:Lam) but got ${onKeyDown.getTypeName()} instead`, onKeyDown.origin || callbacks.origin)
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

      const onKeyUp = keyGet(callbacks, new types.Sym('on-key-release'), null)
      if (onKeyUp instanceof types.Lam) {
        if (!(onKeyUp instanceof types.Lam)) {
          throw new types.Err(`Expected on-key-release callback to be a lambda function (:Lam) but got ${onKeyUp.getTypeName()} instead`, onKeyUp.origin || callbacks.origin)
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

      const normalizeMouse = (e) => ({
        x: (e.clientX - canvas.offsetLeft) / canvas.clientWidth * windowWidth,
        y: (e.clientY - canvas.offsetTop) / canvas.clientHeight * windowHeight
      })

      const onMouseMove = keyGet(callbacks, new types.Sym('on-mouse-move'), null)
      if (onMouseMove) {
        if (!(onMouseMove instanceof types.Lam)) {
          throw new types.Err(`Expected on-mouse-move callback to be a lambda function (:Lam) but got ${onMouseMove.getTypeName()} instead`, onMouseMove.origin || callbacks.origin)
        }
        canvas.addEventListener('mousemove', (e) => {
          if (e.buttons === 0) { // 0 = no mouse button pressed
            const {x, y} = normalizeMouse(e)
            enqueue(async (runObj) => {
              interpreter._stack.push(state)
              interpreter._stack.push(new types.Flt(x))
              interpreter._stack.push(new types.Flt(y))
              await runObj(onMouseMove)
              state = interpreter._stack.pop()
            })
          }
        })
      }

      const onMouseDrag = keyGet(callbacks, new types.Sym('on-mouse-drag'), null)
      if (onMouseDrag) {
        if (!(onMouseDrag instanceof types.Lam)) {
          throw new types.Err(`Expected on-mouse-drag callback to be a lambda function (:Lam) but got ${onMouseDrag.getTypeName()} instead`, onMouseDrag.origin || callbacks.origin)
        }
        canvas.addEventListener('mousemove', (e) => {
          if (e.buttons === 1) { // 1 = left mouse button pressed
            const {x, y} = normalizeMouse(e)
            enqueue(async (runObj) => {
              interpreter._stack.push(state)
              interpreter._stack.push(new types.Flt(x))
              interpreter._stack.push(new types.Flt(y))
              await runObj(onMouseDrag)
              state = interpreter._stack.pop()
            })
          }
        })
      }

      const onMouseDown = keyGet(callbacks, new types.Sym('on-mouse-press'), null)
      if (onMouseDown) {
        if (!(onMouseDown instanceof types.Lam)) {
          throw new types.Err(`Expected on-mouse-press callback to be a lambda function (:Lam) but got ${onMouseDown.getTypeName()} instead`, onMouseDown.origin || callbacks.origin)
        }
        canvas.addEventListener('mousedown', (e) => {
          const {x, y} = normalizeMouse(e)
          enqueue(async (runObj) => {
            interpreter._stack.push(state)
            interpreter._stack.push(new types.Flt(x))
            interpreter._stack.push(new types.Flt(y))
            await runObj(onMouseDown)
            state = interpreter._stack.pop()
          })
        })
      }

      const onMouseUp = keyGet(callbacks, new types.Sym('on-mouse-release'), null)
      if (onMouseUp) {
        if (!(onMouseUp instanceof types.Lam)) {
          throw new types.Err(`Expected on-mouse-release callback to be a lambda function (:Lam) but got ${onMouseUp.getTypeName()} instead`, onMouseUp.origin || callbacks.origin)
        }
        canvas.addEventListener('mouseup', (e) => {
          const {x, y} = normalizeMouse(e)
          enqueue(async (runObj) => {
            interpreter._stack.push(state)
            interpreter._stack.push(new types.Flt(x))
            interpreter._stack.push(new types.Flt(y))
            await runObj(onMouseUp)
            state = interpreter._stack.pop()
          })
        })
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

  interpreter.registerBuiltIn({
    name: 'read-image-url',
    * execute (interpreter, token) {
      const url = popOperand(interpreter, { type: 'Str', name: 'url' }, token)
      const { cancel, token: cancelToken } = createCancellationToken()
      const img = new window.Image()
      img.crossOrigin = 'anonymous'

      yield {
        cancel,
        promise: new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            canvas.getContext('2d').drawImage(img, 0, 0)
            interpreter._stack.push(new types.Str(canvas.toDataURL('image/png')))
            canvas.remove()
            resolve()
          }
          img.onerror = () => {
            reject(new types.Err('Could not download the image', token))
          }
          cancelToken.onCancel(() => {
            img.onload = null
            img.onerror = null
          })
          img.src = url.value
        })
      }
    }
  })

  interpreter.registerBuiltIn({
    name: 'show-image',
    * execute (interpreter, token) {
      const { cancel, token: cancelToken } = createCancellationToken()

      let image
      yield {
        promise: Image.from(popOperand(interpreter, { type: 'Arr' }, token))
          .then((img) => { image = img }),
        cancel
      }
      if (cancelToken.cancelled) {
        // cancelled while loading the image
        return
      }

      const windowWidth = Math.ceil(image.width)
      const windowHeight = Math.ceil(image.height)

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
    * execute (interpreter, token) {
      const { cancel, token: cancelToken } = createCancellationToken()

      let image
      yield {
        promise: Image.from(popOperand(interpreter, { type: 'Arr' }, token))
          .then((img) => { image = img }),
        cancel
      }
      if (cancelToken.cancelled) {
        // cancelled while loading the image
        return
      }
      
      interpreter._stack.push(new types.Flt(image.width))
    }
  })

  interpreter.registerBuiltIn({
    name: 'image-height',
    * execute (interpreter, token) {
      const { cancel, token: cancelToken } = createCancellationToken()

      let image
      yield {
        promise: Image.from(popOperand(interpreter, { type: 'Arr' }, token))
          .then((img) => { image = img }),
        cancel
      }
      if (cancelToken.cancelled) {
        // cancelled while loading the image
        return
      }
      
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
    name: 'read-image-url',
    description: 'Download an image and serialize it into a data url that can be used with `:bitmap`.',
    params: [{
      name: 'url',
      description: 'Url of an image',
      type: ':Str'
    }],
    returns: [{
      type: ':Str',
      description: 'Image as data url'
    }]
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

  registerSymbols({
    name: ':on-draw',
    description: 'Key for the drawing callback of show.'
  }, {
    name: ':on-tick',
    description: 'Key for the tick callback of show.'
  }, {
    name: ':stop-when',
    description: 'Key for the stop-when callback of show.'
  }, {
    name: ':on-key-press',
    description: 'Key for the key press callback of show.'
  }, {
    name: ':on-key-up',
    description: 'Key for the key up callback of show.'
  }, {
    name: ':on-key-down',
    description: 'Key for the key down callback of show.'
  }, {
    name: ':on-mouse-move',
    description: 'Key for the mouse move callback of show.'
  }, {
    name: ':on-mouse-drag',
    description: 'Key for the mouse drag callback of show.'
  }, {
    name: ':on-mouse-press',
    description: 'Key for the mouse press callback of show.'
  }, {
    name: ':on-mouse-release',
    description: 'Key for the mouse release callback of show.'
  }, {
    name: ':color',
    description: 'Symbol to define colors for images.'
  }, {
    name: ':font',
    description: 'Symbol to define fonts for images.'
  }, {
    name: ':pen',
    description: 'Symbol to define pens for images.'
  }, {
    name: ':square',
    description: 'Symbol to define a square image.'
  }, {
    name: ':rectangle',
    description: 'Symbol to define a rectangle image.'
  }, {
    name: ':circle',
    description: 'Symbol to define a circle image.'
  }, {
    name: ':ellipse',
    description: 'Symbol to define an ellipse image.'
  }, {
    name: ':text',
    description: 'Symbol to define a text image.'
  }, {
    name: ':scale',
    description: 'Symbol to define a scaled image.'
  }, {
    name: ':rotate',
    description: 'Symbol to define a rotated image.'
  }, {
    name: ':place-image',
    description: 'Symbol to define an image consisting of an image that is placed on another image.'
  }, {
    name: ':beside',
    description: 'Symbol to define an image consisting of an image that is placed beside another image.'
  }, {
    name: ':above',
    describe: 'Symbol to define an image consisting of an image that is placed above another image.'
  }, {
    name: ':overlay',
    description: 'Symbol to define an image consisting of multiple overlaying images.'
  }, {
    name: ':underlay',
    description: 'Symbol to define an image consisting of multiple underlaying images.'
  }, {
    name: ':bitmap',
    description: 'Symbol to define an image from a url or data url.'
  })
}
