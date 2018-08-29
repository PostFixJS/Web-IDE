import React from 'react'
import ReactDOM from 'react-dom'
import { ZoneWidget } from 'monaco-editor/esm/vs/editor/contrib/zoneWidget/zoneWidget'
import OneLineEditor from '../OneLineEditor';

class Widget extends React.Component {
  editorDidMount = (editor) => {
    setImmediate(() => {
      editor.layout()
      editor.focus()
    })
  }

  render () {
    return (
      <div style={{ display: 'flex' }}>
        <select>
          <option value='expression'>Expression</option>
          <option value='hit'>Hit count</option>
          <option value='log'>Log a message</option>
        </select>
        <OneLineEditor
          language='postfix'
          editorDidMount={this.editorDidMount}
        />
      </div>
    )
  }
}

export default class ConditionalBreakpointWidget extends ZoneWidget {
  constructor (editor) {
    super(editor, {
      showFrame: true,
      showArrow: true,
      frameWidth: 1
    })
  }

  _fillContainer (container) {
    ReactDOM.render(<Widget />, container)
  }

  _onWidth(width) {
    // TODO
  }

  _doLayout(height, width) {
    // TODO
  }
}
