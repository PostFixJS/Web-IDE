import React from 'react'
import PropTypes from 'prop-types'

/**
 * A declarative way to listen for key presses.
 */
export default class KeyListener extends React.PureComponent {
  componentDidMount () {
    document.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount () {
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  handleKeyDown = (e) => {
    const actualKeyCode = e.keyCode || e.which
    const {
      disabled,
      keyCode,
      ctrl,
      shift,
      alt
    } = this.props

    if (actualKeyCode === keyCode && (!ctrl || (ctrl && (e.ctrlKey || e.metaKey))) && e.shiftKey === shift && e.altKey === alt) {
      if (!disabled) {
        if (this.props.preventDefault) {
          e.preventDefault()
        }
        this.props.onKeyDown(e)
      }
    }
  }

  render () {
    return null
  }
}

KeyListener.propTypes = {
  /**
   * Function to be called when the configured keys are pressed.
   */
  onKeyDown: PropTypes.func,
  /**
   * True to require the Ctrl key (Cmd on macOS) to be pressed.
   */
  ctrl: PropTypes.bool,
  /**
   * True to require the Shift key to be pressed.
   */
  shift: PropTypes.bool,
  /**
   * True to require the Alt key to be pressed.
   */
  alt: PropTypes.bool,
  /**
   * The key code of the key to listen for.
   */
  keyCode: PropTypes.number,
  /**
   * Whether or not the default handling should be prevented when the keys are pressed.
   */
  preventDefault: PropTypes.bool,
  /**
   * True to disable listening for the keys.
   */
  disabled: PropTypes.bool
}

KeyListener.defaultProps = {
  ctrl: false,
  shift: false,
  alt: false,
  preventDefault: true,
  disabled: false
}
