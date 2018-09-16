import React from 'react'
import injectSheet from 'react-jss'
import { InterruptedException } from '../../postfix-runner/PostFixRunner'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import OneLineEditor from '../OneLineEditor';
import { showMessage } from '../Editor/monaco-integration/util'

const styles = (theme) => ({
  output: {
    flex: 1,
    overflowX: 'auto',
    fontSize: 14,
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"',
    padding: 8,
    borderBottom: `1px solid ${theme.divider.color}`,
    marginBottom: 8
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
})

function findIndexFromEnd (arr, predicate, startIndex = arr.length - 1) {
  for (let i = startIndex; i >= 0; i--) {
    if (predicate(arr[i], i, arr)) {
      return i
    }
  }
  return -1
}

function findIndex (arr, predicate, startIndex = 0) {
  for (let i = startIndex; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) {
      return i
    }
  }
  return -1
}

class Repl extends React.Component {
  state = {
    lines: [],
    running: false,
    currentInput: '',
    oldInputIndex: -1
  }

  editorDidMount = (editor, monaco) => {
    this.editor = editor

    editor.addCommand(monaco.KeyCode.Enter, () => {
      if (this.state.running) return

      const code = editor.getValue()
      editor.setValue('')
      this.setState((state) => ({
        lines: [
          ...state.lines,
          { type: 'input', value: code }
        ],
        running: true,
        oldInputIndex: -1
      }))

      this.props.runner.run(code, false, false)
        .then(() => {
          this.setState((state) => ({
            lines: [
              ...state.lines,
              { type: 'output', value: this.props.runner.interpreter._stack._stack.map((obj) => obj.toString()) }
            ],
            running: false
          }))
          this.props.onExecutionFinished()
        })
        .catch((e) => {
          if (!(e instanceof InterruptedException)) {
            this.setState((state) => ({
              lines: [
                ...state.lines,
                { type: 'error', value: e.message }
              ],
              running: false
            }))
          }
          this.props.onExecutionFinished()
        })
    }, 'editorTextFocus')

    editor.addCommand(monaco.KeyCode.UpArrow, () => {
      if (this.state.running) return

      const { oldInputIndex, lines } = this.state

      if (oldInputIndex === -1) {
        const lastInput = findIndexFromEnd(lines, ({type}) => type === 'input')
        if (lastInput >= 0) {
          this.setState({
            oldInputIndex: lastInput,
            currentInput: editor.getValue()
          }, () => {
            editor.setValue(lines[lastInput].value)
            editor.setPosition({ lineNumber: 1, column: lines[lastInput].value.length + 1 })
          })
        }
      } else if (oldInputIndex > 0) {
        const lastInput = findIndexFromEnd(lines, ({type}) => type === 'input', oldInputIndex - 1)
        if (lastInput >= 0) {
          this.setState({ oldInputIndex: lastInput }, () => {
            editor.setValue(lines[this.state.oldInputIndex].value)
            editor.setPosition({ lineNumber: 1, column: lines[this.state.oldInputIndex].value.length + 1 })
          })
        }
      }
    }, 'editorTextFocus')

    editor.addCommand(monaco.KeyCode.DownArrow, () => {
      if (this.state.running) return

      const { oldInputIndex, lines } = this.state

      if (oldInputIndex >= 0) {
        const nextInput =  findIndex(lines, ({type}) => type === 'input', oldInputIndex + 1)
        if (nextInput >= 0) {
          this.setState({
            oldInputIndex: nextInput
          }, () => {
            editor.setValue(lines[nextInput].value)
            editor.setPosition({ lineNumber: 1, column: lines[nextInput].value.length + 1 })
          })
        } else {
          this.setState({
            oldInputIndex: -1
          }, () => {
            editor.setValue(this.state.currentInput)
            editor.setPosition({ lineNumber: 1, column: this.state.currentInput.length + 1 })
          })
        }
      }
    }, 'editorTextFocus')

    editor.onDidAttemptReadOnlyEdit((e) => {
      if (this.props.disabled) {
        showMessage(this.editor, 'Wait for the program to finish executing or pause it to use the REPL.')
      } else {
        showMessage(this.editor, 'Cancel the previous program to run a new one.')
      }
    })
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.lines !== this.state.lines) {
      this._output.scrollTop = this._output.scrollHeight
    }
    if (prevState.running !== this.state.running || prevProps.disabled !== this.props.disabled) {
      this.editor.updateOptions({
        readOnly: this.state.running || this.props.disabled
      })
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
    // don't focus the editor if the user is selecting text from the output, which would cancel the selection
    if (window.getSelection().toString() === '') {
      this.editor.focus()
    }
  }

  handleCancel = () => {
    this.props.runner.stop()
    this.setState((state) => ({
      lines: [
        ...state.lines,
        { type: 'output', value: this.props.runner.interpreter._stack._stack.map((obj) => obj.toString()) }
      ],
      running: false
    }))
  }

  render () {
    const {
      classes,
      disabled,
      onExecutionFinished,
      onRunCommand,
      runner,
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
        <div className={classes.output} ref={this.setOutputRef}>
          {this.state.lines.map((line, i) => line.type === 'input' ? (
            <p key={i} className={classes.line}>
              &gt; {line.value}
              {i === this.state.lines.length - 1 && (<span> – <a onClick={this.handleCancel}>Cancel</a></span>)}
            </p>
          ) : line.type === 'error' ? (
            <p key={i} className={classes.error}>Error: {line.value}</p>
          ) : (
            <p key={i} className={classes.line}><ObjectHighlighter objects={line.value}/></p>
          ))}
        </div>
        <OneLineEditor
          language='postfix'
          editorDidMount={this.editorDidMount}
          options={{ fixedOverflowWidgets: true }}
        />
      </div>
    )
  }
}

export default injectSheet(styles)(Repl)
