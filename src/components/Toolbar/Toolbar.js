import React from 'react'
import PropTypes from 'prop-types'
import KeyListener from '../KeyListener'
import Button from './Button'
import Divider from './Divider'

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
      canPause,
      canStep,
      onRun,
      onPause,
      onStop,
      onStep,
      onOpen,
      onSave,
      theme,
      onToggleTheme,
      onShowSettings,
      ...other
    } = this.props

    return (
      <div {...other}>
        <KeyListener
          keyCode={79} // O
          ctrl
          onKeyDown={this.handleOpen}
        />
        <Button
          onClick={this.handleOpen}
          title='Open (Ctrl+O)'
          icon={require('./icons/open.svg')}
        >
          <input
            type='file'
            ref={this.handleFileInputRef}
            value=''
            onChange={this.handleOpenDone}
            style={{ display: 'none' }}
            accept='.pf'
          />
        </Button>
        <KeyListener
          keyCode={83} // S
          ctrl
          onKeyDown={onSave}
        />
        <Button
          onClick={onSave}
          title='Save (Ctrl+S)'
          icon={require('./icons/save.svg')}
        />
        <Divider />
        <KeyListener
          keyCode={116} // F5
          onKeyDown={onRun}
          disabled={running && (!paused || !canStep)}
        />
        <Button
          onClick={onRun}
          disabled={running && (!paused || !canStep)}
          title={`${running ? 'Continue' : 'Run'} (F5)`}
          label={running ? 'Continue' : 'Run'}
          icon={require('./icons/run.svg')}
        />
        <KeyListener
          keyCode={119} // F8
          onKeyDown={onPause}
          disabled={!running || paused || !canPause}
        />
        <Button
          onClick={onPause}
          disabled={!running || paused || !canPause}
          title='Pause (F8)'
          icon={require('./icons/pause.svg')}
        />
        <KeyListener
          keyCode={117} // F6
          onKeyDown={onStep}
          disabled={(!paused || !canStep) && running}
        />
        <Button
          onClick={onStep}
          disabled={(!paused || !canStep) && running}
          title='Step (F6)'
          icon={require('./icons/step.svg')}
        />
        <KeyListener
          keyCode={116} // F5
          ctrl
          onKeyDown={onStop}
          disabled={!running}
        />
        <Button
          onClick={onStop}
          disabled={!running}
          title='Stop (Ctrl+F5)'
          icon={require('./icons/stop.svg')}
        />
        <Divider />
        <Button
          onClick={onShowSettings}
          title='Settings'
          icon={require('./icons/idea.svg')}
        />
        <span style={{ float: 'right', lineHeight: '32px', fontSize: '9pt', marginRight: 5 }}>
          Icons made by <a href='https://smashicons.com/'>Smashicons</a> from <a href='https://www.flaticon.com'>www.flaticon.com</a>
        </span>
      </div>
    )
  }
}

Toolbar.propTypes = {
  running: PropTypes.bool.isRequired,
  paused: PropTypes.bool.isRequired,
  canPause: PropTypes.bool.isRequired,
  canStep: PropTypes.bool.isRequired,
  onRun: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onStep: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  onIncreaseFontSize: PropTypes.func.isRequired,
  onDecreaseFontSize: PropTypes.func.isRequired,
  onResetFontSize: PropTypes.func.isRequired
}
