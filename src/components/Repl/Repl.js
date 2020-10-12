import React from 'react'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import { InterruptedException } from '../../postfix-runner/PostFixRunner'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import OneLineEditor from '../OneLineEditor'
import { showMessage } from '../Editor/monaco-integration/util'
import SyntaxHighlighter from '../SyntaxHighlighter/SyntaxHighlighter'

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    '& .monaco-editor .overflow-guard, & .monaco-editor .editor-scrollable': {
      // fix truncated overflow in one-line editor
      overflow: 'visible !important'
    }
  },
  output: {
    flex: 1,
    overflowX: 'auto',
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
  },
  emptyStack: {
    color: theme.card.color,
    opacity: 0.5,
    fontStyle: 'italic'
  }
})

/**
 * Get the index of the last element in an array that matches a predicate function.
 * @param {array} arr An array
 * @param {function} predicate A predicate function
 * @param {number} startIndex Start index, defaults to the last index
 * @returns The index of the last element in the array that matches the predicate function
 */
function findIndexFromEnd (arr, predicate, startIndex = arr.length - 1) {
  for (let i = startIndex; i >= 0; i--) {
    if (predicate(arr[i], i, arr)) {
      return i
    }
  }
  return -1
}

/**
 * Get the index of the first element in an array that matches a predicate function.
 * @param {array} arr An array
 * @param {function} predicate A predicate function
 * @param {number} startIndex Start index, defaults to 0
 * @retunrs The index of the first element in the array that matches the predicate function
 */
function findIndex (arr, predicate, startIndex = 0) {
  for (let i = startIndex; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) {
      return i
    }
  }
  return -1
}

/**
 * A read-eval-print loop with a history that can be accessed with the arrow keys.
 */
class Repl extends React.Component {
  state = {
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
      this.props.onAppendLine({ type: 'input', value: code })
      this.setState({ running: true, oldInputIndex: -1 })

      this.props.runner.run(code, false, false)
        .then(() => {
          this.setState({ running: false })
          this.props.onAppendLine({ type: 'output', value: this.props.runner.interpreter._stack._stack.map((obj) => obj.toString()) })
          this.props.onExecutionFinished()
        })
        .catch((e) => {
          if (!(e instanceof InterruptedException)) {
            this.props.onAppendLine({ type: 'error', value: e.message })
            this.setState({ running: false })
          }
          this.props.onExecutionFinished()
        })
    }, 'editorTextFocus')

    editor.addCommand(monaco.KeyCode.UpArrow, () => {
      if (this.state.running) return

      const { oldInputIndex } = this.state
      const { lines } = this.props

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
    }, 'editorTextFocus && !suggestWidgetVisible')

    editor.addCommand(monaco.KeyCode.DownArrow, () => {
      if (this.state.running) return

      const { oldInputIndex } = this.state
      const { lines } = this.props

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
    }, 'editorTextFocus && !suggestWidgetVisible')

    editor.onDidAttemptReadOnlyEdit((e) => {
      if (this.props.disabled) {
        showMessage(this.editor, 'Wait for the program to finish executing or pause it to use the REPL.')
      } else {
        showMessage(this.editor, 'Cancel the previous program to run a new one.')
      }
    })
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.lines !== this.props.lines) {
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
   */
  layout () {
    this.editor.layout({
      width: this._rootRef.clientWidth,
      height: this.props.fontSize
    })
  }

  /**
   * Set the REPL input and move the cursor to the end.
   * @public
   * @param {string} line Input line
   */
  setInput (line) {
    this.editor.getModel().setValue(line)
    const endOfLine = { column: line.length + 1, lineNumber: 1 }
    this.editor.focus()
    this.editor.setPosition(endOfLine)
    this.editor.revealPosition(endOfLine)
  }

  handleClick = () => {
    // don't focus the editor if the user is selecting text from the output, which would cancel the selection
    if (window.getSelection().toString() === '') {
      this.editor.focus()
    }
  }

  handleCancel = () => {
    this.props.runner.stop()
    this.props.onAppendLine({ type: 'output', value: this.props.runner.interpreter._stack._stack.map((obj) => obj.toString()) })
    this.setState({ running: false })
  }

  render () {
    const {
      classes,
      disabled,
      lines,
      onExecutionFinished,
      onAppendLine,
      runner,
      fontSize,
      onFontSizeChange,
      theme,
      ...other
    } = this.props

    return (
      <div
        ref={this.setRootRef}
        className={classes.root}
        onClick={this.handleClick}
        {...other}
      >
        <div className={classes.output} style={{ fontSize }} ref={this.setOutputRef}>
          {lines.map((line, i) => line.type === 'input' ? (
            <p key={i} className={classes.line}>
              &gt; <SyntaxHighlighter>{line.value}</SyntaxHighlighter>
              {i === lines.length - 1 && (<span> – <a onClick={this.handleCancel}>Cancel</a></span>)}
            </p>
          ) : line.type === 'error' ? (
            <p key={i} className={classes.error}>Error: {line.value}</p>
          ) : line.type === 'text' ? (
            <p key={i} className={classes.line}>{line.value}</p>
          ) : (
            <p key={i} className={classes.line}>
              {line.value.length === 0 ? (
                <span className={classes.emptyStack}>(empty stack)</span>
              ) : (
                <ObjectHighlighter objects={line.value} />
              )}
            </p>
          ))}
        </div>
        <OneLineEditor
          language='postfix'
          editorDidMount={this.editorDidMount}
          options={{
            fixedOverflowWidgets: true,
            acceptSuggestionOnEnter: false,
            fontSize,
            snippetSuggestions: 'none'
          }}
          fontSize={fontSize}
          onFontSizeChange={onFontSizeChange}
        />
      </div>
    )
  }
}

Repl.propTypes = {
  /** @ignore */
  classes: PropTypes.object.isRequired,
  /**
   * True to disable the REPL.
   */
  disabled: PropTypes.bool,
  /**
   * The output lines.
   */
  lines: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['input', 'error', 'text', 'output']).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.array])
  })),
  /**
   * Callback to be invoked when the execution of a command finishes.
   */
  onExecutionFinished: PropTypes.func.isRequired,
  /**
   * Callback to be invoked when a line should be added to the REPL.
   */
  onAppendLine: PropTypes.func.isRequired,
  /**
   * The PostFix runner.
   */
  runner: PropTypes.any.isRequired,
  /**
   * The font size in pixels.
   */
  fontSize: PropTypes.number.isRequired,
  /**
   * Callback to be invoked when the font size changes.
   */
  onFontSizeChange: PropTypes.func.isRequired,
  /**
   * The current theme, automatically injected.
   * @ignore
   */
  theme: PropTypes.object.isRequired
}

export default injectSheet(styles)(Repl)
