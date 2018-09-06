import Interpreter from 'postfixjs/Interpreter'
import Lexer from 'postfixjs/Lexer'

export default class PostFixRunner {
  constructor () {
    this.interpreter = new Interpreter()
  }

  run (code, pauseImmediately = false) {
    const lexer = new Lexer()
    lexer.put(code)
    this.interpreter.reset()
    this.interpreter.startRun(lexer.getTokens())

    return new Promise((resolve, reject) => {
      this._resolveRun = resolve
      this._rejectRun = reject

      if (!pauseImmediately) {
        this._timeoutId = setImmediate(this.step)
      }
    })
  }

  continue () {
    this._timeoutId = setImmediate(this.step)
  }

  step = () => {
    try {
      const { done, value } = this.interpreter.step()
      if (done) {
        this._resolveRun()
        this._resolveRun = null
        this._rejectRun = null
      }
    } catch (e) {
      this._rejectRun(e)
      this._resolveRun = null
      this._rejectRun = null
    }
  }

  pause () {
    clearImmediate(this._timeoutId)
  }

  stop () {
    clearImmediate(this._timeoutId)
    this._rejectRun(new Error('Interrupted')) // TODO throw custom exception
    this._resolveRun = null
    this._rejectRun = null
  }
}
