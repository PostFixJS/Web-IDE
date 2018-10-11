import React from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import cx from 'classnames'

const styles = (theme) => ({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'none',
    zIndex: 100,
    background: theme.type === 'light'
      ? 'rgba(255, 255, 255, 0.5)'
      : 'rgba(0, 0, 0, 0.5)'
  },
  open: {
    display: 'block'
  },
  window: {
    width: 400,
    height: 200,
    padding: 20,
    margin: '10% auto',
    border: `10px solid ${theme.background}`,
    borderRadius: 3,
    background: theme.card.background,
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.4)',
    color: theme.card.color,

    '& input[type=number]': {
      border: 0,
      background: theme.input.background,
      color: theme.input.color,
      padding: '5px 10px',
      outline: 'none',
      '&:focus': {
        border: `1px solid ${theme.input.borderColor}`,
        padding: '4px 9px'
      }
    },
    '& input[type=checkbox]': {
      margin: 'auto'
    },
    '& input': {
      flex: 1
    }
  },
})

class Dialog extends React.PureComponent {
  cancelClick = (e) => {
    e.stopPropagation()
  }

  render () {
    const {
      children,
      classes,
      open,
      onClose
    } = this.props

    return createPortal((
      <div
        className={cx(classes.backdrop, { [classes.open]: open })}
        onClick={onClose}
      >
        <div
          className={classes.window}
          onClick={this.cancelClick}
        >
          {children}
        </div>
      </div>
    ), document.body)
  }
}

Dialog.propTypes = {
  children: PropTypes.node,
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default injectSheet(styles)(Dialog)
