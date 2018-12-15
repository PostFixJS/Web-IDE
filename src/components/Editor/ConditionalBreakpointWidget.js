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
    position: 'relative',
    '& .react-monaco-editor-container': {
      margin: 'auto'
    }
  },
  select: {
    border: 'none',
    background: '#eee',
    margin: 'auto',
    width: 100,
    minWidth: 100,
    maxWidth: 100
  },
  button: {
    border: 'none',
    background: 'transparent',
    color: 'red',
    outline: 'none',
    width: 24,

    '&:hover': {
      background: theme.type === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'
    }
  },
  placeholder: {
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"',
    position: 'absolute',
    bottom: 2,
    left: 116,
    opacity: 0.5,
    maxWidth: 'calc(100% - 116px - 24px)',
    overflowX: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    pointerEvents: 'none'
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
    editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Enter) {
        e.preventDefault()
        const { type } = this.state
        const expression = editor.getValue()

        if (this.state.type === 'hit' && !/^\d+$/.test(expression)) {
          showMessage(editor, 'Hit count must be a non-negative number.')
        } else {
          this.props.onAccept({ type, expression })
        }
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
          options={{ fixedOverflowWidgets: true, snippetSuggestions: 'none' }}
          value={this.state.expressions[this.state.type] || ''}
          onChange={this.handleChangeExpression}
          {...other}
        />
        {!this.state.expressions[this.state.type] && this.state.type === 'expression' && (
          <div className={classes.placeholder} style={{ fontSize: other.fontSize }}>
            Break if the expression returns true. Press Enter to save, Escape to cancel.
          </div>
        )}
        {!this.state.expressions[this.state.type] && this.state.type === 'hit' && (
          <div className={classes.placeholder} style={{ fontSize: other.fontSize }}>
            Break after the given number of hits. Press Enter to save, Escape to cancel.
          </div>
        )}
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

    // unmount the React tree when the widget is destroyed
    this._disposables.push({
      dispose () {
        ReactDOM.unmountComponentAtNode(container)
      }
    })
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
