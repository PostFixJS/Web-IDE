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
    padding: 20,
    margin: '10% auto',
    border: `10px solid ${theme.background}`,
    borderRadius: 3,
    background: theme.card.background,
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.4)',
    color: theme.card.color,
    fontSize: '14px',
    lineHeight: '18px'
  },
  header: {
    fontSize: '20px',
    lineHeight: '24px',
    marginBottom: 16
  },
  footer: {
    height: 42,
    display: 'flex',
    flexDirection: 'row',
    margin: '20px -20px -20px',
    paddingTop: 10,
    background: theme.background,
    '& > *': {
      marginLeft: 8
    }
  },
  filler: {
    flex: 1
  }
})

class Dialog extends React.PureComponent {
  cancelClick = (e) => {
    e.stopPropagation()
  }

  render () {
    const {
      buttons,
      children,
      classes,
      open,
      onClose,
      title,
      width
    } = this.props

    return createPortal((
      <div
        className={cx(classes.backdrop, { [classes.open]: open })}
        onClick={onClose}
      >
        <div
          className={classes.window}
          style={{ width }}
          onClick={this.cancelClick}
        >
          {title && <div className={classes.header}>{title}</div>}
          {children}
          {buttons && (
            <div className={classes.footer}>
              <div className={classes.filler} />
              {buttons}
            </div>
          )}
        </div>
      </div>
    ), document.body)
  }
}

Dialog.propTypes = {
  buttons: PropTypes.arrayOf(PropTypes.element),
  children: PropTypes.node,
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  width: PropTypes.number
}

export default injectSheet(styles)(Dialog)
