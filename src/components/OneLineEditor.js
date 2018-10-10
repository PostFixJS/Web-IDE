import React from 'react'
import PropTypes from 'prop-types'
import MonacoEditor from 'react-monaco-editor'

export default class OneLineEditor extends React.Component {
  state = { height: 0 }

  editorDidMount = (editor, monaco) => {
    this.editor = editor
    this.setState({
      height: editor.getConfiguration().lineHeight
    })

    if (this.props.editorDidMount) {
      this.props.editorDidMount(editor, monaco)
    }
   
    editor.onDidChangeConfiguration(() => {
      if (this.props.onFontSizeChange) {
        const fontSize = editor.getConfiguration().fontInfo.fontSize
        if (fontSize !== this.props.fontSize) {
          this.props.onFontSizeChange(fontSize)
        }
      }
      this.setState({ height: this.editor.getConfiguration().lineHeight })
    })
  }

  render () {
    const { options, editorDidMount, onFontSizeChange, fontSize, ...other } = this.props
    const { height } = this.state

    return (
      <MonacoEditor
        editorDidMount={this.editorDidMount}
        height={height}
        options={{
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
            verticalSliderSize: 0
          },
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          minimap: {
            enabled: false
          },
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: 'none',
          lineDecorationsWidth: 0,
          fontSize,
          ...options
        }}
        {...other}
      />
    )
  }
}

OneLineEditor.propTypes = {
  editorDidMount: PropTypes.func,
  onFontSizeChange: PropTypes.func,
  options: PropTypes.object
}
