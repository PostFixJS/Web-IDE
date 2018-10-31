import React from 'react'
import ReactDOM from 'react-dom'
import injectSheet from 'react-jss'
import * as monaco from 'monaco-editor'
import { ZoneWidget } from 'monaco-editor/esm/vs/editor/contrib/zoneWidget/zoneWidget'
import { Provider, connect } from 'react-redux'
import ThemeProvider from '../../ThemeProvider'
import store from '../../store'
import * as actions from '../../actions'
import OneLineEditor from '../OneLineEditor'
import { showMessage, rangeToMonaco } from './monaco-integration/util'

const styles = (theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    '& .react-monaco-editor-container': {
      margin: 'auto'
    }
  },
  select: {
    border: 'none',
    background: '#eee',
    margin: 'auto'
  },
  button: {
    border: 'none',
    background: 'transparent',
    color: 'red',
    outline: 'none',

    '&:hover': {
      background: theme.type === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'
    }
  }
})

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

  componentDidUpdate (prevProps) {
    if (prevProps.fontSize !== this.props.fontSize) {
      this._editor.updateOptions({
        fontSize: this.props.fontSize
      })
    }
  }

  showError (err) {
    const pos = err.origin
    this.lineHighlightDecorations = this._editor.deltaDecorations(this.lineHighlightDecorations, [
      {
        range: rangeToMonaco(pos),
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
    const { classes, theme, ...other } = this.props
    return (
      <div className={classes.root}>
        <select onChange={this.handleChangeType} value={this.state.type} className={classes.select}>
          <option value='expression'>Expression</option>
          <option value='hit'>Hit count</option>
        </select>
        <OneLineEditor
          language={this.state.type === 'expression' ? 'postfix' : 'text'}
          editorDidMount={this.editorDidMount}
          options={{ fixedOverflowWidgets: true }}
          value={this.state.expressions[this.state.type] || ''}
          onChange={this.handleChangeExpression}
          {...other}
        />
        <button
          className={classes.button}
          onClick={this.props.onRemove}
          title='Remove breakpoint'
        >
          ✗
        </button>
      </div>
    )
  }
}

const Widget = connect((state) => ({
  fontSize: state.settings.fontSize
}), (dispatch) => ({
  onFontSizeChange: (fontSize) => dispatch(actions.setFontSize(fontSize))
}))(injectSheet(styles)(RawWidget))

export default class ConditionalBreakpointWidget extends ZoneWidget {
  constructor (editor, { onAccept, onRemove, breakpoint, onMounted }) {
    super(editor, {
      showFrame: true,
      showArrow: true,
      frameWidth: 1
    })
    this.onAccept = onAccept
    this.onRemove = onRemove
    this.onMounted = onMounted
    this.breakpoint = breakpoint
  }

  _setRef = (ref) => {
    this._widget = ref
  }

  _fillContainer (container) {
    ReactDOM.render((
      <Provider store={store}>
        <ThemeProvider>
          <Widget
            innerRef={this._setRef}
            onAccept={this.onAccept}
            onRemove={this.onRemove}
            breakpoint={this.breakpoint}
          />
        </ThemeProvider>
      </Provider>
    ), container, this.onMounted)
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
