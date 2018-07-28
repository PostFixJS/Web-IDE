import React from 'react'
import MonacoEditor from 'react-monaco-editor'

export default class InputOutput extends React.Component {
  componentDidMount () {
    window.addEventListener('resize', this.updateEditorSize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateEditorSize)
  }
  
  updateEditorSize = () => this.editor.layout()

  editorDidMount = (editor) => {
    this.editor = editor
  }

  setRootRef = (ref) => this._rootRef = ref

  componentDidUpdate (oldProps) {
    if (oldProps.value !== this.props.value) {
      this.editor.revealLine(this.props.value.split('\n').length + 1)
    }
  }

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

  render () {
    const {
      value,
      onChange,
      ...other
    } = this.props

    return (
      <div
        ref={this.setRootRef}
        {...other}
      >
        <MonacoEditor
          editorDidMount={this.editorDidMount}
          value={value}
          onChange={onChange}
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
    )
  }
}
