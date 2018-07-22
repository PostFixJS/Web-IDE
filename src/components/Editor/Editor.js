import React from 'react'
import MonacoEditor from 'react-monaco-editor'

export default class Editor extends React.Component {
  render () {
    return (
      <MonacoEditor
        width={800}
        height={600}
      />
    )
  }
}
