import React from 'react'
import PropTypes from 'prop-types'
import KeyListener from '../KeyListener'
import Button from './Button'
import DropdownButton from './DropdownButton'
import Divider from './Divider'

export default class Toolbar extends React.Component {
  _fileInput = React.createRef()

  handleOpen = () => {
    this._fileInput.current.click()
  }

  handleOpenDone = (e) => {
    const reader = new FileReader()
    reader.onloadend = (e) => this.props.onOpen(e.target.result)
    reader.readAsText(e.target.files[0])
  }

  handleShowHelp = () => {
    window.open('https://postfix.hci.uni-hannover.de/postfix-lang.html', '_blank')
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
            ref={this._fileInput}
            value=''
            onChange={this.handleOpenDone}
            style={{ display: 'none' }}
            // accept='.pf' // TODO check this on macOS
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
          icon={require('./icons/settings.svg')}
        />
        <DropdownButton
          onClick={this.handleShowHelp}
          title='Help'
          icon={require('./icons/info.svg')}
          items={[{
            title: 'PostFix Tutorial',
            onClick: this.handleShowHelp
          }, {
            title: 'Keyboard shortcuts',
            onClick: this.props.onShowKeyboardShortcuts
          }]}
        />
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
  onShowSettings: PropTypes.func.isRequired,
  onShowKeyboardShortcuts: PropTypes.func.isRequired
}
