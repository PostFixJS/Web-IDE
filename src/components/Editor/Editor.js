import React from 'react'
import PropTypes from 'prop-types'
import MonacoEditor from 'react-monaco-editor'
import { MessageController } from 'monaco-editor/esm/vs/editor/contrib/message/messageController'
import HoverProvider from './monaco-integration/HoverProvider'
import LanguageConfiguration from './monaco-integration/LanguageConfiguration'
import MonarchTokensProvider from './monaco-integration/MonarchTokensProvider'
import CompletionItemProvider from './monaco-integration/CompletionItemProvider'
import * as snippetProviders from './monaco-integration/snippets'
import { getTokenAtOrNext, getTokenAt} from './postfixUtil'
import ConditionalBreakpointWidget from './ConditionalBreakpointWidget'

export default class Editor extends React.Component {
  disposables = []
  breakpoints = []
  breakpointWidget = null

  componentDidMount () {
    window.addEventListener('resize', this.updateEditorSize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateEditorSize)
    this.disposables.forEach((d) => d.dispose())
  }
  
  updateEditorSize = () => this.editor.layout()

  componentDidUpdate (prevProps) {
    if (prevProps.readOnly !== this.props.readOnly) {
      this.editor.updateOptions({
        readOnly: this.props.readOnly
      })
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
        this.showMessage('You cannot edit the code while the program is running.')
      }),
      editor.onMouseUp(this.handleEditorMouseUp),
      editor.addAction({
        id: 'toggle-breakpoint',
        label: 'Toggle Breakpoint',
        keybindings: [this.monaco.KeyCode.F9],
        contextMenuGroupId: '1_modification',
        run: (editor) => {
          const position = editor.getPosition()
          const token = getTokenAtOrNext(editor.getValue(), position.lineNumber - 1, position.column - 1)
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
          const position = editor.getPosition()
          const widget = new ConditionalBreakpointWidget(editor, () => {
            this.breakpointWidget.widget.dispose()
            if (!editor.isFocused()) {
              editor.setPosition(this.breakpointWidget.position)
              editor.focus()
            }
            this.breakpointWidget = null
          })
          widget.create()
          widget.show(position, 2)
          this.breakpointWidget = {
            widget,
            position
          }
          editor.addCommand(this.monaco.KeyCode.Escape, () => {
            if (this.breakpointWidget) {
              this.breakpointWidget.widget.dispose()
              if (!editor.isFocused()) {
                editor.setPosition(this.breakpointWidget.position)
                editor.focus()
              }
              this.breakpointWidget = null
            }
          })
        }
      }),
      editor.getModel().onDidChangeDecorations(this.handleDecorationsChanged)
    )
  }

  setBreakpoint (pos) {
    const [newBreakpoint] = this.editor.deltaDecorations([], [{
      range: new this.monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1),
      options: {
        isWholeLine: false,
        beforeContentClassName: 'breakpoint',
        stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }])
    this.breakpoints.push({
      decorationId: newBreakpoint,
      position: pos
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
    if (e.target.element.classList.contains('breakpoint')) {
      this.unsetBreakpoint({
        col: e.target.position.column - 1,
        line: e.target.position.lineNumber - 1
      })
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
        beforeContentClassName: 'breakpoint',
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

  /**
   * Show a message at a specific position in the editor.
   * @public
   * @param {string} message Message to show
   * @param {object} position Position to show the message at, defaults to the current cursor position
   */
  showMessage(message, position = this.editor.getPosition()) {
    MessageController.get(this.editor).showMessage(message, position)
  }

  render () {
    const {
      code,
      onChange,
      readOnly,
      onBreakpointsChange,
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
  onBreakpointsChange: PropTypes.func.isRequired
}
