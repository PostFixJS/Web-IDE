import React, { Component } from 'react'
import SplitPane from 'react-split-pane'
import { connect } from 'react-redux'
import './App.css';
import Editor from './components/Editor/Editor'
import * as actions from './actions'
import Err from 'postfixjs/types/Err'
import Interpreter from 'postfixjs/Interpreter'
import Lexer from 'postfixjs/Lexer'
import { registerBuiltIns } from './interpreter'
import Toolbar from './components/Toolbar/Toolbar'
import InputOutput from './components/InputOutput/InputOutput'
import StackViewer from './components/StackViewer/StackViewer'
import DictViewer from './components/DictViewer/DictViewer'
import Repl from './components/Repl/Repl'

class App extends Component {
  state = {
    code: `fac_tr: (n :Int, acc :Int -> :Int) {
    n 1 >
    { acc n * n 1 - swap fac_tr }
    { acc } if
} fun

#<
Calculate the factorial of a number.
@param n A number
@return Factorial of n
>#
fac: (n :Int -> :Int) {
    n 1 fac_tr
} fun

6 fac
`,
    running: false,
    paused: false
  }
  interpreter = new Interpreter()
  lineHighlightDecorations = []

  constructor (props) {
    super(props)
    registerBuiltIns(this.interpreter)
  }

  componentDidMount () {
    this.updateCode(this.state.code)
  }

  setEditor = (ref) => {
    this._editor = ref
  }

  setInputOutput = (ref) => {
    this._inputOutput = ref
  }

  setRepl = (ref) => {
    this._repl = ref
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
    this._repl.layout()
  }

  render() {
    const { code, running, paused } = this.state

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <Toolbar
          running={running}
          paused={paused}
          onRun={this.runProgram}
          onPause={this.pauseProgram}
          onStop={this.stopProgram}
          onStep={this.stepProgram}
        />
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
              innerRef={this.setInputOutput}
              output={this.props.output}
              input={this.props.input.value}
              inputPosition={this.props.input.position}
              onInputChange={this.props.onInputChange}
              readOnly={running}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          </SplitPane>
          <SplitPane
            split='horizontal'
            minSize={300}
            defaultSize={Math.floor(0.8 * window.innerHeight)}
            style={{ height: 'auto', position: 'static' }}
          >
            <div style={{ width: '100%', overflowY: 'auto' }}>
              <StackViewer
                stack={this.props.stack}
                invalid={!running || !paused}
              />
              <DictViewer
                dicts={this.props.dicts}
                invalid={!running || !paused}
              />
            </div>
            <Repl
              ref={this.setRepl}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          </SplitPane>
        </SplitPane>
      </div>
    );
  }
}

export default connect((state) => ({
  input: state.input,
  output: state.output,
  stack: state.stack,
  dicts: state.dicts
}), (dispatch) => ({
  dispatch,
  onInputChange: (input) => dispatch(actions.setInput(input))
}))(App)
