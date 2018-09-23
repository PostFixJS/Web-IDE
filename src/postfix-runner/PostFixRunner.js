import Interpreter from 'postfixjs/Interpreter'
import Lexer from 'postfixjs/Lexer'

export default class PostFixRunner {
  constructor () {
    this.interpreter = new Interpreter()
    this._listeners = {}
    this._lastPosition = null
    this.breakpoints = []
  }

  /**
   * Create a new runner with the same interpreter. The new runner
   * can even run code while this runner is paused. It will modify
   * its stack and dict, though.
   * @returns A new runner that uses the same interpreter
   */
  fork () {
    const runner = new PostFixRunner()
    runner.interpreter = this.interpreter
    return runner
  }

  get running () {
    return this._resolveRun != null
  }

  run (code, pauseImmediately = false, reset = true) {
    this._pauseRequested = false

    for (const breakpoint of this.breakpoints) {
      if (breakpoint.type === 'hit') {
        breakpoint.hits = 0
      }
    }

    const lexer = new Lexer()
    lexer.put(code)
    if (reset) {
      this.interpreter.reset()
    }
    this._stepper = this.interpreter.startRun(lexer.getTokens())
    this._stepper.promise.catch((e) => {
      if (this._rejectRun) {
        this._rejectRun(e)
      }
    })

    return new Promise(async (resolve, reject) => {
      this._resolveRun = resolve
      this._rejectRun = reject

      if (pauseImmediately) {
        await this.step()
        if (this.running) {
          this._emit('pause', this._lastPosition)
        }
      } else {
        this._timeoutId = setImmediate(this._step)
      }
    })
  }

  continue () {
    this._timeoutId = setImmediate(this._step)
    this._emit('continue')
  }

  _step = async () => {
    await this.step()
    try {
      if (this.running) {
        if (this._lastPosition != null && await this.shouldBreakAt(this._lastPosition)) {
          this._emit('pause', this._lastPosition)
        } else {
          this._timeoutId = setImmediate(this._step)
        }
      }
    } catch (e) {
      if (!(e instanceof InterruptedException)) {
        this._rejectRun(e)
      }
    }
  }

  async step () {
    if (this._breakpointRunner != null && this._breakpointRunner.running) {
      this._breakpointRunner.stop()
      return
    }

    try {
      const { done, value } = await this._stepper.step()
      if (done) {
        this._stepper = null
        this._resolveRun(value)
        this._resolveRun = null
        this._rejectRun = null
      } else {
        this._lastPosition = value
        this._emit('position', value)
      }
    } catch (e) {
      this._stepper = null
    }
  }

  async pause () {
    if (this._breakpointRunner != null) {
      this._breakpointRunner.stop()
    }

    this._pauseRequested = true
  }

  stop () {
    if (this.running) {
      if (this._breakpointRunner != null) {
        this._breakpointRunner.stop()
      }

      clearImmediate(this._timeoutId)
      this._rejectRun(new InterruptedException())
      this._resolveRun = null
      this._rejectRun = null
      if (this._stepper) {
        this._stepper.cancel()
        this._stepper = null
      }
    }
  }

  on (event, handler) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event].push(handler)
  }

  off (event, handler) {
    if (this._listeners[event]) {
      this._listeners[event].splice(this._listeners[event].indexOf(handler))
    }
  }

  _emit (event, ...args) {
    const handlers = this._listeners[event]
    if (handlers) {
      for (const handler of handlers) {
        handler.apply(undefined, args)
      }
    }
  }

  async shouldBreakAt ({ token, line, col }) {
    if (this._pauseRequested) return true
    if (token === 'debugger') return true

    const breakpoint = this.breakpoints.find(({ position }) => position && position.line === line && position.col === col)
    if (breakpoint) {
      switch (breakpoint.type) {
        case 'expression': {
          if (this._breakpointRunner == null) {
            this._breakpointRunner = new PostFixRunner()
          }
          const runner = this._breakpointRunner
          runner.interpreter = this.interpreter.copy()
          try {
            await runner.run(breakpoint.expression)
            if (runner.interpreter._stack.count > 0 && runner.interpreter._stack.pop().value === true) {
              return true
            }
          } catch (e) {
            if (e instanceof InterruptedException) {
              throw e
            } else {
              e.breakpoint = breakpoint
              this._rejectRun(e)
            }
          }
          break
        }
        case 'hit': {
          breakpoint.hits = (breakpoint.hits || 0) + 1
          const hitCount = parseInt(breakpoint.expression, 10)
          if (breakpoint.hits >= hitCount) {
            return true
          }
          break
        }
        default:
          return true
      }
    }

    return false
  }
}

export class InterruptedException extends Error {
  constructor () {
    super('Interrupted')

    // workaround for Babel not supporting inheritance from Error
    this.constructor = InterruptedException 
    this.__proto__ = InterruptedException.prototype
  }
}
