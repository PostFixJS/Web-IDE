import React from 'react'
import PropTypes from 'prop-types'
import MonacoEditor from 'react-monaco-editor'
import { MessageController } from 'monaco-editor/esm/vs/editor/contrib/message/messageController'
import HoverProvider from './monaco-integration/HoverProvider'
import LanguageConfiguration from './monaco-integration/LanguageConfiguration'
import MonarchTokensProvider from './monaco-integration/MonarchTokensProvider'
import * as completionItemProviders from './monaco-integration/snippets'

export default class Editor extends React.Component {
  componentDidMount () {
    window.addEventListener('resize', this.updateEditorSize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateEditorSize)
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
    for (const provider of Object.values(completionItemProviders)) {
      monaco.languages.registerCompletionItemProvider('postfix', provider)
    }
  }

  editorDidMount = (editor) => {
    this.editor = editor
    editor.updateOptions({
      readOnly: this.props.readOnly
    })
    editor.onDidAttemptReadOnlyEdit((e) => {
      this.showMessage('You cannot edit the code while the program is running.')
    })
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
  readOnly: PropTypes.bool
}
