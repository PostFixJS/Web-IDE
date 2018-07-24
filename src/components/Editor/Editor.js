import React from 'react'
import MonacoEditor from 'react-monaco-editor'
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
  }

  render () {
    const {
      code,
      onChange,
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
