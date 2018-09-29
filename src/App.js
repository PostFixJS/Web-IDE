import React, { Component } from 'react'
import SplitPane from 'react-split-pane'
import { connect } from 'react-redux'
import injectSheet, { ThemeProvider } from 'react-jss'
import { debounce } from 'throttle-debounce'
import { saveAs } from 'file-saver'
import * as types from 'postfixjs/types'
import './App.css';
import Editor from './components/Editor/Editor'
import * as actions from './actions'
import { registerBuiltIns } from './interpreter'
import Toolbar from './components/Toolbar/Toolbar'
import InputOutput from './components/InputOutput/InputOutput'
import StackViewer from './components/StackViewer/StackViewer'
import DictViewer from './components/DictViewer/DictViewer'
import Repl from './components/Repl/Repl'
import Card from './components/Card'
import Runner, { InterruptedException } from './postfix-runner/PostFixRunner'
import { positionToMonaco } from './components/Editor/monaco-integration/util'
import * as themes from './themes'

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    background: theme.background
  },
  toolbar: {
    padding: '5px 5px 0'
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
})

class App extends Component {
  state = {
    running: false,
    paused: false,
    canStep: true
  }
  runner = new Runner()
  replRunner = this.runner.fork()
  lineHighlightDecorations = []

  constructor (props) {
    super(props)
    registerBuiltIns(this.runner.interpreter)
    this.runner.on('position', (position) => {
      if (this.state.paused && this.runner.running) {
        this.setState({ interpreterPosition: position })
        this.showInterpreterPosition(position)
        this.showStackAndDict()
      }
    })
    this.runner.on('pause', (position) => {
      this.showInterpreterPosition(position)
      this.showStackAndDict()
      this.setState({ running: true, paused: true })
    })
    this.runner.on('continue', () => this.setState({ running: true, paused: false }))
  }

  componentDidMount () {
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  handleResize = debounce(200, () => {
    this._editor.layout()
    this._inputOutput.layout()
    this._repl.layout()
  })

  setEditor = (ref) => {
    this._editor = ref
  }

  setInputOutput = (ref) => {
    this._inputOutput = ref
  }

  setRepl = (ref) => {
    this._repl = ref
  }

  updateCode = debounce(200, (code) => {
    this.props.dispatch(actions.setCode(code))
  })

  async run (pauseImmediately = false) {
    if (!this.runner.running) {
      this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
      this._editor.closeErrorWidget()
      this.props.dispatch(actions.setInputPosition(0))
      this.props.dispatch(actions.clearOutput())

      try {
        this.setState({ running: true, paused: false })
        await this.runner.run(this.props.code, pauseImmediately)
        this.setState({ running: false })
        this.showStackAndDict()
      } catch (e) {
        this.showStackAndDict()
        if (e instanceof InterruptedException) {
          this.setState({ running: false })
        } else {
          if (e.breakpoint != null) {
            this._editor.showBreakpointWidget(positionToMonaco(e.breakpoint.position), e.breakpoint, (widget) => {
              widget.showError(e)
            })
          } else {
            this.handleInterpreterError(e)
          }
        }
      }
    } else {
      this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
      this.runner.continue()
    }
  }

  runProgram = () => this.run(false)

  stopProgram = () => {
    this.runner.stop()
    this.setState({ running: false, canStep: true, error: false })
    this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
    this._editor.closeErrorWidget()
  }

  pauseProgram = () => this.runner.pause()

  stepProgram = () => {
    if (!this.runner.running) {
      this.run(true)
    } else {
      this.setState({ canStep: false }, async () => {
        await this.runner.step()
        if (this.runner.running) {
          this.setState({ canStep: true })
        } else {
          this.setState({ running: false, canStep: true, error: false })
          this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
        }
      })
    }
  }

  handleChangeBreakpoints = (breakpoints) => {
    this.runner.breakpoints = breakpoints
  }

  handleInterpreterError (err) {
    this.setState({ error: true })
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
    this._editor.showErrorWidget(positionToMonaco(err.origin), err)
    this._editor.editor.revealLine(pos.line + 3) // 2 lines further down so that the widget is fully visible
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
    this._editor.editor.revealLine(pos.line + 1)
  }

  static mapObjectForViewer (obj) {
    return {
      value: obj.toString(),
      children: obj instanceof types.Arr ? obj.items.map(App.mapObjectForViewer) : null,
      type: obj.getTypeName()
    }
  }

  showStackAndDict () {
    this.props.dispatch(actions.setStack(this.runner.interpreter._stack.getElements().map(App.mapObjectForViewer).reverse()))

    this.props.dispatch(actions.setDicts(this.runner.interpreter._dictStack.getDicts().map((dict) => {
      return Object.entries(dict).map(([name, value]) => ({
        name,
        ...App.mapObjectForViewer(value)
      })).sort((a, b) => a.name.localeCompare(b.name))
    }).reverse()))
  }

  handleReplExecutionFinished = () => {
    this.showStackAndDict()
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
    this._repl.layout()
  }

  handleSave = () => {
    const filename = `postfix-${new Date().toISOString()}.pf`
    saveAs(new Blob([this.props.code], { type: 'text/plain;charset=utf-8' }), filename)
  }

  handleOpen = (code) => {
    this.props.dispatch(actions.setCode(code))
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
    const { running, paused, canStep, error } = this.state
    const { classes, code, onToggleTheme, theme } = this.props

    return (
      <div
        className={classes.root}
      >
        <Toolbar
          className={classes.toolbar}
          running={running}
          paused={paused}
          canPause={!error}
          canStep={canStep && !error}
          onRun={this.runProgram}
          onPause={this.pauseProgram}
          onStop={this.stopProgram}
          onStep={this.stepProgram}
          onSave={this.handleSave}
          onOpen={this.handleOpen}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
        <SplitPane
          split='vertical'
          minSize={300}
          defaultSize={Math.floor(0.7 * window.innerWidth)}
          onChange={this.handleGridVResize}
          onDragFinished={this.handleGridVResize}
          style={{ height: 'auto', position: 'static', overflow: 'visible' }}
        >
          <SplitPane
            split='horizontal'
            minSize={300}
            defaultSize={Math.floor(0.8 * window.innerHeight)}
            onChange={this.handleGridHResize}
            onDragFinished={this.handleGridHResize}
            style={{ height: 'auto', position: 'static', overflow: 'visible' }}
          >
            <Card className={classes.editorCard} onClick={this.showProgramStack}>
              <Editor
                innerRef={this.setEditor}
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
            style={{ height: 'auto', position: 'static', overflow: 'visible' }}
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
                innerRef={this.setRepl}
                style={{ width: '100%', height: '100%' }}
                runner={this.replRunner}
                disabled={running && !paused}
                onExecutionFinished={this.handleReplExecutionFinished}
              />
            </Card>
          </SplitPane>
        </SplitPane>
      </div>
    );
  }
}

const StyledApp = injectSheet(styles)(App)

export default connect((state) => ({
  code: state.code,
  input: state.input,
  output: state.output,
  stack: state.stack,
  dicts: state.dicts,
  theme: state.settings.theme
}), (dispatch) => ({
  dispatch,
  onInputChange: (input) => dispatch(actions.setInput(input)),
  onToggleTheme: () => dispatch(actions.toggleTheme())
}))((props) => (
  <ThemeProvider theme={themes[props.theme]}>
    <StyledApp {...props} />
  </ThemeProvider>
))
