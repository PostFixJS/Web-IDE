import React from 'react'
import { createPortal, findDOMNode } from 'react-dom'
import injectStyle from 'react-jss'
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
    background: theme.card.background,
    width: 100,
    height: 50,
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.4)'
  }
})

class DropdownButton extends React.Component {
  state = { open: false, left: 0, top: 0 }
  buttonRef = React.createRef()

  toggle = () => {
    const rect = findDOMNode(this.buttonRef.current).getBoundingClientRect()
    console.log(rect)
    this.setState(({ open }) => ({
      open: !open,
      left: rect.left,
      top: rect.bottom,
    }))
  }

  render () {
    const { classes, items, ...other } = this.props

    return (
      <React.Fragment>
        <Button {...other} onClick={this.toggle} ref={this.buttonRef} />
        {createPortal((
          <div
            className={classes.backdrop}
            onClick={this.toggle}
            style={{ display: this.state.open ? 'block' : 'none' }}
          >
            <div
              className={classes.dropdown}
              style={{ position: 'absolute', top: this.state.top, left: this.state.left }}
              onClick={this.cancelClick}
            >
              {items.map(({ title, onClick }) => (
                <div key={title} onClick={onClick}>{title}</div>
              ))}
            </div>
          </div>
        ), document.body)}
      </React.Fragment>
    )
  }
}

export default injectStyle(styles)(DropdownButton)
