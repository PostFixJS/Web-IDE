import Interpreter from 'postfixjs/Interpreter'
import Lexer from 'postfixjs/Lexer'

export default class PostFixRunner {
  constructor () {
    this.interpreter = new Interpreter()
    this.interpreter.__runner = this
    this._listeners = {}
    this._lastPosition = null
    this.breakpoints = []

    // the runner state encapsulates the state of the current execution
    this._runnerState = {
      stepper: null,
      rejectRun: null,
      resolveRun: null
    }
    this._runnerStateStack = []
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
    return this._runnerState.resolveRun != null
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
    this._runnerState.stepper = this.interpreter.startRun(lexer.getTokens())
    this._runnerState.stepper.promise.catch((e) => {
      if (this._runnerState.rejectRun) {
        this._runnerState.rejectRun(e)
      }
    })

    return new Promise(async (resolve, reject) => {
      this._runnerState.resolveRun = resolve
      this._runnerState.rejectRun = reject

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

  runInner (obj) {
    clearImmediate(this._timeoutId)
    this._runnerStateStack.push(this._runnerState)
    this._runnerState = {
      stepper: null,
      rejectRun: null,
      resolveRun: null
    }
    this._runnerState.stepper = this.interpreter.startRunObj(obj)
    this._runnerState.stepper.promise.catch((e) => {
      if (this._runnerState.rejectRun) {
        this._runnerState.rejectRun(e)
      }
    })

    return new Promise(async (resolve, reject) => {
      this._runnerState.resolveRun = resolve
      this._runnerState.rejectRun = reject

      this._timeoutId = setImmediate(this._step)
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
      } else if (this._runnerStateStack.length > 0) {
        this._runnerState = this._runnerStateStack.pop()
        this._timeoutId = setImmediate(this._step)
      }
    } catch (e) {
      if (!(e instanceof InterruptedException)) {
        this._runnerState.rejectRun(e)
      }
    }
  }

  async step () {
    if (this._breakpointRunner != null && this._breakpointRunner.running) {
      this._breakpointRunner.stop()
      return
    }

    try {
      const { done, value } = await this._runnerState.stepper.step()
      if (done) {
        this._runnerState.stepper = null
        this._runnerState.resolveRun(value)
        this._runnerState.resolveRun = null
        this._runnerState.rejectRun = null
      } else {
        this._lastPosition = value
        this._emit('position', value)
      }
    } catch (e) {
      this._runnerState._stepper = null
      // TODO what should happen to the other runnerStates here?
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

      // TODO also stop all nested runner states
      this._runnerState.rejectRun(new InterruptedException())
      this._runnerState.resolveRun = null
      this._runnerState.rejectRun = null
      if (this._runnerState.stepper) {
        this._runnerState.stepper.cancel()
        this._runnerState.stepper = null
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
              this._runnerState.rejectRun(e) // TODO also reject all nested runner states
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
