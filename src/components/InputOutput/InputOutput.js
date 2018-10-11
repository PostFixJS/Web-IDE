import React from 'react'
import injectSheet from 'react-jss'
import cx from 'classnames'
import MonacoEditor from 'react-monaco-editor'
import * as monaco from 'monaco-editor'
import Card from '../Card'

const styles = (theme) => ({
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
  },
  highlight: {
    boxShadow: `0 0 5px 1px ${theme.card.highlightColor}`
  }
})

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
    if (prevProps.fontSize !== this.props.fontSize) {
      this.inputEditor.updateOptions({
        fontSize: this.props.fontSize
      })
      this.outputEditor.updateOptions({
        fontSize: this.props.fontSize
      })
    }
    if (prevProps.inputPosition !== this.props.inputPosition) {
      this.updateDecoration()
    }
    if (prevProps.input !== this.props.input) {
      this.updateDecoration()
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateEditorSize)
  }

  updateDecoration () {
    if (this.props.readOnly) {
      const pos = this.inputEditor.getModel().getPositionAt(this.props.inputPosition)
      this.inputDecorations = this.inputEditor.deltaDecorations(this.inputDecorations, [
        {
          range: new monaco.Range(1, 1, pos.lineNumber, pos.column),
          options: {
            className: 'readInputHighlight',
            inlineClassName: 'readInputInline',
            hoverMessage: { value: 'This input was already read by the program.' },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        }
      ])
    } else {
      this.inputDecorations = this.inputEditor.deltaDecorations(this.inputDecorations, [])
    }
  }
  
  updateEditorSize = () => {
    this.layout()
  }

  inputEditorDidMount = (editor) => {
    this.inputEditor = editor
   
    editor.onDidChangeConfiguration(() => {
      if (this.props.onFontSizeChange) {
        const fontSize = editor.getConfiguration().fontInfo.fontSize
        if (fontSize !== this.props.fontSize) {
          this.props.onFontSizeChange(fontSize)
        }
      }
    })

    // prevent changing the input that was already read by the program
    editor.onDidChangeModelContent(() => {
      const input = editor.getModel().getValue()
      const readInput = input.substr(0, this.props.inputPosition)
      const oldReadInput = this.props.input.substr(0, this.props.inputPosition)
      if (this.props.readOnly && readInput !== oldReadInput) {
        editor.getModel().setValue(this.props.input)
        this.updateDecoration()
      } else {
        this.props.onInputChange(input)
      }
    })
  }

  outputEditorDidMount = (editor) => {
    this.outputEditor = editor
   
    editor.onDidChangeConfiguration(() => {
      if (this.props.onFontSizeChange) {
        const fontSize = editor.getConfiguration().fontInfo.fontSize
        if (fontSize !== this.props.fontSize) {
          this.props.onFontSizeChange(fontSize)
        }
      }
    })
  }

  setRootRef = (ref) => this._rootRef = ref

  /**
   * Update the size of the editor.
   * @public
   * @param {object} dimensions New width and height (both optional, default to the size of this component)
   */
  layout (dimensions = {}) {
    this.inputEditor.layout({
      width: (dimensions.width / 2 || (this._rootRef.clientWidth - 30) / 2) - 5,
      height: dimensions.height || (this._rootRef.clientHeight - 20)
    })
    this.outputEditor.layout({
      width: (dimensions.width / 2 || (this._rootRef.clientWidth - 30) / 2) - 5,
      height: dimensions.height || (this._rootRef.clientHeight - 20)
    })
  }

  render () {
    const {
      classes,
      input,
      inputPosition,
      isWaiting,
      output,
      onFontSizeChange,
      onInputChange,
      readOnly,
      fontSize,
      ...other
    } = this.props

    return (
      <div
        ref={this.setRootRef}
        className={classes.root}
        {...other}
      >
        <div className={classes.editors}>
          <Card className={classes.editorContainer} title='Output'>
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
                wordWrap: 'on',
                renderLineHighlight: 'none',
                fontSize
              }}
              language='text'
              />
          </Card>
          <Card
            className={cx(classes.editorContainer, { [classes.highlight]: isWaiting })}
            title='Input'
          >
            <MonacoEditor
              editorDidMount={this.inputEditorDidMount}
              value={input}
              options={{
                lineNumbers: false,
                scrollBeyondLastLine: false,
                minimap: {
                  enabled: false
                },
                wordWrap: 'on',
                renderWhitespace: 'all',
                renderControlCharacters: true,
                fontSize
              }}
              language='text'
            />
          </Card>
        </div>
      </div>
    )
  }
}

export default injectSheet(styles)(InputOutput)
