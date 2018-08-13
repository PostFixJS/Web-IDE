import React from 'react'
import injectSheet from 'react-jss'
import MonacoEditor from 'react-monaco-editor'
import * as monaco from 'monaco-editor'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column'
  },
  editors: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row'
  },
  editorContainer: {
    flex: 1
  }
}

class InputOutput extends React.Component {
  state = {
    visible: 'output'
  }
  inputDecorations = []

  componentDidMount () {
    window.addEventListener('resize', this.updateEditorSize)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.output !== this.props.output) {
      this.outputEditor.revealLine(this.props.output.split('\n').length + 1)
    }
    if (prevProps.readOnly !== this.props.readOnly) {
      this.inputEditor.updateOptions({
        readOnly: this.props.readOnly
      })
    }
    if (prevProps.inputPosition !== this.props.inputPosition) {
      const pos = this.inputEditor.getModel().getPositionAt(this.props.inputPosition)
      this.inputDecorations = this.inputEditor.deltaDecorations(this.inputDecorations, [
        {
          range: new monaco.Range(1, 1, pos.lineNumber, pos.column),
          options: {
            className: 'readInputHighlight',
            inlineClassName: 'readInputInline',
            hoverMessage: { value: 'This input was already read by the program.' }
          }
        }
      ])
    }
    if (prevProps.input !== this.props.input) {
      this.inputDecorations = this.inputEditor.deltaDecorations(this.inputDecorations, [])
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateEditorSize)
  }
  
  updateEditorSize = () => {
    this.layout()
  }

  inputEditorDidMount = (editor) => {
    this.inputEditor = editor
  }

  outputEditorDidMount = (editor) => {
    this.outputEditor = editor
  }

  setRootRef = (ref) => this._rootRef = ref

  /**
   * Update the size of the editor.
   * @public
   * @param {object} dimensions New width and height (both optional, default to the size of this component)
   */
  layout (dimensions = {}) {
    this.inputEditor.layout({
      width: dimensions.width / 2 || this._rootRef.clientWidth / 2,
      height: dimensions.height || this._rootRef.clientHeight
    })
    this.outputEditor.layout({
      width: dimensions.width / 2 || this._rootRef.clientWidth / 2,
      height: dimensions.height || this._rootRef.clientHeight
    })
  }

  render () {
    const {
      classes,
      input,
      output,
      onInputChange,
      readOnly,
      ...other
    } = this.props

    return (
      <div
        ref={this.setRootRef}
        className={classes.root}
        {...other}
      >
        <div className={classes.editors}>
          <div className={classes.editorContainer}>
            <MonacoEditor
              editorDidMount={this.outputEditorDidMount}
              value={output}
              options={{
                readOnly: true,
                lineNumbers: false,
                scrollBeyondLastLine: false,
                minimap: {
                  enabled: false
                },
                wordWrap: 'on'
              }}
              language='text'
              />
          </div>
          <div className={classes.editorContainer}>
            <MonacoEditor
              editorDidMount={this.inputEditorDidMount}
              value={input}
              onChange={onInputChange}
              options={{
                lineNumbers: false,
                scrollBeyondLastLine: false,
                minimap: {
                  enabled: false
                },
                wordWrap: 'on',
                renderWhitespace: 'all',
                renderControlCharacters: true
              }}
              language='text'
            />
          </div>
        </div>
      </div>
    )
  }
}

export default injectSheet(styles)(InputOutput)
