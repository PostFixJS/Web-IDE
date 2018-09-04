import React from 'react'
import ReactDOM from 'react-dom'
import * as monaco from 'monaco-editor'
import { ZoneWidget } from 'monaco-editor/esm/vs/editor/contrib/zoneWidget/zoneWidget'
import OneLineEditor from '../OneLineEditor';

class Widget extends React.Component {
  constructor (props) {
    super(props)

    if (props.breakpoint) {
      this.state = {
        expressions: {
          [props.breakpoint.type]: props.breakpoint.expression
        },
        type: props.breakpoint.type
      }
    } else {
      this.state = {
        expressions: {},
        type: 'expression'
      }
    }
  }

  editorDidMount = (editor) => {
    setImmediate(() => {
      editor.layout()
      editor.focus()
    })
    editor.addCommand(monaco.KeyCode.Enter, () => {
      this.props.onAccept({
        type: this.state.type,
        expression: editor.getValue()
      })
    })
  }

  handleChangeType = (e) => {
    const type = e.target.value
    this.setState((state) => ({
      type,
      expression: state.expressions[type]
    }))
  }

  handleChangeExpression = (expression) => {
    this.setState((state) => ({
      expressions: {
        ...state.expressions,
        [state.type]: expression
      }
    }))
  }

  render () {
    return (
      <div style={{ display: 'flex' }}>
        <select onChange={this.handleChangeType} value={this.state.type}>
          <option value='expression'>Expression</option>
          <option value='hit'>Hit count</option>
          <option value='log'>Log a message</option>
        </select>
        <OneLineEditor
          language='postfix'
          editorDidMount={this.editorDidMount}
          options={{ fixedOverflowWidgets: true }}
          value={this.state.expressions[this.state.type] || ''}
          onChange={this.handleChangeExpression}
        />
      </div>
    )
  }
}

export default class ConditionalBreakpointWidget extends ZoneWidget {
  constructor (editor, onAccept, breakpoint) {
    super(editor, {
      showFrame: true,
      showArrow: true,
      frameWidth: 1
    })
    this.onAccept = onAccept
    this.breakpoint = breakpoint
  }

  _fillContainer (container) {
    ReactDOM.render((
      <Widget
        onAccept={this.onAccept}
        breakpoint={this.breakpoint}
      />
    ), container)
  }

  _onWidth(width) {
    // TODO
  }

  _doLayout(height, width) {
    // TODO
  }
}
