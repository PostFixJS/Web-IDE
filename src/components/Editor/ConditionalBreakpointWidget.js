import React from 'react'
import ReactDOM from 'react-dom'
import * as monaco from 'monaco-editor'
import { ZoneWidget } from 'monaco-editor/esm/vs/editor/contrib/zoneWidget/zoneWidget'
import OneLineEditor from '../OneLineEditor';

class Widget extends React.Component {
  editorDidMount = (editor) => {
    setImmediate(() => {
      editor.layout()
      editor.focus()
    })
    editor.addCommand(monaco.KeyCode.Enter, () => {
      // TODO provide actual input
      this.props.onAccept()
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
          options={{ fixedOverflowWidgets: true }}
        />
      </div>
    )
  }
}

export default class ConditionalBreakpointWidget extends ZoneWidget {
  constructor (editor, onAccept) {
    super(editor, {
      showFrame: true,
      showArrow: true,
      frameWidth: 1
    })
    this.onAccept = onAccept
  }

  _fillContainer (container) {
    ReactDOM.render(<Widget onAccept={this.onAccept} />, container)
  }

  _onWidth(width) {
    // TODO
  }

  _doLayout(height, width) {
    // TODO
  }
}
