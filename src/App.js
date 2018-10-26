import React, { Component } from 'react'
import SplitLayout from 'react-splitter-layout'
import { connect } from 'react-redux'
import injectSheet, { ThemeProvider } from 'react-jss'
import { debounce } from 'throttle-debounce'
import { saveAs } from 'file-saver'
import * as types from 'postfixjs/types'
import './App.css';
import Editor from './components/Editor/Editor'
import * as actions from './actions'
import { registerBuiltIns } from './interpreter'
import * as testReporter from './interpreter/testReporter'
import Toolbar from './components/Toolbar/Toolbar'
import InputOutput from './components/InputOutput/InputOutput'
import StackViewer from './components/StackViewer/StackViewer'
import DictViewer from './components/DictViewer/DictViewer'
import Repl from './components/Repl/Repl'
import Card from './components/Card'
import Runner, { InterruptedException } from './postfix-runner/PostFixRunner'
import { positionToMonaco } from './components/Editor/monaco-integration/util'
import * as replTestReporter from './interpreter/replTestReporter'
import * as themes from './themes'
import Settings from './components/Settings/Settings'

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: 5,
    background: theme.background
  },
  toolbar: {
    padding: '0 5px'
  },
  rootSplitLayout: {
    position: 'static'
  },
  editor: {
    width: '100%',
    height: '100%'
  },
  editorCard: {
    width: 'calc(100% - 10px)',
    height: 'calc(100% - 10px)',
    position: 'absolute'
  },
  stackDict: {
    width: 'calc(100% - 10px)',
    height: 'calc(100% - 10px)',
    overflowY: 'auto',
    position: 'absolute'
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
    canStep: true,
    showSettings: false
  }
  lineHighlightDecorations = []

  constructor (props) {
    super(props)
    this.runner = new Runner({
      enableProperTailCalls: this.props.settings.enableProperTailCalls
    })
    this.replRunner = this.runner.fork()
    registerBuiltIns(this.runner.interpreter)
    this.runner.interpreter.setTestReporter(testReporter)
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

    // let the REPL use its own test reporter (the default reporter adds decorations in the editor)
    this.replRunner.interpreter = new Proxy(this.replRunner.interpreter, {
      get (target, name) {
        return name === 'testReporter' ? replTestReporter : target[name]
      }
    })
  }

  componentDidMount () {
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.settings.enableProperTailCalls !== this.props.settings.enableProperTailCalls) {
      this.runner.interpreter.options.enableProperTailCalls = this.props.settings.enableProperTailCalls
    }
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

  updateCode = (code) => {
    // close old error widgets and remove error highlighting
    this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
    this._editor.closeErrorWidget()

    // actually update the code
    this.props.dispatch(actions.setCode(code))
  }

  async run (pauseImmediately = false) {
    if (!this.runner.running) {
      this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
      this._editor.closeErrorWidget()
      this.props.dispatch(actions.setInputPosition(0))
      this.props.dispatch(actions.clearOutput())
      this.props.dispatch(actions.resetTests())

      try {
        this.setState({ running: true, paused: false })
        await this.runner.run(this.props.code, pauseImmediately)
        this.setState({ running: false })
        this.showStackAndDict()
      } catch (e) {
        this.showStackAndDict()
        if (e instanceof InterruptedException) {
          this.setState({ running: false })
          this.props.dispatch(actions.waitForInput(false))
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
    this.props.dispatch(actions.waitForInput(false))
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
          this.props.dispatch(actions.waitForInput(false))
          this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
        }
      })
    }
  }

  handleChangeBreakpoints = (breakpoints) => {
    this.runner.breakpoints = breakpoints
    this.props.onBreakpointsChange(breakpoints.slice()) // must be a different array object every time
  }

  handleInterpreterError (err) {
    this.runner.stop()
    this.setState({ error: true, running: false, canStep: true })
    this.props.dispatch(actions.waitForInput(false))

    const pos = err.origin || this.runner._lastPosition || { line: 0, col: 0 }
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
    this._editor.showErrorWidget(positionToMonaco(pos), err)
    this._editor.editor.revealRangeInCenterIfOutsideViewport(new this._editor.monaco.Range(
      pos.line + 1, pos.col + 1,
      pos.line + 1, pos.col + 1 + pos.token.length
    ))
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
    let value
    if (obj instanceof types.Flt && obj.value === Math.floor(obj.value)) {
      value = `${obj.value}.0`
    } else {
      value = obj.toString()
    }
    return {
      value,
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

  handleGridHResize = () => {
    this._editor.layout()
    this._inputOutput.layout()
  }

  handleGridVResize = () => {
    this._editor.layout()
    this._inputOutput.layout()
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

  handleShowSettings = () => this.setState({ showSettings: true })

  handleHideSettings = () => this.setState({ showSettings: false })

  handleCopyToRepl = (line) => this._repl.setInput(line)

  render() {
    const { running, paused, canStep, error, showSettings } = this.state
    const {
      classes,
      code,
      onAppendReplLine,
      replLines,
      tests,
      onThemeChange,
      onFontSizeChange,
      onProperTailCallsChange,
      settings,
      initialBreakpoints
    } = this.props
    const { fontSize } = settings

    return (
      <div
        className={classes.root}
        //style={this.state.showSettings ? { filter: 'blur(2px) saturate(0)' } : {}}
      >
        <Toolbar
          className={classes.toolbar}
          running={running}
          paused={paused}
          canPause={!error}
          canStep={canStep}
          onRun={this.runProgram}
          onPause={this.pauseProgram}
          onStop={this.stopProgram}
          onStep={this.stepProgram}
          onSave={this.handleSave}
          onOpen={this.handleOpen}
          onShowSettings={this.handleShowSettings}
        />
        <SplitLayout
          customClassName={classes.rootSplitLayout}
          percentage
          secondaryInitialSize={30}
          onSecondaryPaneSizeChange={this.handleGridVResize}
          onDragEnd={this.handleGridVResize}
        >
          <SplitLayout
            vertical
            percentage
            secondaryInitialSize={20}
            onSecondaryPaneSizeChange={this.handleGridHResize}
            onDragEnd={this.handleGridHResize}
          >
            <Card className={classes.editorCard} onClick={this.showProgramStack}>
              <Editor
                innerRef={this.setEditor}
                code={code}
                tests={tests}
                onChange={this.updateCode}
                readOnly={running}
                className={classes.editor}
                onDragOver={this.handleDragOver}
                onDrop={this.handleDrop}
                defaultBreakpoints={initialBreakpoints}
                onBreakpointsChange={this.handleChangeBreakpoints}
                fontSize={fontSize}
                onFontSizeChange={onFontSizeChange}
                onCopyToRepl={this.handleCopyToRepl}
              />
            </Card>
            <InputOutput
              innerRef={this.setInputOutput}
              output={this.props.output}
              input={this.props.input.value}
              inputPosition={this.props.input.position}
              onInputChange={this.props.onInputChange}
              isWaiting={this.props.input.isWaiting}
              readOnly={running}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              fontSize={fontSize}
              onFontSizeChange={onFontSizeChange}
            />
          </SplitLayout>
          <SplitLayout
            vertical
            percentage
            secondaryInitialSize={20}
            onSecondaryPaneSizeChange={this.handleReplResize}
          >
            <Card
              className={classes.stackDict}
              title='Stack &amp; Dictionaries'
              scrollable
            >
              <StackViewer
                stack={this.props.stack}
                invalid={running && !paused}
                fontSize={fontSize}
              />
              <DictViewer
                dicts={this.props.dicts}
                invalid={running && !paused}
                fontSize={fontSize}
              />
            </Card>
            <Card className={classes.repl} title='REPL'>
              <Repl
                innerRef={this.setRepl}
                style={{ width: '100%', height: '100%' }}
                lines={replLines}
                onAppendLine={onAppendReplLine}
                runner={this.replRunner}
                disabled={running && !paused}
                onExecutionFinished={this.handleReplExecutionFinished}
                fontSize={fontSize}
                onFontSizeChange={onFontSizeChange}
              />
            </Card>
          </SplitLayout>
        </SplitLayout>

        <Settings
          open={showSettings}
          onClose={this.handleHideSettings}
          settings={settings}
          onFontSizeChange={onFontSizeChange}
          onThemeChange={onThemeChange}
          onProperTailCallsChange={onProperTailCallsChange}
        />
      </div>
    );
  }
}

const StyledApp = injectSheet(styles)(App)

export default connect((state) => ({
  code: state.code,
  initialBreakpoints: state.breakpoints,
  input: state.input,
  output: state.output,
  stack: state.stack,
  dicts: state.dicts,
  replLines: state.replLines,
  tests: state.tests,
  settings: state.settings
}), (dispatch) => ({
  dispatch,
  onInputChange: (input) => dispatch(actions.setInput(input)),
  onAppendReplLine: (line) => dispatch(actions.addReplLine(line)),
  onFontSizeChange: (fontSize) => dispatch(actions.setFontSize(fontSize)),
  onThemeChange: (theme) => dispatch(actions.setTheme(theme)),
  onProperTailCallsChange: (enabled) => dispatch(actions.setProperTailCalls(enabled)),
  onBreakpointsChange: (breakpoints) => dispatch(actions.setBreakpoints(breakpoints))
}))((props) => (
  <ThemeProvider theme={themes[props.settings.theme]}>
    <StyledApp {...props} />
  </ThemeProvider>
))
