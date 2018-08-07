import React from 'react'
import MonacoEditor from 'react-monaco-editor'
import Lexer from 'postfixjs/Lexer'
import Interpreter from 'postfixjs/Interpreter'

export default class Repl extends React.Component {
  state = {
    lines: []
  }
  interpreter = new Interpreter()

  editorDidMount = (editor, monaco) => {
    this.editor = editor
    editor.addCommand(monaco.KeyCode.Enter, () => {
      const code = editor.getValue()
      editor.setValue('')
      try {
        const tokens = Lexer.parse(code)
        this.interpreter.runToCompletion(tokens)
        this.setState((state) => ({
          lines: [
            ...state.lines,
            { type: 'input', value: code },
            { type: 'output', value: this.interpreter._stack._stack.map((obj) => obj.toString()).join(', ') }
          ]
        }))
      } catch (e) {
        this.setState((state) => ({
          lines: [
            ...state.lines,
            { type: 'input', value: code },
            { type: 'output', value: e.message }
          ]
        }))
      }
    }, 'editorTextFocus')
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.lines !== this.state.lines) {
      this._output.scrollTop = this._output.scrollHeight
    }
  }

  setRootRef = (ref) => {
    this._rootRef = ref
  }

  setOutputRef = (ref) => {
    this._output = ref
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
    this.editor.focus()
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
        <div style={{ flex: 1, overflowX: 'auto' }} ref={this.setOutputRef}>
          {this.state.lines.map((line, i) => line.type === 'input' ? (
            <p key={i}>&gt; {line.value}</p>
          ) : (
            <p key={i}>{line.value}</p>
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
