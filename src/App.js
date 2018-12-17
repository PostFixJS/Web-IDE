import React, { Component } from 'react'
import SplitLayout from 'react-splitter-layout'
import { connect } from 'react-redux'
import injectSheet from 'react-jss'
import cx from 'classnames'
import { saveAs } from 'file-saver'
import * as types from 'postfixjs/types'
import ThemeProvider from './ThemeProvider'
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
import { positionToMonaco, rangeToMonaco } from './components/Editor/monaco-integration/util'
import * as replTestReporter from './interpreter/replTestReporter'
import Settings from './components/Settings/Settings'
import OfflineHandler from './containers/OfflineHandler'
import ShortcutOverlay from './components/ShortcutOverlay'
import Documentation from './components/Documentation/Documentation'

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    background: theme.background
  },
  editorRoot: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: 5,
    paddingRight: 0
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
  },
  noDocumentationPanel: {
    paddingRight: 5
  }
})

class App extends Component {
  state = {
    running: false,
    paused: false,
    canStep: true,
    showSettings: false,
    showShortcuts: false
  }
  lineHighlightDecorations = []
  scrollDocsTo = null
  documentationRef = React.createRef()

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
    document.addEventListener('mousedown', this.handleClickLink)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
    document.removeEventListener('mousedown', this.handleClickLink)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.settings.enableProperTailCalls !== this.props.settings.enableProperTailCalls) {
      this.runner.interpreter.options.enableProperTailCalls = this.props.settings.enableProperTailCalls
    }

    if (prevProps.input.isWaiting !== this.props.input.isWaiting) {
      // update stack and dict while the program is waiting for input
      this.showStackAndDict()
    }

    if (!prevProps.settings.showDocumentationPanel && this.props.settings.showDocumentationPanel && this.scrollDocsTo != null) {
      this.documentationRef.current.scrollIntoView(this.scrollDocsTo)
      this.scrollDocsTo = null
    }
  }

  handleResize = () => {
    this._editor.layout()
    this._inputOutput.layout()
    this._repl.layout()
  }

  handleClickLink = (e) => {
    // this is a bit hacky, but it is the only way to make a link work in Monaco markdown currently (see https://github.com/Microsoft/monaco-editor/issues/749)
    if (e.target.tagName === 'A') {
      const dataHref = e.target.dataset.href
      if (dataHref != null && dataHref.startsWith('pfdoc|')) {
        e.preventDefault()
        e.stopPropagation()
        const [, id] = dataHref.split('|')

        if (!this.props.settings.showDocumentationPanel) {
          this.scrollDocsTo = `pfdoc-${id}`
          this.props.onToggleDocumentationPanel()
        } else {
          this.documentationRef.current.scrollIntoView(`pfdoc-${id}`)
        }
      }
    }
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
    // close old error widgets and remove error highlighting
    this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
    this._editor.closeErrorWidget()

    // actually update the code
    this.props.dispatch(actions.setCode(code))
  }

  async run (pauseImmediately = false) {
    if (!this.runner.running) { // start new execution
      this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [])
      this._editor.closeErrorWidget()
      this.props.dispatch(actions.setInputPosition(0))
      this.props.dispatch(actions.setInput(''))
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
    } else { // continue paused execution
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
        range: rangeToMonaco(pos),
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
    this._editor.editor.revealRangeInCenterIfOutsideViewport(rangeToMonaco(pos))
  }

  showInterpreterPosition (pos) {
    if (!pos) return

    this.lineHighlightDecorations = this._editor.editor.deltaDecorations(this.lineHighlightDecorations, [
      {
        range: rangeToMonaco(pos),
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
    } else if (obj instanceof types.Arr) {
      const items = obj.items.slice(0, 200)
      if (obj instanceof types.Lam) {
        value = `{ ${items.join(' ')} } lam`
      } else if (obj instanceof types.ExeArr) {
        value = `{ ${items.join(' ')} }`
      } else {
        value = `[ ${items.join(' ')} ]`
      }
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
      const file = e.dataTransfer.files[0]
      if (/\.pf$/.test(file.name)) {
        const reader = new FileReader()
        reader.onloadend = (e) => this.handleOpen(e.target.result)
        reader.readAsText(file)
      }
    }
  }

  handleShowSettings = () => this.setState({ showSettings: true })

  handleHideSettings = () => this.setState({ showSettings: false })

  handleShowShortcuts = () => this.setState({ showShortcuts: true })

  handleHideShortcuts = () => this.setState({ showShortcuts: false })

  handleCopyToRepl = (line) => this._repl.setInput(line)

  render() {
    const {
      running,
      paused,
      canStep,
      error,
      showSettings,
      showShortcuts
    } = this.state
    const {
      classes,
      code,
      onAppendReplLine,
      replLines,
      tests,
      onThemeChange,
      onFontSizeChange,
      onToggleDocumentationPanel,
      onProperTailCallsChange,
      settings,
      initialBreakpoints
    } = this.props
    const { fontSize, showDocumentationPanel } = settings

    return (
      <div
        className={classes.root}
      >
        <SplitLayout
          customClassName={classes.rootSplitLayout}
          percentage
          secondaryInitialSize={30}
          onSecondaryPaneSizeChange={this.handleResize}
          onDragEnd={this.handleResize}
        >
          <div className={cx(classes.editorRoot, { [classes.noDocumentationPanel]: !showDocumentationPanel })}>
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
              onShowKeyboardShortcuts={this.handleShowShortcuts}
              onToggleDocumentationPanel={onToggleDocumentationPanel}
            />
            <SplitLayout
              customClassName={classes.rootSplitLayout}
              percentage
              secondaryInitialSize={30}
              onSecondaryPaneSizeChange={this.handleResize}
              onDragEnd={this.handleResize}
            >
              <SplitLayout
                vertical
                percentage
                secondaryInitialSize={20}
                onSecondaryPaneSizeChange={this.handleResize}
                onDragEnd={this.handleResize}
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
                  readOnly={!running}
                  style={{ width: '100%', height: '100%', position: 'absolute' }}
                  fontSize={fontSize}
                  onFontSizeChange={onFontSizeChange}
                />
              </SplitLayout>
              <SplitLayout
                vertical
                percentage
                secondaryInitialSize={20}
                onSecondaryPaneSizeChange={this.handleResize}
                onDragEnd={this.handleResize}
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
          </div>
          {showDocumentationPanel && <Documentation innerRef={this.documentationRef} />}
        </SplitLayout>

        <Settings
          open={showSettings}
          onClose={this.handleHideSettings}
          settings={settings}
          onFontSizeChange={onFontSizeChange}
          onThemeChange={onThemeChange}
          onProperTailCallsChange={onProperTailCallsChange}
        />
        <ShortcutOverlay
          open={showShortcuts}
          onClose={this.handleHideShortcuts}
        />

        <OfflineHandler />
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
  onBreakpointsChange: (breakpoints) => dispatch(actions.setBreakpoints(breakpoints)),
  onToggleDocumentationPanel: () => dispatch(actions.toggleDocumentationPanel())
}))((props) => (
  <ThemeProvider>
    <StyledApp {...props} />
  </ThemeProvider>
))
