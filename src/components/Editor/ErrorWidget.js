import React from 'react'
import ReactDOM from 'react-dom'
import injectSheet from 'react-jss'
import { ZoneWidget } from 'monaco-editor/esm/vs/editor/contrib/zoneWidget/zoneWidget'

const styles = {
  root: {
  },
  error: {
    color: 'rgb(255, 0, 24)'
  }
}

/**
 * React component that is used to display errors in the editor.
 */
const Widget = injectSheet(styles)(({ classes, error }) => (
  <div className={classes.root} title={error.message}>
    <span className={classes.error}>Error:</span> {error.message}
  </div>
))

/**
 * The error widget to be used by Monaco to show errors in the editor.
 * Uses React to render the widget internally.
 */
export default class ErrorWidget extends ZoneWidget {
  /**
   * Create a new error widget.
   * @param {ITextEditor} editor Monaco editor
   * @param {Err} error Error to be displayed
   * @param {function} onClose Callback to be invoked when the error should be closed
   */
  constructor (editor, error, onClose) {
    super(editor, {
      showFrame: true,
      showArrow: true,
      frameWidth: 1,
      frameColor: 'rgb(255, 0, 24)',
      arrowColor: 'rgb(255, 0, 24)'
    })
    this.error = error
    this.onClose = onClose
  }

  _fillContainer (container) {
    ReactDOM.render((
      <Widget
        error={this.error}
        onClose={this.onClose}
      />
    ), container)

    // unmount the React tree when the widget is destroyed
    this._disposables._toDispose.add({
      dispose () {
        ReactDOM.unmountComponentAtNode(container)
      }
    })
  }
}
