import * as types from 'postfixjs/types'
import { popOperand } from 'postfixjs/typeCheck'
import createCancellationToken from 'postfixjs/util/cancellationToken'

/**
 * Add the http functions (i.e. read-url) to the interpreter.
 * @param {Interpreter} interpreter PostFix interpreter
 */
export function registerBuiltIns (interpreter) {
  interpreter.registerBuiltIn({
    name: 'read-url',
    * execute (interpreter, token) {
      // fetch requires Chrome 42, Safari 10, Firefox 39 or Edge 14
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
      const url = popOperand(interpreter, { type: 'Str', name: 'url' }, token)
      const { cancel, token: cancelToken } = createCancellationToken()

      let signal
      if (window.AbortController) {
        // actually cancel the HTTP request if the browser supports it
        // AbortController requires Chrome 66, Safari 11.1, Firefox 57
        // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/AbortController
        const abortController = new window.AbortController()
        signal = abortController.signal
        cancelToken.onCancel(() => abortController.abort())
      }

      yield {
        cancel,
        promise: fetch(url.value, { signal })
          .then((response) => {
            if (cancelToken.cancelled) return
            if (response.status === 200) {
              return response.text()
            } else {
              throw new types.Err(`Download failed (HTTP status ${response.status})`)
            }
          })
          .then((text) => {
            if (cancelToken.cancelled) return
            interpreter._stack.push(new types.Str(text))
          })
          .catch((e) => {
            if (cancelToken.cancelled) return
            if (e instanceof types.Err) {
              throw e
            }
            throw new types.Err('Download failed', token)
          })
      }
    }
  })
}
