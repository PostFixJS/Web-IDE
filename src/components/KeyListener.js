import React from 'react'
import PropTypes from 'prop-types'

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

    if (actualKeyCode === keyCode && e.ctrlKey === ctrl && e.shiftKey === shift && e.altKey === alt) {
      if (!disabled) {
        this.props.onKeyDown(e)
      }
      if (this.props.preventDefault) {
        e.preventDefault()
      }
    }
  }

  render () {
    return null
  }
}

KeyListener.propTypes = {
  onKeyDown: PropTypes.func,
  ctrl: PropTypes.bool,
  shift: PropTypes.bool,
  alt: PropTypes.bool,
  keyCode: PropTypes.number,
  preventDefault: PropTypes.bool,
  disabled: PropTypes.bool
}

KeyListener.defaultProps = {
  ctrl: false,
  shift: false,
  alt: false,
  preventDefault: true,
  disabled: false
}
