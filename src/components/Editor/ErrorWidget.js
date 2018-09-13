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

function RawWidget ({ classes, error }) {
  return (
    <div className={classes.root} title={error.message}>
      <span className={classes.error}>Error:</span> {error.message}
    </div>
  )
}

const Widget = injectSheet(styles)(RawWidget)

export default class ErrorWidget extends ZoneWidget {
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
  }
}
