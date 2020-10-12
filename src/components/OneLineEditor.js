import React from 'react'
import PropTypes from 'prop-types'
import MonacoEditor from 'react-monaco-editor'
import { disableCommandPalette } from './Editor/monaco-integration/util'

/**
 * A Monaco editor that is one line high and has most features disabled.
 */
export default class OneLineEditor extends React.Component {
  state = { height: 0 }

  editorDidMount = (editor, monaco) => {
    this.editor = editor
    this.setState({
      height: editor.getOption(monaco.editor.EditorOption.lineHeight)
    })
   
    editor.onDidChangeConfiguration(() => {
      if (this.props.onFontSizeChange) {
        const fontSize = editor.getRawOptions().fontSize
        if (fontSize !== this.props.fontSize) {
          this.props.onFontSizeChange(fontSize)
        }
      }
      this.setState({ height: editor.getOption(monaco.editor.EditorOption.lineHeight) })
    })
    
    disableCommandPalette(editor)

    if (this.props.editorDidMount) {
      this.props.editorDidMount(editor, monaco)
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.fontSize !== this.props.fontSize) {
      this.editor.updateOptions({
        fontSize: this.props.fontSize
      })
    }
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
          contextmenu: false,
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
  /**
   * Function to be called after the editor is mounted.
   */
  editorDidMount: PropTypes.func,
  /**
   * Font size of the editor.
   */
  fontSize: PropTypes.number.isRequired,
  /**
   * Function to be called when the font size is changed.
   */
  onFontSizeChange: PropTypes.func,
  /**
   * Options for the Monaco editor.
   */
  options: PropTypes.object
}
