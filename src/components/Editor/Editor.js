import React from 'react'
import PropTypes from 'prop-types'
import MonacoEditor from 'react-monaco-editor'
import { MessageController } from 'monaco-editor/esm/vs/editor/contrib/message/messageController'
import { tokensProvider, configuration } from './postfixLanguage'

export default class Editor extends React.Component {
  componentDidMount () {
    window.addEventListener('resize', this.updateEditorSize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateEditorSize)
  }
  
  updateEditorSize = () => {
    this.editor.layout()
  }
  
  editorWillMount = (monaco) => {
    this.monaco = monaco
    monaco.languages.register({ id: 'postfix' })
    monaco.languages.setMonarchTokensProvider('postfix', tokensProvider)
    monaco.languages.setLanguageConfiguration('postfix', configuration)
  }

  editorDidMount = (editor) => {
    this.editor = editor
    editor.updateOptions({
      readOnly: this.props.readOnly
    })
    editor.onDidAttemptReadOnlyEdit((e) => {
      MessageController.get(editor).showMessage('You cannot edit the code while the program is running.', editor.getPosition())
    })
  }

  componentDidUpdate (prevProps) {
    if (prevProps.readOnly !== this.props.readOnly) {
      this.editor.updateOptions({
        readOnly: this.props.readOnly
      })
    }
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
