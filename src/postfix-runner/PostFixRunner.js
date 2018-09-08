import Interpreter from 'postfixjs/Interpreter'
import Lexer from 'postfixjs/Lexer'

export default class PostFixRunner {
  constructor () {
    this.interpreter = new Interpreter()
    this._listeners = {}
    this._lastPosition = null
    this.breakpoints = []
  }

  get running () {
    return this._resolveRun != null
  }

  run (code, pauseImmediately = false) {
    for (const breakpoint of this.breakpoints) {
      if (breakpoint.type === 'hit') {
        breakpoint.hits = 0
      }
    }

    const lexer = new Lexer()
    lexer.put(code)
    this.interpreter.reset()
    this.interpreter.startRun(lexer.getTokens())

    return new Promise((resolve, reject) => {
      this._resolveRun = resolve
      this._rejectRun = reject

      if (pauseImmediately) {
        this.step()
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
    this.step()
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

  step () {
    if (this._breakpointRunner != null && this._breakpointRunner.running) {
      this._breakpointRunner.stop()
      return
    }

    try {
      const { done, value } = this.interpreter.step()
      if (done) {
        this._resolveRun()
        this._resolveRun = null
        this._rejectRun = null
      } else {
        this._lastPosition = value
        this._emit('position', value)
      }
    } catch (e) {
      this._rejectRun(e)
      this._resolveRun = null
      this._rejectRun = null
    }
  }

  pause () {
    if (this._breakpointRunner != null) {
      this._breakpointRunner.stop()
    }

    clearImmediate(this._timeoutId)
    this._emit('pause', this._lastPosition)
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
        case 'log':
          // TODO
          break
        default:
          return true
      }
    }

    return false
  }
}

export class InterruptedException extends Error {
}
