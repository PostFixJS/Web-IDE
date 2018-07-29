import React from 'react'
import PropTypes from 'prop-types'
import KeyListener from '../KeyListener'

export default function Toolbar ({
  running,
  paused,
  onRun,
  onPause,
  onStop,
  onStep
}) {
  return (
    <div>
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

Toolbar.propTypes = {
  running: PropTypes.bool.isRequired,
  paused: PropTypes.bool.isRequired,
  onRun: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onStep: PropTypes.func.isRequired,
}
