import React, { Component } from 'react'
import SplitPane from 'react-split-pane'
import { connect } from 'react-redux'
import './App.css';
import Editor from './components/Editor/Editor'
import Lexer from 'postfixjs/Lexer'
import Err from 'postfixjs/types/Err'
import Interpreter from 'postfixjs/Interpreter'
import { registerBuiltIns } from './interpreter'
import InputOutput from './components/InputOutput/InputOutput';

class App extends Component {
  state = {
    code: `1 i! {
  i println
  i 1 + i!
} loop`,
    running: false,
    paused: false
  }
  interpreter = new Interpreter()
  lineHighlightDecorations = []

  constructor (props) {
    super(props)
    registerBuiltIns(this.interpreter)
  }

  setEditor = (ref) => {
    this.editor = ref
  }

  updateCode = (code) => {
    this.setState({ code })
  }

  step = () => {
    try {
      const { done, value } = this.interpreter.step()
      this.setState({ interpreterPosition: value })
      if (done) {
        this.setState({ running: false })
        console.log(this.interpreter._stack._stack.map((obj) => obj.toString()).join(', '))
      } else {
        this._timeoutId = setTimeout(this.step, 0)
      }
      return value
    } catch (e) {
      if (e instanceof Err) {
        this.handleInterpreterError(e)
      } else {
        throw e
      }
    }
  }

  runProgram = (pauseImmediately = false) => {
    if (!this.state.running) {
      const lexer = new Lexer()
      lexer.put(this.state.code)
      this.interpreter.reset()
      this.interpreter.startRun(lexer.getTokens())
    } else {
      this.lineHighlightDecorations = this.editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
    }

    if (pauseImmediately === true) {
      this.setState({ running: true, paused: true })
    } else {
      this.setState({ running: true, paused: false })
      this._timeoutId = setTimeout(this.step, 0)
    }
  }

  stopProgram = () => {
    clearTimeout(this._timeoutId)
    this.setState({ running: false })
    this.lineHighlightDecorations = this.editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
  }

  pauseProgram = () => {
    const pos = this.state.interpreterPosition
    this.lineHighlightDecorations = this.editor.editor.deltaDecorations(this.lineHighlightDecorations, [
      {
        range: new this.editor.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
        options: {
          isWholeLine: false,
          className: "pauseTokenHighlight"
        }
      },
      {
        range: new this.editor.monaco.Range(pos.line + 1, 1, pos.line + 1, 1),
        options: {
          isWholeLine: true,
          className: "pauseLineHighlight"
        }
      }
    ])
    clearTimeout(this._timeoutId)
    this.setState({ paused: true })
  }

  stepProgram = () => {
    if (!this.state.running) {
      this.runProgram(true)
    }

    try {
      const { done, value: pos } = this.interpreter.step()
      this.setState({ interpreterPosition: pos })
      if (done) {
        this.setState({ running: false })
        console.log(this.interpreter._stack._stack.map((obj) => obj.toString()).join(', '))
      }

      this.lineHighlightDecorations = this.editor.editor.deltaDecorations(this.lineHighlightDecorations, [
        {
          range: new this.editor.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
          options: {
            isWholeLine: false,
            className: "pauseTokenHighlight"
          }
        },
        {
          range: new this.editor.monaco.Range(pos.line + 1, 1, pos.line + 1, 1),
          options: {
            isWholeLine: true,
            className: "pauseLineHighlight"
          }
        }
      ])
    } catch (e) {
      if (e instanceof Err) {
        this.handleInterpreterError(e)
      } else {
        throw e
      }
    }
  }

  handleInterpreterError (err) {
    const pos = err.origin
    this.lineHighlightDecorations = this.editor.editor.deltaDecorations(this.lineHighlightDecorations, [
      {
        range: new this.editor.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
        options: {
          isWholeLine: false,
          className: "errorTokenHighlight"
        }
      },
      {
        range: new this.editor.monaco.Range(pos.line + 1, 1, pos.line + 1, 1),
        options: {
          isWholeLine: true,
          className: "errorLineHighlight"
        }
      }
    ])
  }

  handleGridResize = (width) => {
    this.editor.layout({ width: Math.floor(width) })
  }

  render() {
    const { code, running, paused } = this.state

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <SplitPane
          split='vertical'
          minSize={300}
          defaultSize={Math.floor(0.5 * window.innerWidth)}
          onChange={this.handleGridResize}
          onDragFinished={this.handleGridResize}
          style={{ height: 'auto', position: 'static' }}
        >
          <Editor
            ref={this.setEditor}
            code={code}
            onChange={this.updateCode}
            readOnly={running}
            style={{ width: '100%', height: '100%' }}
          />
          <InputOutput
            value={this.props.output}
            style={{ width: '100%', height: '100%' }}
          />
        </SplitPane>
        <div>
          <button
            onClick={this.runProgram}
            disabled={running && !paused}
          >
            Run
          </button>
          <button
            onClick={this.pauseProgram}
            disabled={!running || paused}
          >
            Pause
          </button>
          <button
            onClick={this.stepProgram}
            disabled={!paused && running}
          >
            Step
          </button>
          <button
            onClick={this.stopProgram}
            disabled={!running}
          >
            Stop
          </button>
        </div>
      </div>
    );
  }
}

export default connect((state) => ({
  output: state.output
}))(App)
