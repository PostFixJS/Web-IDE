import Interpreter from 'postfixjs/Interpreter'
import Lexer from 'postfixjs/Lexer'

const runnerProperty = Symbol()

const maybeImmediate = (() => {
  let ctn = 999

  /**
   * Invoke the callback function immediately or defer it. Every 1000th function call is deferred.
   * This allows fast functions while keeping the event loop spinning.
   * @param {Function} cb Callback function
   */
  const _maybeImmediate = (cb) => {
    ctn++
    if (ctn === 1000) {
      ctn = 0
      setImmediate(cb)
    } else {
      cb()
    }
  }

  /**
   * Reset the counter so that the next call will be defered.
   */
  _maybeImmediate.deferNext = () => { ctn = 999 }

  return _maybeImmediate
})()

/**
 * A runner to execute PostFix in the browser so that the execution can be paused at any time.
 */
export default class PostFixRunner {
  /**
   * Create a new PostFix runner.
   * @param {object} options Interpreter options
   */
  constructor (options) {
    this.interpreter = new Interpreter(options)
    this.interpreter[runnerProperty] = this
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
    return this._runnerState && this._runnerState.stepper != null
  }

  /**
   * Execute the given PostFix code.
   * @param {string} code PostFix code
   * @param {boolean} pauseImmediately True to pause the program immediately
   * @param {boolean} reset True to reset the interpreter state before starting the execution
   */
  run (code, pauseImmediately = false, reset = true) {
    maybeImmediate.deferNext()
    this._pauseRequested = false

    for (const breakpoint of this.breakpoints) {
      if (breakpoint.type === 'hit') {
        breakpoint.hits = 0
      }
    }

    if (reset) {
      this.interpreter.reset()
    }

    const lexer = new Lexer()
    lexer.put(code)
    this._runnerState = {
      stepper: this.interpreter.startRun(lexer.getTokens()),
      rejectRun: null,
      resolveRun: null
    }
    this._runnerState.stepper.promise.catch((e) => {
      if (this._runnerState && this._runnerState.rejectRun) {
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
        maybeImmediate(this._step)
      }
    })
  }

  /**
   * Execute the given object nested in the current runner.
   * This is used to execute callbacks, e.g. of show.
   * @param {Obj} obj PostFix object
   */
  runInner (obj) {
    this._runnerStateStack.push(this._runnerState)
    this._runnerState = {
      stepper: this.interpreter.startRunObj(obj),
      rejectRun: null,
      resolveRun: null
    }
    this._runnerState.stepper.promise.catch((e) => {
      if (this._runnerState && this._runnerState.rejectRun) {
        this._runnerState.rejectRun(e)
      }
    })

    return {
      promise: new Promise(async (resolve, reject) => {
        this._runnerState.resolveRun = resolve
        this._runnerState.rejectRun = reject
        maybeImmediate(this._step)
      }),
      cancel: this._runnerState.stepper.cancel
    }
  }

  /**
   * Continue execution after it was paused.
   */
  continue () {
    this._pauseRequested = false
    maybeImmediate(this._step)
    this._emit('continue')
  }

  /**
   * Run the interpreter for one step and break at breakpoints.
   * @private
   */
  _step = async () => {
    if (!this.running) return

    await this._stepImpl()
    try {
      if (this.running) {
        if (this._lastPosition != null && await this.shouldBreakAt(this._lastPosition)) {
          this._pauseRequested = false
          this._emit('pause', this._lastPosition)
        } else {
          maybeImmediate(this._step)
        }
      } else if (this._runnerStateStack.length > 0) {
        this._runnerState = this._runnerStateStack.pop()
      }
    } catch (e) {
      if (!(e instanceof InterruptedException)) {
        this._runnerState.rejectRun(e)
      }
    }
  }

  /**
   * Run the interpreter for one step.
   * @private
   */
  async _stepImpl () {
    if (this._breakpointRunner != null && this._breakpointRunner.running) {
      this._breakpointRunner.stop()
      return
    }

    if (!this.running) return
    const { done, value } = await this._runnerState.stepper.step()

    if (done) {
      if (this._runnerState != null) {
        this._runnerState.stepper = null
        if (this._runnerState.resolveRun) {
          this._runnerState.resolveRun(value)
        }
      }
    } else {
      this._lastPosition = value
      this._emit('position', value)
    }
  }

  /**
   * Run the interpreter for one step.
   */
  async step () {
    this._pauseRequested = true
    await this._stepImpl()
    if (!this.running && this._runnerStateStack.length > 0) {
      // stepped out of a nested execution (e.g. callback)
      this._runnerState = this._runnerStateStack.pop()
    }
  }

  /**
   * Pause the running interpreter.
   */
  async pause () {
    if (this._breakpointRunner != null) {
      this._breakpointRunner.stop()
    }
    this._pauseRequested = true
  }

  /**
   * Stop the running interpreter.
   */
  stop () {
    if (this.running) {
      if (this._breakpointRunner != null) {
        this._breakpointRunner.stop()
      }

      while (this._runnerState != null) {
        this._runnerState.rejectRun(new InterruptedException())
        if (this._runnerState.stepper) {
          this._runnerState.stepper.cancel()
        }
        this._runnerState = this._runnerStateStack.pop()
      }
      this._runnerState = {
        stepper: null,
        rejectRun: null,
        resolveRun: null
      }
    }
  }

  /**
   * Add an event handler.
   * @param {string} event Event name, e.g. pause
   * @param {function} handler Event handler
   */
  on (event, handler) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event].push(handler)
  }

  /**
   * Remove an event handler.
   * @param {string} event Event name, e.g. pause
   * @param {function} handler Event handler
   */
  off (event, handler) {
    if (this._listeners[event]) {
      this._listeners[event].splice(this._listeners[event].indexOf(handler))
    }
  }

  /**
   * Emit an event.
   * @private
   * @param {string} event Event name
   * @param  {...any} args Arguments to pass to the event
   */
  _emit (event, ...args) {
    const handlers = this._listeners[event]
    if (handlers) {
      for (const handler of handlers) {
        handler.apply(undefined, args)
      }
    }
  }

  /**
   * Check if the interpreter should pause at the given location (e.g. due to a debugger statement or because there is a breakpoint).
   * This also evaluates conditional breakpoints.
   * @param {object} location Location of the next token to be executed
   */
  async shouldBreakAt ({ token, line, col }) {
    if (this._pauseRequested) return true
    if (token === 'debugger') return true

    const breakpoint = this.breakpoints.find(({ position }) => position && position.line === line && position.col === col)
    if (breakpoint) {
      switch (breakpoint.type) {
        case 'expression': {
          if (this._breakpointRunner == null) {
            this._breakpointRunner = new PostFixRunner(this.interpreter.options)
          }
          const runner = this._breakpointRunner
          runner.interpreter = this.interpreter.copy()
          try {
            await runner.run(breakpoint.expression, false, false)
            if (runner.interpreter._stack.count > 0 && runner.interpreter._stack.pop().value === true) {
              return true
            }
          } catch (e) {
            if (e instanceof InterruptedException) {
              throw e
            } else {
              e.breakpoint = breakpoint
              while (this._runnerState != null) {
                this._runnerState.rejectRun(e)
                this._runnerState = this._runnerStateStack.pop()
              }
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

  /**
   * Get the PostFixRunner instance of a given interpreter.
   * @param {Interpreter} interpreter Interpreter of a runner
   * @returns {PostFixRunner} Runner that the interpreter belongs to, undefined if the interpreter does not belong to a runner
   */
  static getRunnerOf (interpreter) {
    return interpreter[runnerProperty]
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
