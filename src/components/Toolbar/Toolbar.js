import React from 'react'
import PropTypes from 'prop-types'
import KeyListener from '../KeyListener'

export default class Toolbar extends React.Component {
  handleOpen = () => {
    this._fileInput.click()
  }

  handleOpenDone = (e) => {
    const reader = new FileReader()
    reader.onloadend = (e) => this.props.onOpen(e.target.result)
    reader.readAsText(e.target.files[0])
  }

  handleFileInputRef = (ref) => {
    this._fileInput = ref
  }

  render () {
    const {
      running,
      paused,
      onRun,
      onPause,
      onStop,
      onStep,
      onSave
    } = this.props

    return (
      <div>
        <KeyListener
          keyCode={79} // O
          ctrl
          onKeyDown={this.handleOpen}
        />
        <button
          onClick={this.handleOpen}
        >
          <input
            type='file'
            ref={this.handleFileInputRef}
            value=''
            onChange={this.handleOpenDone}
            style={{ display: 'none' }}
            accept='.pf'
          />
          Open
        </button>
        <KeyListener
          keyCode={83} // S
          ctrl
          onKeyDown={onSave}
        />
        <button
          onClick={onSave}
        >
          Save
        </button>
        <KeyListener
          keyCode={116} // F5
          onKeyDown={onRun}
          disabled={running && !paused}
        />
        <button
          onClick={onRun}
          disabled={running && !paused}
        >
          {running ? 'Continue' : 'Run'} (F5)
        </button>
        <KeyListener
          keyCode={119} // F8
          onKeyDown={onPause}
          disabled={!running || paused}
        />
        <button
          onClick={onPause}
          disabled={!running || paused}
        >
          Pause (F8)
        </button>
        <KeyListener
          keyCode={117} // F6
          onKeyDown={onStep}
          disabled={!paused && running}
        />
        <button
          onClick={onStep}
          disabled={!paused && running}
        >
          Step (F6)
        </button>
        <KeyListener
          keyCode={116} // F5
          ctrl
          onKeyDown={onStop}
          disabled={!running}
        />
        <button
          onClick={onStop}
          disabled={!running}
        >
          Stop (Ctrl+F5)
        </button>
      </div>
    )
  }
}

Toolbar.propTypes = {
  running: PropTypes.bool.isRequired,
  paused: PropTypes.bool.isRequired,
  onRun: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onStep: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
}
