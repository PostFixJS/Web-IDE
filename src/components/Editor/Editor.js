import React from 'react'
import MonacoEditor from 'react-monaco-editor'
import { tokensProvider, configuration } from './postfixLanguage'

export default class Editor extends React.Component {
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
    return (
      <MonacoEditor
        width={800}
        height={600}
        editorWillMount={this.editorWillMount}
        editorDidMount={this.editorDidMount}
        language='postfix'
        value={this.props.code}
        onChange={this.props.onChange}
      />
    )
  }
}
