import React from 'react'
import ReactDOM from 'react-dom'
import injectSheet from 'react-jss'
import * as monaco from 'monaco-editor'
import { ZoneWidget } from 'monaco-editor/esm/vs/editor/contrib/zoneWidget/zoneWidget'
import OneLineEditor from '../OneLineEditor';
import { showMessage } from './monaco-integration/util'

const styles = {
  select: {
    border: 'none',
    background: '#eee'
  }
}

class RawWidget extends React.Component {
  lineHighlightDecorations = []

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

  showError (err) {
    const pos = err.origin
    this.lineHighlightDecorations = this._editor.deltaDecorations(this.lineHighlightDecorations, [
      {
        range: new monaco.Range(pos.line + 1, pos.col + 1, pos.line + 1, pos.col + 1 + pos.token.length),
        options: {
          isWholeLine: false,
          className: "errorTokenHighlight",
          hoverMessage: { value: `Error: ${err.message}` }
        }
      },
      {
        range: new monaco.Range(pos.line + 1, 1, pos.line + 1, 1),
        options: {
          isWholeLine: true,
          className: "errorLineHighlight"
        }
      }
    ])
  }

  editorDidMount = (editor) => {
    this._editor = editor
    setImmediate(() => {
      editor.layout()
      editor.focus()
    })
    editor.addCommand(monaco.KeyCode.Enter, () => {
      const { type } = this.state
      const expression = editor.getValue()

      if (this.state.type === 'hit' && !/^\d+$/.test(expression)) {
        showMessage(editor, 'Hit count must be a non-negative number.')
      } else {
        this.props.onAccept({ type, expression })
      }
    })
    editor.onDidChangeModelContent(() => {
      this.lineHighlightDecorations = this._editor.deltaDecorations(this.lineHighlightDecorations, [])
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
    const { classes } = this.props
    return (
      <div style={{ display: 'flex' }}>
        <select onChange={this.handleChangeType} value={this.state.type} className={classes.select}>
          <option value='expression'>Expression</option>
          <option value='hit'>Hit count</option>
          <option value='log'>Log a message</option>
        </select>
        <OneLineEditor
          language={this.state.type === 'expression' ? 'postfix' : 'text'}
          editorDidMount={this.editorDidMount}
          options={{ fixedOverflowWidgets: true }}
          value={this.state.expressions[this.state.type] || ''}
          onChange={this.handleChangeExpression}
        />
      </div>
    )
  }
}

const Widget = injectSheet(styles)(RawWidget)

export default class ConditionalBreakpointWidget extends ZoneWidget {
  constructor (editor, onAccept, breakpoint, mountedCallback) {
    super(editor, {
      showFrame: true,
      showArrow: true,
      frameWidth: 1
    })
    this.onAccept = onAccept
    this.breakpoint = breakpoint
    this.mountedCallback = mountedCallback
  }

  _setRef = (ref) => {
    this._widget = ref
  }

  _fillContainer (container) {
    ReactDOM.render((
      <Widget
        innerRef={this._setRef}
        onAccept={this.onAccept}
        breakpoint={this.breakpoint}
      />
    ), container, this.mountedCallback)
  }

  _onWidth(width) {
    // TODO
  }

  _doLayout(height, width) {
    // TODO
  }

  showError (err) {
    this._widget.showError(err)
  }
}
