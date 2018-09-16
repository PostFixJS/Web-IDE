import React from 'react'
import PropTypes from 'prop-types'
import { withTheme } from 'react-jss'
import MonacoEditor from 'react-monaco-editor'
import HoverProvider from './monaco-integration/HoverProvider'
import LanguageConfiguration from './monaco-integration/LanguageConfiguration'
import MonarchTokensProvider from './monaco-integration/MonarchTokensProvider'
import CompletionItemProvider from './monaco-integration/CompletionItemProvider'
import * as snippetProviders from './monaco-integration/snippets'
import { getTokenAtOrNext, getTokenAt} from './postfixUtil'
import ConditionalBreakpointWidget from './ConditionalBreakpointWidget'
import { positionToMonaco, positionFromMonaco, showMessage } from './monaco-integration/util'
import ErrorWidget from './ErrorWidget';

class Editor extends React.Component {
  disposables = []
  breakpoints = []
  breakpointWidget = null

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
    if (prevProps.theme !== this.props.theme) {
      // Note: All editors can only use one theme at a time, so this affects all editors
      this.monaco.editor.setTheme(this.props.theme.monaco.baseTheme)
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
      editor.onMouseUp(this.handleEditorMouseUp),
      editor.addAction({
        id: 'toggle-breakpoint',
        label: 'Toggle Breakpoint',
        keybindings: [this.monaco.KeyCode.F9],
        contextMenuGroupId: '1_modification',
        run: (editor) => {
          const position = positionFromMonaco(editor.getPosition())
          const token = getTokenAtOrNext(editor.getValue(), position.line, position.col)
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
          const token = getTokenAtOrNext(editor.getValue(), position.line, position.col)
          if (token) {
            this.showBreakpointWidget(positionToMonaco(token))
          }
        }
      }),
      editor.getModel().onDidChangeDecorations(this.handleDecorationsChanged)
    )
  }

  showBreakpointWidget = (monacoPosition, breakpoint, callback) => {
    this.closeBreakpointWidget()
    const widget = new ConditionalBreakpointWidget(this.editor, ({ type, expression }) => {
      this.closeBreakpointWidget()
      if (breakpoint) { // edit the existing breakpoint
        this.unsetBreakpoint(positionFromMonaco(monacoPosition))
      }
      // add new breakpoint
      this.setBreakpoint(positionFromMonaco(monacoPosition), type, expression)
    }, breakpoint, callback ? () => callback(widget) : null)
    widget.create()
    widget.show(monacoPosition, 2)
    this.breakpointWidget = {
      widget,
      position: monacoPosition
    }
    this.editor.addCommand(this.monaco.KeyCode.Escape, this.closeBreakpointWidget)
  }

  closeBreakpointWidget = () => {
    if (this.breakpointWidget) {
      this.breakpointWidget.widget.dispose()
      if (!this.editor.isFocused()) {
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

  setBreakpoint (pos, type = 'unconditional', expression) {
    const [newBreakpoint] = this.editor.deltaDecorations([], [{
      range: new this.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1),
      options: {
        isWholeLine: false,
        beforeContentClassName: `breakpoint ${type}`,
        stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }])
    this.breakpoints.push({
      decorationId: newBreakpoint,
      position: pos,
      type,
      expression
    })
    this.props.onBreakpointsChange(this.breakpoints)
  }

  unsetBreakpoint (pos) {
    const breakpointIndex = this.breakpoints.findIndex((b) => b.position.col === pos.col && b.position.line === pos.line)
    if (breakpointIndex >= 0) {
      const breakpoint = this.breakpoints[breakpointIndex]
      this.breakpoints.splice(breakpointIndex, 1)
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
    if (e.event.leftButton && e.target.element.classList.contains('breakpoint')) {
      const breakpointPos = positionFromMonaco(e.target.position)

      if (e.event.shiftKey) {
        this.unsetBreakpoint(breakpointPos)
        return
      }

      const breakpoint = this.breakpoints.find(({ position }) => position.col === breakpointPos.col && position.line === breakpointPos.line)
      if (breakpoint.type === 'unconditional') {
        this.unsetBreakpoint(breakpointPos)
      } else {
        this.showBreakpointWidget(e.target.position, breakpoint)
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
      const token = getTokenAt(code, decorationRange.startLineNumber - 1, decorationRange.startColumn - 1)
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
        beforeContentClassName: `breakpoint ${breakpoint.type}`,
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

  setRootRef = (ref) => this._rootRef = ref

  /**
   * Update the size of the editor.
   * @public
   * @param {object} dimensions New width and height (both optional, default to the size of this component)
   */
  layout (dimensions = {}) {
    this.editor.layout({
      width: dimensions.width || this._rootRef.clientWidth,
      height: dimensions.height || this._rootRef.clientHeight
    })
  }

  render () {
    const {
      code,
      innerRef,
      onBreakpointsChange,
      onChange,
      readOnly,
      theme,
      ...other
    } = this.props

    return (
      <div
        ref={this.setRootRef}
        {...other}
      >
        <MonacoEditor
          editorWillMount={this.editorWillMount}
          editorDidMount={this.editorDidMount}
          language='postfix'
          value={code}
          onChange={onChange}
          options={{ theme: this.props.theme.monaco.baseTheme }}
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
  onBreakpointsChange: PropTypes.func.isRequired,
  innerRef: PropTypes.func,
}

export default withTheme(Editor)
