import React from 'react'
import PropTypes from 'prop-types'
import { createPortal, findDOMNode } from 'react-dom'
import injectStyle from 'react-jss'
import cx from 'classnames'
import Button from './Button'

const styles = (theme) => ({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 100
  },
  dropdown: {
    background: theme.type === 'light' ? '#f8f8f8' : '#595959',
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.4)',
    borderRadius: 2,
    borderTopLeftRadius: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  buttonOpen: {
    background: theme.type === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'relative',
    zIndex: 239
  },
  item: {
    borderRadius: 0,

    '&:first-child': {
      borderTopRightRadius: 2
    },
    '&:last-child': {
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2
    }
  }
})

/**
 * A button that opens a dropdown when clicked.
 * All undocumented props are passed through to the Button.
 */
class DropdownButton extends React.Component {
  state = { open: false, left: 0, top: 0 }
  buttonRef = React.createRef()

  toggle = () => {
    const rect = findDOMNode(this.buttonRef.current).getBoundingClientRect()
    this.setState(({ open }) => ({
      open: !open,
      left: rect.left,
      top: rect.bottom,
    }))
  }

  render () {
    const { classes, items, ...other } = this.props
    const { open, top, left } = this.state

    return (
      <React.Fragment>
        <Button {...other} className={cx({[classes.buttonOpen]: open })} onClick={this.toggle} ref={this.buttonRef} />
        {open && createPortal((
          <div
            className={classes.backdrop}
            onClick={this.toggle}
          >
            <div
              className={classes.dropdown}
              style={{ position: 'absolute', top, left }}
              onClick={this.cancelClick}
            >
              {items.map(({ title, onClick }) => (
                <Button
                  key={title}
                  onClick={onClick}
                  label={title}
                  className={classes.item}
                />
              ))}
            </div>
          </div>
        ), document.body)}
      </React.Fragment>
    )
  }
}

DropdownButton.propTypes = {
  classes: PropTypes.object.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  })).isRequired
}

export default injectStyle(styles)(DropdownButton)
