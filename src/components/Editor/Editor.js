import React from 'react'
import PropTypes from 'prop-types'
import { withTheme } from 'react-jss'
import MonacoEditor from 'react-monaco-editor'
import * as monaco from 'monaco-editor'
import HoverProvider from './monaco-integration/HoverProvider'
import LanguageConfiguration from './monaco-integration/LanguageConfiguration'
import MonarchTokensProvider from './monaco-integration/MonarchTokensProvider'
import CompletionItemProvider from './monaco-integration/CompletionItemProvider'
import * as snippetProviders from './monaco-integration/snippets'
import { getTokenAtOrNext, getTokenAt } from './postfixUtil'
import ConditionalBreakpointWidget from './ConditionalBreakpointWidget'
import { positionToMonaco, positionFromMonaco, showMessage } from './monaco-integration/util'
import ErrorWidget from './ErrorWidget'
import { getTestResultMessage } from './tests'

class Editor extends React.Component {
  _rootRef = React.createRef()
  disposables = []
  breakpoints = []
  breakpointWidget = null
  testDecorations = []

  componentDidMount () {
    window.addEventListener('resize', this.updateEditorSize)
    if (this.props.innerRef) this.props.innerRef(this)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateEditorSize)
    this.disposables.forEach((d) => d.dispose())
    if (this.props.innerRef) this.props.innerRef(null)
  }
  
  updateEditorSize = () => this.editor.layout()

  componentDidUpdate (prevProps) {
    if (prevProps.readOnly !== this.props.readOnly) {
      this.editor.updateOptions({
        readOnly: this.props.readOnly
      })
    }
    if (prevProps.fontSize !== this.props.fontSize) {
      this.editor.updateOptions({
        fontSize: this.props.fontSize
      })
    }
    if (prevProps.theme !== this.props.theme) {
      // Note: All editors can only use one theme at a time, so this affects all editors
      this.monaco.editor.setTheme(this.props.theme.monaco.baseTheme)
    }
    if (prevProps.code !== this.props.code) {
      this.testDecorations = this.editor.deltaDecorations(this.testDecorations, [])
    }
    if (prevProps.tests !== this.props.tests) {
      this.testDecorations = this.editor.deltaDecorations(this.testDecorations, this.props.tests.map((test) => {
        const { position: pos } = test
        return {
          range: new this.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + test.type.length + 1),
          options: {
            isWholeLine: false,
            className: `test ${test.passed ? 'passed' : 'failed'}`,
            afterContentClassName: `testIcon ${test.passed ? 'passed' : 'failed'}`,
            stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            hoverMessage: { value: getTestResultMessage(test) }
          }
        }
      }))
    }
  }

  editorWillMount = (monaco) => {
    this.monaco = monaco
    monaco.languages.register({ id: 'postfix' })
    monaco.languages.setMonarchTokensProvider('postfix', MonarchTokensProvider)
    monaco.languages.setLanguageConfiguration('postfix', LanguageConfiguration)
    monaco.languages.registerHoverProvider('postfix', HoverProvider)
    monaco.languages.registerCompletionItemProvider('postfix', CompletionItemProvider)
    for (const provider of Object.values(snippetProviders)) {
      monaco.languages.registerCompletionItemProvider('postfix', provider)
    }
  }

  editorDidMount = (editor) => {
    this.editor = editor
    editor.updateOptions({
      readOnly: this.props.readOnly
    })
    this.disposables.push(
      editor.onDidAttemptReadOnlyEdit((e) => {
        showMessage(this.editor, 'You need to stop the program to edit the code.')
      }),
      editor.onKeyDown((e) => {
        // onDidAttemptReadOnlyEdit is not triggered when pressing del/backspace
        if (this.props.readOnly && (e.keyCode === monaco.KeyCode.Delete || e.keyCode === monaco.KeyCode.Backspace)) {
          showMessage(this.editor, 'You need to stop the program to edit the code.')
        }
      }),
      editor.onMouseUp(this.handleEditorMouseUp),
      editor.addAction({
        id: 'toggle-breakpoint',
        label: 'Toggle Breakpoint',
        keybindings: [this.monaco.KeyCode.F9],
        contextMenuGroupId: '1_modification',
        run: (editor) => {
          const position = positionFromMonaco(editor.getPosition())
          const token = getTokenAtOrNext(editor.getValue(), position, { includeEndOfToken: true })
          if (token) {
            this.toggleBreakpoint({ line: token.line, col: token.col })
          }
        }
      }),
      editor.addAction({
        id: 'add-conditional-breakpoint',
        label: 'Add Conditional Breakpoint',
        keybindings: [this.monaco.KeyCode.F10],
        contextMenuGroupId: '1_modification',
        run: (editor) => {
          const position = positionFromMonaco(editor.getPosition())
          const token = getTokenAtOrNext(editor.getValue(), position, { includeEndOfToken: true })
          if (token) {
            this.showBreakpointWidget(positionToMonaco(token), this.getBreakpoint(token))
          }
        }
      }),
      editor.addAction({
        id: 'copy-line-to-repl',
        label: 'Copy Line to REPL',
        keybindings: [this.monaco.KeyMod.CtrlCmd | this.monaco.KeyMod.Shift | this.monaco.KeyCode.KEY_C],
        contextMenuGroupId: '9_cutcopypaste',
        contextMenuOrder: 3,
        run: (editor) => {
          const position = editor.getPosition()
          const line = editor.getModel().getLineContent(position.lineNumber)
          this.props.onCopyToRepl(line.trim())
        }
      }),
      editor.getModel().onDidChangeDecorations(this.handleDecorationsChanged),
      editor.onDidChangeConfiguration(() => {
        if (this.props.onFontSizeChange) {
          const fontSize = editor.getConfiguration().fontInfo.fontSize
          if (fontSize !== this.props.fontSize) {
            this.props.onFontSizeChange(fontSize)
          }
        }
      })
    )

    // set default breakpoints
    for (const breakpoint of this.props.defaultBreakpoints) {
      this.setBreakpoint(breakpoint.position, breakpoint.type, breakpoint.expression)
    }
  }

  showBreakpointWidget = (monacoPosition, breakpoint, callback) => {
    this.closeBreakpointWidget()
    const widget = new ConditionalBreakpointWidget(this.editor, {
      onAccept: ({ type, expression }) => {
        this.closeBreakpointWidget()
        if (breakpoint) { // edit the existing breakpoint
          this.unsetBreakpoint(positionFromMonaco(monacoPosition))
        }
        // add new breakpoint
        this.setBreakpoint(positionFromMonaco(monacoPosition), type, expression)
      },
      onRemove: () => {
        if (breakpoint) {
          // editing an existing breakpoint, remove it
          this.unsetBreakpoint(breakpoint.position)
        } else {
          // creating a new breakpoint, close the widget
          this.closeBreakpointWidget()
        }
      },
      breakpoint,
      onMounted: callback ? () => callback(widget) : null
    })
    widget.create()
    widget.show(monacoPosition, 2)
    this.breakpointWidget = {
      breakpoint,
      widget,
      position: monacoPosition
    }
    this.editor.addCommand(this.monaco.KeyCode.Escape, this.closeBreakpointWidget)
  }

  closeBreakpointWidget = () => {
    if (this.breakpointWidget) {
      this.breakpointWidget.widget.dispose()
      if (!this.editor.hasTextFocus()) {
        this.editor.setPosition(this.breakpointWidget.position)
        this.editor.focus()
      }
      this.breakpointWidget = null
    }
  }

  showErrorWidget = (monacoPosition, error) => {
    this.closeErrorWidget()
    this.errorWidget = new ErrorWidget(this.editor, error, this.closeErrorWidget)
    this.errorWidget.create()
    this.errorWidget.show(monacoPosition, 2)
  }

  closeErrorWidget = () => {
    if (this.errorWidget) {
      this.errorWidget.dispose()
      this.errorWidget = null
    }
  }


  /**
   * Get the ID of the next breakpoint.
   */
  _generateBreakpointId = (() => {
    let id = 0
    return () => id++
  })()

  /**
   * Add a breakpoint.
   * @param {Position} pos Token position
   * @param {string} type Type of the breakpoint (unconditional, expression or hit)
   * @param {(string|number)} expression Expression or hit count
   */
  setBreakpoint (pos, type = 'unconditional', expression) {
    const id = `${this._generateBreakpointId()}`
    const [newBreakpoint] = this.editor.deltaDecorations([], [{
      range: new this.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1),
      options: {
        isWholeLine: false,
        beforeContentClassName: `breakpoint ${type} bp-${id}`,
        stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }])
    this.breakpoints.push({
      id,
      decorationId: newBreakpoint,
      position: pos,
      type,
      expression
    })
    this.props.onBreakpointsChange(this.breakpoints)
  }

  /**
   * Get the breakpoint at the given token position.
   * @param {object} pos Token position
   * @returns {object} Breakpoint at the given token position or null if no breakpoint found
   */
  getBreakpoint (pos) {
    return this.breakpoints.find((b) => b.position.col === pos.col && b.position.line === pos.line)
  }

  /**
   * Remove the breakpoint at the given token position.
   * @param {object} pos Token position
   * @returns {boolean} True if a breakpoint was removed, false if there was no breakpoint to remove
   */
  unsetBreakpoint (pos) {
    const breakpoint = this.getBreakpoint(pos)
    if (breakpoint) {
      if (this.breakpointWidget != null && this.breakpointWidget.breakpoint === breakpoint) {
        this.closeBreakpointWidget()
      }
      this.breakpoints.splice(this.breakpoints.indexOf(breakpoint), 1)
      this.editor.deltaDecorations([breakpoint.decorationId], [])
      this.props.onBreakpointsChange(this.breakpoints)
      return true
    }
    return false
  }

  toggleBreakpoint (pos) {
    if (!this.unsetBreakpoint(pos)) {
      this.setBreakpoint(pos)
    }
  }

  handleEditorMouseUp = (e) => {
    if (e.event.leftButton && e.event.browserEvent.target.classList.contains('breakpoint')) {
      // In Firefox, the event doesn't contain the position, so the breakpoint ID is put into the inline classname.
      // This is a bit hacky, but it works.
      const id = Array.prototype.find.call(e.event.browserEvent.target.classList, (c) => c.indexOf('bp-') === 0)
      const breakpoint = this.breakpoints.find((breakpoint) => breakpoint.id === id.substr(3))

      if (e.event.shiftKey) {
        this.unsetBreakpoint(breakpoint.position)
        return
      }

      if (breakpoint.type === 'unconditional') {
        this.unsetBreakpoint(breakpoint.position)
      } else {
        this.showBreakpointWidget(positionToMonaco(breakpoint.position), breakpoint)
      }
    }
  }

  handleDecorationsChanged = () => {
    const code = this.editor.getValue()
    let changes = false
    const newBreakpoints = []
    const removeBreakpoints = []

    for (let i = 0; i < this.breakpoints.length; i++) {
      const breakpoint = this.breakpoints[i]
      const decorationRange = this.editor.getModel().getDecorationRange(breakpoint.decorationId)
      const token = getTokenAt(code, { line: decorationRange.startLineNumber - 1, col: decorationRange.startColumn - 1 })
      if (token) {
        if (breakpoint.position.col !== token.col || breakpoint.position.line !== token.line) {
          // breakpoint has moved, update it
          breakpoint.position = {
            col: token.col,
            line: token.line
          }
          newBreakpoints.push(breakpoint)
          removeBreakpoints.push(breakpoint.decorationId)
          changes = true
        }
      } else {
        // breakpoint is not valid anymore
        this.breakpoints.splice(i, 1)
        removeBreakpoints.push(breakpoint.decorationId)
        changes = true
      }
    }

    this.editor.deltaDecorations(removeBreakpoints, newBreakpoints.map((breakpoint) => ({
      range: new this.monaco.Range(
        breakpoint.position.line + 1, breakpoint.position.col + 1,
        breakpoint.position.line + 1, breakpoint.position.col + 1),
      options: {
        isWholeLine: false,
        beforeContentClassName: `breakpoint ${breakpoint.type} bp-${breakpoint.id}`,
        stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    })))
      .forEach((decorationId, i) => {
        newBreakpoints[i].decorationId = decorationId
      })

    if (changes) {
      this.props.onBreakpointsChange(this.breakpoints)
    }
  }

  /**
   * Update the size of the editor.
   * @public
   */
  layout () {
    this.editor.layout({
      width: this._rootRef.current.clientWidth,
      height: this._rootRef.current.clientHeight
    })
  }

  render () {
    const {
      code,
      innerRef,
      defaultBreakpoints,
      onBreakpointsChange,
      onChange,
      onFontSizeChange,
      readOnly,
      tests,
      theme,
      fontSize,
      onCopyToRepl,
      ...other
    } = this.props

    return (
      <div
        ref={this._rootRef}
        {...other}
      >
        <MonacoEditor
          editorWillMount={this.editorWillMount}
          editorDidMount={this.editorDidMount}
          language='postfix'
          value={code}
          onChange={onChange}
          options={{
            theme: this.props.theme.monaco.baseTheme,
            fontSize, 
            fixedOverflowWidgets: true
          }}
        />
      </div>
    )
  }
}

Editor.defaultProps = {
  readOnly: false
}

Editor.propTypes = {
  code: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  defaultBreakpoints: PropTypes.array.isRequired,
  onBreakpointsChange: PropTypes.func.isRequired,
  onFontSizeChange: PropTypes.func.isRequired,
  innerRef: PropTypes.func,

  /**
   * Function that is called when a line should be copied to the REPL.
   */
  onCopyToRepl: PropTypes.func.isRequired 
}

export default withTheme(Editor)
