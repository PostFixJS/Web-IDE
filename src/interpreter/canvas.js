import { keyGet } from 'postfixjs/operators/impl/array'
import { popOperands, popOperand } from 'postfixjs/typeCheck'
import createCancellationToken from 'postfixjs/util/cancellationToken'
import * as types from 'postfixjs/types'
import PostFixRunner from '../postfix-runner/PostFixRunner'
import { registerFunctions, registerSymbols } from './doc'
import Image from './canvas/Image'

/**
 * Add a listener for the window resize events and scale the canvas to the window size, keeping the aspect ratio.
 * The canvas size is changed for the first time when this function is called.
 * @param {HTMLCanvasElement} canvas Canvas element
 * @param {Window} win Window the canvas is in
 * @param {number} imageWidth Original image width
 * @param {number} imageHeight Original image height
 * @param {onSizeChanged} function Optional callback function invoked when the size changed
 */
function resizeCanvasToWindowSize (canvas, win, imageWidth, imageHeight, onSizeChanged) {
  const updateCanvas = () => {
    if (imageWidth > imageHeight) {
      // landscape canvas
      let newWidth = win.innerWidth
      let newHeight = imageHeight * newWidth / imageWidth
      if (newHeight > win.innerHeight) {
        newHeight = win.innerHeight
        newWidth = imageWidth * newHeight / imageHeight
      }
      canvas.width = newWidth
      canvas.height = newHeight
    } else {
      // portrait or square
      let newHeight = win.innerHeight
      let newWidth = imageWidth * newHeight / imageHeight
      if (newWidth > win.innerWidth) {
        newWidth = win.innerWidth
        newHeight = imageHeight * newWidth / imageWidth
      }
      canvas.width = newWidth
      canvas.height = newHeight
    }

    if (onSizeChanged) onSizeChanged()
  }

  win.addEventListener('resize', updateCanvas)
  updateCanvas()
}

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
      win.document.body.style.margin = 0
      win.document.body.appendChild(canvas)
      win.addEventListener('unload', () => { windowClosed = true })

      let image = null
      const ctx = canvas.getContext('2d')
      resizeCanvasToWindowSize(canvas, win, windowWidth, windowHeight, () => {
        if (image) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.save()
          ctx.scale(canvas.width / width, canvas.height / height)
          image.draw(ctx)
          ctx.restore()
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

        const runInQueue = async (obj, ...args) => {
          if (cancelToken.cancelled || windowClosed) return
          for (const arg of args) {
            interpreter._stack.push(arg)
          }
          const { promise, cancel } = PostFixRunner.getRunnerOf(interpreter).runInner(obj)
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
        cancel()
        throw new types.Err(`Expected on-tick callback to be a lambda function (:Lam) but got ${onTick.getTypeName()} instead`, onTick.origin || callbacks.origin)
      }
      if (onDraw && !(onDraw instanceof types.Lam)) {
        cancel()
        throw new types.Err(`Expected on-draw callback to be a lambda function (:Lam) but got ${onDraw.getTypeName()} instead`, onDraw.origin || callbacks.origin)
      }
      const stopWhen = keyGet(callbacks, new types.Sym('stop-when'), null)
      if (stopWhen && !(stopWhen instanceof types.Lam)) {
        cancel()
        throw new types.Err(`Expected stop-when callback to be a lambda function (:Lam) but got ${stopWhen.getTypeName()} instead`, stopWhen.origin || callbacks.origin)
      }

      const redraw = () => {
        if (cancelToken.cancelled) return
        enqueue(async (runObj) => {
          if (onTick) {
            await runObj(onTick, state)
            if (interpreter._stack.accessibleCount === 0) {
              cancel()
              throw new types.Err('Expected on-tick to push the next state on the stack but the stack is empty', onTick.origin || callbacks.origin)
            }
            state = interpreter._stack.pop()
          }

          if (onDraw) {
            await runObj(onDraw, state)
            if (interpreter._stack.accessibleCount === 0) {
              cancel()
              throw new types.Err('Expected on-draw to push an image on the stack but the stack is empty', onDraw.origin || callbacks.origin)
            }
            image = await Image.from(interpreter._stack.pop())
          }

          win.requestAnimationFrame(() => {
            if (image) {
              ctx.resetTransform()
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
              image.draw(ctx)
            }
            if (!cancelToken.cancelled) redraw()
          })

          if (stopWhen) {
            await runObj(stopWhen, state)
            if (interpreter._stack.accessibleCount === 0) {
              cancel()
              throw new types.Err('Expected stop-when to push a :Bool on the stack but the stack is empty', stopWhen.origin || callbacks.origin)
            }
            const stop = interpreter._stack.pop()
            if (!(stop instanceof types.Bool)) {
              cancel()
              throw new types.Err(`Expected stop-when to push a :Bool on the stack but got ${stop.getTypeName()} instead`, stop.origin || callbacks.origin)
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
            await runObj(onKeyDown, state, new types.Str(e.key))
            if (interpreter._stack.accessibleCount === 0) {
              cancel()
              throw new types.Err('Expected on-key-press to push the next state on the stack but the stack is empty', onKeyDown.origin || callbacks.origin)
            }
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
            await runObj(onKeyUp, state, new types.Str(e.key))
            if (interpreter._stack.accessibleCount === 0) {
              cancel()
              throw new types.Err('Expected on-key-release to push the next state on the stack but the stack is empty', onKeyUp.origin || callbacks.origin)
            }
            state = interpreter._stack.pop()
          })
        })
      }

      const normalizeMouse = (e) => ({
        x: (e.clientX - canvas.offsetLeft) / canvas.clientWidth * windowWidth,
        y: (e.clientY - canvas.offsetTop) / canvas.clientHeight * windowHeight
      })

      const onMouseMove = keyGet(callbacks, new types.Sym('on-mouse-move'), null)
      if (onMouseMove != null && !(onMouseMove instanceof types.Lam)) {
        throw new types.Err(`Expected on-mouse-move callback to be a lambda function (:Lam) but got ${onMouseMove.getTypeName()} instead`, onMouseMove.origin || callbacks.origin)
      }
      canvas.addEventListener('mousemove', (e) => {
        if (e.buttons === 0) { // 0 = no mouse button pressed
          const {x, y} = normalizeMouse(e)
          for (const hit of image.getImagesAt(x, y)) {
            if (hit.image.taggedValues != null) {
              const mouseMoveHandler = keyGet(hit.image.taggedValues, new types.Sym('on-mouse-move'), null)
              if (mouseMoveHandler) {
                enqueue(async (runObj) => { // eslint-disable-line no-loop-func
                  if (!(mouseMoveHandler instanceof types.Lam)) {
                    throw new types.Err(`Expected on-mouse-move callback to be a lambda function (:Lam) but got ${mouseMoveHandler.getTypeName()} instead`, mouseMoveHandler.origin || hit.image.taggedValues.origin)
                  }
                  await runObj(mouseMoveHandler, state, new types.Flt(hit.x), new types.Flt(hit.y))
                  if (interpreter._stack.accessibleCount === 0) {
                    cancel()
                    throw new types.Err('Expected on-mouse-move to push the next state on the stack but the stack is empty', mouseMoveHandler.origin || callbacks.origin)
                  }
                  state = interpreter._stack.pop()
                })
              }
            }
          }
          if (onMouseMove != null) {
            enqueue(async (runObj) => {
              await runObj(onMouseMove, state, new types.Flt(x), new types.Flt(y))
              if (interpreter._stack.accessibleCount === 0) {
                cancel()
                throw new types.Err('Expected on-mouse-move to push the next state on the stack but the stack is empty', onMouseMove.origin || callbacks.origin)
              }
              state = interpreter._stack.pop()
            })
          }
        }
      })

      const onMouseDrag = keyGet(callbacks, new types.Sym('on-mouse-drag'), null)
      if (onMouseDrag != null && !(onMouseDrag instanceof types.Lam)) {
        throw new types.Err(`Expected on-mouse-drag callback to be a lambda function (:Lam) but got ${onMouseDrag.getTypeName()} instead`, onMouseDrag.origin || callbacks.origin)
      }
      canvas.addEventListener('mousemove', (e) => {
        if (e.buttons === 1) { // 1 = left mouse button pressed
          const {x, y} = normalizeMouse(e)
          for (const hit of image.getImagesAt(x, y)) {
            if (hit.image.taggedValues != null) {
              const mouseDragHandler = keyGet(hit.image.taggedValues, new types.Sym('on-mouse-drag'), null)
              if (mouseDragHandler) {
                enqueue(async (runObj) => { // eslint-disable-line no-loop-func
                  if (!(mouseDragHandler instanceof types.Lam)) {
                    throw new types.Err(`Expected on-mouse-drag callback to be a lambda function (:Lam) but got ${mouseDragHandler.getTypeName()} instead`, mouseDragHandler.origin || hit.image.taggedValues.origin)
                  }
                  await runObj(mouseDragHandler, state, new types.Flt(hit.x), new types.Flt(hit.y))
                  if (interpreter._stack.accessibleCount === 0) {
                    cancel()
                    throw new types.Err('Expected on-mouse-drag to push the next state on the stack but the stack is empty', mouseDragHandler.origin || callbacks.origin)
                  }
                  state = interpreter._stack.pop()
                })
              }
            }
          }
          if (onMouseDrag != null) {
            enqueue(async (runObj) => {
              await runObj(onMouseDrag, state, new types.Flt(x), new types.Flt(y))
              if (interpreter._stack.accessibleCount === 0) {
                cancel()
                throw new types.Err('Expected on-mouse-drag to push the next state on the stack but the stack is empty', onMouseDrag.origin || callbacks.origin)
              }
              state = interpreter._stack.pop()
            })
          }
        }
      })

      const onMouseDown = keyGet(callbacks, new types.Sym('on-mouse-press'), null)
      if (onMouseDown != null && !(onMouseDown instanceof types.Lam)) {
        throw new types.Err(`Expected on-mouse-press callback to be a lambda function (:Lam) but got ${onMouseDown.getTypeName()} instead`, onMouseDown.origin || callbacks.origin)
      }
      canvas.addEventListener('mousedown', (e) => {
        const {x, y} = normalizeMouse(e)
        for (const hit of image.getImagesAt(x, y)) {
          if (hit.image.taggedValues != null) {
            const mouseDownHandler = keyGet(hit.image.taggedValues, new types.Sym('on-mouse-press'), null)
            if (mouseDownHandler) {
              enqueue(async (runObj) => { // eslint-disable-line no-loop-func
                if (!(mouseDownHandler instanceof types.Lam)) {
                  throw new types.Err(`Expected on-mouse-press callback to be a lambda function (:Lam) but got ${mouseDownHandler.getTypeName()} instead`, mouseDownHandler.origin || hit.image.taggedValues.origin)
                }
                await runObj(mouseDownHandler, state, new types.Flt(hit.x), new types.Flt(hit.y))
                if (interpreter._stack.accessibleCount === 0) {
                  cancel()
                  throw new types.Err('Expected on-mouse-press to push the next state on the stack but the stack is empty', mouseDownHandler.origin || callbacks.origin)
                }
                state = interpreter._stack.pop()
              })
            }
          }
        }
        if (onMouseDown != null) {
          enqueue(async (runObj) => {
            await runObj(onMouseDown, state, new types.Flt(x), new types.Flt(y))
            if (interpreter._stack.accessibleCount === 0) {
              cancel()
              throw new types.Err('Expected on-mouse-press to push the next state on the stack but the stack is empty', onMouseDown.origin || callbacks.origin)
            }
            state = interpreter._stack.pop()
          })
        }
      })

      const onMouseUp = keyGet(callbacks, new types.Sym('on-mouse-release'), null)
      if (onMouseUp != null && !(onMouseUp instanceof types.Lam)) {
        throw new types.Err(`Expected on-mouse-release callback to be a lambda function (:Lam) but got ${onMouseUp.getTypeName()} instead`, onMouseUp.origin || callbacks.origin)
      }
      canvas.addEventListener('mouseup', (e) => {
        const {x, y} = normalizeMouse(e)
        for (const hit of image.getImagesAt(x, y)) {
          if (hit.image.taggedValues != null) {
            const mouseUpHandler = keyGet(hit.image.taggedValues, new types.Sym('on-mouse-release'), null)
            if (mouseUpHandler) {
              enqueue(async (runObj) => { // eslint-disable-line no-loop-func
                if (!(mouseUpHandler instanceof types.Lam)) {
                  throw new types.Err(`Expected on-mouse-release callback to be a lambda function (:Lam) but got ${mouseUpHandler.getTypeName()} instead`, mouseUpHandler.origin || hit.image.taggedValues.origin)
                }
                await runObj(mouseUpHandler, state, new types.Flt(hit.x), new types.Flt(hit.y))
                if (interpreter._stack.accessibleCount === 0) {
                  cancel()
                  throw new types.Err('Expected on-mouse-release to push the next state on the stack but the stack is empty', mouseUpHandler.origin || callbacks.origin)
                }
                state = interpreter._stack.pop()
              })
            }
          }
        }
        if (onMouseUp != null) {
          enqueue(async (runObj) => {
            await runObj(onMouseUp, state, new types.Flt(x), new types.Flt(y))
            if (interpreter._stack.accessibleCount === 0) {
              cancel()
              throw new types.Err('Expected on-mouse-release to push the next state on the stack but the stack is empty', onMouseUp.origin || callbacks.origin)
            }
            state = interpreter._stack.pop()
          })
        }
      })

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

      const ctx = canvas.getContext('2d')
      resizeCanvasToWindowSize(canvas, win, image.width, image.height, () => {
        ctx.scale(canvas.width / image.width, canvas.height / image.height)
        image.draw(ctx)
        ctx.restore()
      })

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
    description: 'Symbol to define an image consisting of an image that is placed above another image.'
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
