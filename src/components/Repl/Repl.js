import React from 'react'
import MonacoEditor from 'react-monaco-editor'
import { MessageController } from 'monaco-editor/esm/vs/editor/contrib/message/messageController'
import Lexer from 'postfixjs/Lexer'
import Interpreter from 'postfixjs/Interpreter'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'

const styles = {
  output: {
    flex: 1,
    overflowX: 'auto',
    fontSize: 14,
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"',
    padding: 8
  },
  line: {
    margin: 0,
    padding: 0
  },
  error: {
    margin: 0,
    padding: 0,
    color: 'rgb(255, 0, 24)'
  }
}

export default class Repl extends React.Component {
  state = {
    lines: [],
    running: false
  }
  interpreter = new Interpreter()

  editorDidMount = (editor, monaco) => {
    this.editor = editor

    editor.addCommand(monaco.KeyCode.Enter, () => {
      if (this.state.running) return

      const code = editor.getValue()
      editor.setValue('')
      this.interpreter.startRun(Lexer.parse(code))
      this._timeoutId = setImmediate(this.step)
      this.setState((state) => ({
        lines: [
          ...state.lines,
          { type: 'input', value: code }
        ],
        running: true
      }))
    }, 'editorTextFocus')

    editor.onDidAttemptReadOnlyEdit((e) => {
      MessageController.get(this.editor).showMessage('The previous input is still being executed.', this.editor.getPosition())
    })
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.lines !== this.state.lines) {
      this._output.scrollTop = this._output.scrollHeight
    }
    if (prevState.running !== this.state.running) {
      this.editor.updateOptions({
        readOnly: this.state.running
      })
    }
  }

  componentWillUnmount () {
    if (this._timeoutId) {
      clearImmediate(this._timeoutId)
    }
  }

  setRootRef = (ref) => {
    this._rootRef = ref
  }

  setOutputRef = (ref) => {
    this._output = ref
  }

  step = () => {
    try {
      const { done } = this.interpreter.step()
      if (done) {
        this.setState((state) => ({
          lines: [
            ...state.lines,
            { type: 'output', value: this.interpreter._stack._stack.map((obj) => obj.toString()) }
          ],
          running: false
        }))
        clearImmediate(this._timeoutId)
      } else {
        this._timeoutId = setImmediate(this.step)
      }
    } catch (e) {
      this.setState((state) => ({
        lines: [
          ...state.lines,
          { type: 'error', value: e.message }
        ],
        running: false
      }))
      clearImmediate(this._timeoutId)
    }
  }

  /**
   * Update the size of the editor.
   * @public
   * @param {object} dimensions New width and height (both optional, default to the size of this component)
   */
  layout (dimensions = {}) {
    this.editor.layout({
      width: dimensions.width || this._rootRef.clientWidth,
      height: 19
    })
  }

  handleClick = () => {
    // don't focus the editor if the user is selecting text from the output, which would cancel the selection
    if (window.getSelection().toString() === '') {
      this.editor.focus()
    }
  }

  handleCancel = () => {
    clearImmediate(this._timeoutId)
    this.setState((state) => ({
      lines: [
        ...state.lines,
        { type: 'output', value: this.interpreter._stack._stack.map((obj) => obj.toString()) }
      ],
      running: false
    }))
  }

  render () {
    const {
      style,
      ...other
    } = this.props

    return (
      <div
        ref={this.setRootRef}
        {...other}
        style={{ ...style, display: 'flex', flexDirection: 'column' }}
        onClick={this.handleClick}
      >
        <div style={styles.output} ref={this.setOutputRef}>
          {this.state.lines.map((line, i) => line.type === 'input' ? (
            <p key={i} style={styles.line}>
              &gt; {line.value}
              {i === this.state.lines.length - 1 && (<span> – <a onClick={this.handleCancel}>Cancel</a></span>)}
            </p>
          ) : line.type === 'error' ? (
            <p key={i} style={styles.error}>Error: {line.value}</p>
          ) : (
            <p key={i} style={styles.line}><ObjectHighlighter objects={line.value}/></p>
          ))}
        </div>
        <MonacoEditor
          height={19}
          language='postfix'
          options={{
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden',
              verticalSliderSize: 0
            },
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            minimap: {
              enabled: false
            },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            lineDecorationsWidth: 0
          }}
          editorDidMount={this.editorDidMount}
        />
      </div>
    )
  }
}
