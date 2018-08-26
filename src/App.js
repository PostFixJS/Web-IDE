import React, { Component } from 'react'
import SplitPane from 'react-split-pane'
import { connect } from 'react-redux'
import injectSheet from 'react-jss'
import './App.css';
import Editor from './components/Editor/Editor'
import * as actions from './actions'
import Err from 'postfixjs/types/Err'
import Interpreter from 'postfixjs/Interpreter'
import Lexer from 'postfixjs/Lexer'
import { saveAs } from 'file-saver'
import { registerBuiltIns } from './interpreter'
import Toolbar from './components/Toolbar/Toolbar'
import InputOutput from './components/InputOutput/InputOutput'
import StackViewer from './components/StackViewer/StackViewer'
import DictViewer from './components/DictViewer/DictViewer'
import Repl from './components/Repl/Repl'
import Card from './components/Card'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    background: '#efefef',
    padding: 5
  },
  editor: {
    width: '100%',
    height: '100%'
  },
  editorCard: {
    width: 'calc(100% - 10px)',
    height: 'calc(100% - 10px)',
  },
  stackDict: {
    width: '100%',
    overflowY: 'auto'
  },
  repl: {
    width: 'calc(100% - 10px)',
    height: 'calc(100% - 10px)',
    position: 'absolute'
  }
}

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
  breakpoints = []

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
        // TODO check for breakpoint more efficiently?
        if (value && (value.token === 'debugger' || this.breakpoints.some(({position}) => position && position.line === value.line && position.col === value.col))) {
          this.pauseProgram()
        } else {
          this._timeoutId = setImmediate(this.step)
        }
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

  handleChangeBreakpoints = (breakpoints) => {
    this.breakpoints = breakpoints
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
    if (!pos) return

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
    this._editor.layout({ height: height - 20 })
    this._inputOutput.layout()
  }

  handleGridVResize = (width) => {
    this._editor.layout({ width: width - 20 })
    this._inputOutput.layout({ width: width - 30 })
    this._repl.layout()
  }

  handleReplResize = (height) => {
    console.log(height)
    this._repl.layout()
  }

  handleSave = () => {
    const filename = `postfix-${new Date().toISOString()}.pf`
    saveAs(new Blob([this.state.code], { type: 'text/plain;charset=utf-8' }), filename)
  }

  handleOpen = (code) => {
    this.setState({ code })
  }

  handleDragOver = (e) => {
    e.preventDefault()
  }

  handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      const reader = new FileReader()
      reader.onloadend = (e) => this.handleOpen(e.target.result)
      reader.readAsText(e.dataTransfer.files[0])
    }
  }

  render() {
    const { code, running, paused } = this.state
    const { classes } = this.props

    return (
      <div
        className={classes.root}
      >
        <Toolbar
          running={running}
          paused={paused}
          onRun={this.runProgram}
          onPause={this.pauseProgram}
          onStop={this.stopProgram}
          onStep={this.stepProgram}
          onSave={this.handleSave}
          onOpen={this.handleOpen}
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
            <Card className={classes.editorCard}>
              <Editor
                ref={this.setEditor}
                code={code}
                onChange={this.updateCode}
                readOnly={running}
                className={classes.editor}
                onDragOver={this.handleDragOver}
                onDrop={this.handleDrop}
                onBreakpointsChange={this.handleChangeBreakpoints}
              />
            </Card>
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
            onChange={this.handleReplResize}
          >
            <Card
              className={classes.stackDict}
              title='Stack &amp; Dictionaries'
              scrollable
            >
              <StackViewer
                stack={this.props.stack}
                invalid={!running || !paused}
              />
              <DictViewer
                dicts={this.props.dicts}
                invalid={!running || !paused}
              />
            </Card>
            <Card className={classes.repl} title='REPL'>
              <Repl
                ref={this.setRepl}
                style={{ width: '100%', height: '100%' }}
              />
            </Card>
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
}))(injectSheet(styles)(App))
