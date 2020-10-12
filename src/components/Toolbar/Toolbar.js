import React from 'react'
import PropTypes from 'prop-types'
import KeyListener from '../KeyListener'
import Button from './Button'
import DropdownButton from './DropdownButton'
import Divider from './Divider'

/**
 * A toolbar for the IDE.
 */
export default class Toolbar extends React.Component {
  _fileInput = React.createRef()

  handleOpen = () => {
    this._fileInput.current.click()
  }

  handleOpenDone = (e) => {
    const reader = new FileReader()
    reader.onloadend = (el) => this.props.onOpen(el.target.result)
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
      onShowKeyboardShortcuts,
      onToggleDocumentationPanel,
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
            title: 'PostFix language tutorial',
            onClick: this.handleShowHelp
          }, {
            title: 'Toggle documentation panel',
            onClick: onToggleDocumentationPanel
          }, {
            title: 'Keyboard shortcuts',
            onClick: onShowKeyboardShortcuts
          }]}
        />
      </div>
    )
  }
}

Toolbar.propTypes = {
  /**
   * True if the program is running.
   */
  running: PropTypes.bool.isRequired,
  /**
   * True if the program is paused.
   */
  paused: PropTypes.bool.isRequired,
  /**
   * True if the program can be paused at the moment.
   */
  canPause: PropTypes.bool.isRequired,
  /**
   * True if the program can be stepped at the moment.
   */
  canStep: PropTypes.bool.isRequired,
  /**
   * Callback that is invoked when the program is started.
   */
  onRun: PropTypes.func.isRequired,
  /**
   * Callback that is invoked when the program is paused.
   */
  onPause: PropTypes.func.isRequired,
  /**
   * Callback that is invoked when the program is stopped.
   */
  onStop: PropTypes.func.isRequired,
  /**
   * Callback that is invoked when the program should execute a step.
   */
  onStep: PropTypes.func.isRequired,
  /**
   * Callback that is invoked to load a new file.
   */
  onOpen: PropTypes.func.isRequired,
  /**
   * Callback that is invoked to save the code.
   */
  onSave: PropTypes.func.isRequired,
  /**
   * Callback that is invoked to show the settings.
   */
  onShowSettings: PropTypes.func.isRequired,
  /**
   * Callback that is invoked to show the keyboard shortcut overlay.
   */
  onShowKeyboardShortcuts: PropTypes.func.isRequired,
  /**
   * Callback that is invoked to toggle the documentation panel.
   */
  onToggleDocumentationPanel: PropTypes.func.isRequired
}
