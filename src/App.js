import React, { Component } from 'react'
import SplitPane from 'react-split-pane'
import { connect } from 'react-redux'
import './App.css';
import Editor from './components/Editor/Editor'
import * as actions from './actions'
import Lexer from 'postfixjs/Lexer'
import Err from 'postfixjs/types/Err'
import Interpreter from 'postfixjs/Interpreter'
import { registerBuiltIns } from './interpreter'
import InputOutput from './components/InputOutput/InputOutput'
import StackViewer from './components/StackViewer/StackViewer'
import DictViewer from './components/DictViewer/DictViewer'

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
    this._editor = ref
  }

  setInputOutput = (ref) => {
    this._inputOutput = ref
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
        this.showStack()
        console.log(this.interpreter._stack._stack.map((obj) => obj.toString()).join(', '))
      } else {
        this._timeoutId = setImmediate(this.step)
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
      this.props.dispatch({ type: actions.CLEAR_OUTPUT })
      this.interpreter.reset()
      this.interpreter.startRun(lexer.getTokens())
    } else {
      this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
    }

    if (pauseImmediately === true) {
      this.setState({ running: true, paused: true })
    } else {
      this.setState({ running: true, paused: false })
      this._timeoutId = setImmediate(this.step)
    }
  }

  stopProgram = () => {
    clearImmediate(this._timeoutId)
    this.setState({ running: false })
    this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
  }

  pauseProgram = () => {
    this.showInterpreterPosition(this.state.interpreterPosition)
    this.showStack()
    clearImmediate(this._timeoutId)
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
        this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
      } else {
        this.showInterpreterPosition(pos)
      }
      this.showStack()
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
    this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [
      {
        range: new this._editor.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
        options: {
          isWholeLine: false,
          className: "errorTokenHighlight",
          hoverMessage: { value: `Error: ${err.message}` }
        }
      },
      {
        range: new this._editor.monaco.Range(pos.line + 1, 1, pos.line + 1, 1),
        options: {
          isWholeLine: true,
          className: "errorLineHighlight"
        }
      }
    ])
  }

  showInterpreterPosition (pos) {
    this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [
      {
        range: new this._editor.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
        options: {
          isWholeLine: false,
          className: "pauseTokenHighlight"
        }
      },
      {
        range: new this._editor.monaco.Range(pos.line + 1, 1, pos.line + 1, 1),
        options: {
          isWholeLine: true,
          className: "pauseLineHighlight"
        }
      }
    ])
  }

  showStack () {
    this.props.dispatch(actions.setStack(this.interpreter._stack.getElements().map((obj) => ({
      value: obj.toString(),
      type: obj.getTypeName()
    }))))

    this.props.dispatch(actions.setDicts(this.interpreter._dictStack.getDicts().map((dict) => {
      return Object.entries(dict).map(([name, value]) => ({
        name,
        value: value.toString(),
        type: value.getTypeName()
      })).sort((a, b) => a.name.localeCompare(b.name))
    }).reverse()))
  }

  handleGridHResize = (height) => {
    this._editor.layout({ height })
    this._inputOutput.layout()
  }

  handleGridVResize = (width) => {
    this._editor.layout({ width })
    this._inputOutput.layout({ width })
  }

  render() {
    const { code, running, paused } = this.state

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <SplitPane
          split='vertical'
          minSize={300}
          defaultSize={Math.floor(0.7 * window.innerWidth)}
          onChange={this.handleGridVResize}
          onDragFinished={this.handleGridVResize}
          style={{ height: 'auto', position: 'static' }}
        >
          <SplitPane
            split='horizontal'
            minSize={300}
            defaultSize={Math.floor(0.8 * window.innerHeight)}
            onChange={this.handleGridHResize}
            onDragFinished={this.handleGridHResize}
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
              ref={this.setInputOutput}
              value={this.props.output}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          </SplitPane>
          <div>
            <StackViewer
              stack={this.props.stack}
              invalid={!running || !paused}
            />
            <DictViewer
              dicts={this.props.dicts}
              invalid={!running || !paused}
            />
          </div>
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
  output: state.output,
  stack: state.stack,
  dicts: state.dicts
}))(App)
