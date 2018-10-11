import React from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import cx from 'classnames'
import { throttle } from 'throttle-debounce'

const styles = (theme) => ({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'none'
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
  row: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: 40,
    padding: '4px 0',
    lineHeight: '32px'
  },
  label: {
    width: 200
  }
})

const MIN_FONT_SIZE = 8 // minimum font size supported by monaco editor
const MAX_FONT_SIZE = 100 // maximum font size supported by monaco editor

class Settings extends React.PureComponent {
  handleCancelClick = (e) => {
    e.stopPropagation()
  }

  handleFontSizeChange = (e) => {
    const fontSize = parseInt(e.target.value, 10)
    if (!isNaN(fontSize)) {
      this.doFontSizeChange(Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize)))
    }
  }
  
  doFontSizeChange = throttle(200, (size) => {
    this.props.onFontSizeChange(size)
  })

  handleToggleDarkTheme = (e) => {
    if (e.target.checked) {
      this.props.onThemeChange('dark')
    } else {
      this.props.onThemeChange('light')
    }
  }

  render () {
    const {
      classes,
      open,
      onClose,
      fontSize,
      theme
    } = this.props

    return createPortal((
      <div className={cx(classes.root, { [classes.open]: open })} onClick={onClose}>
        <div className={classes.window} onClick={this.handleCancelClick}>
          <div className={classes.row}>
            <div className={classes.label}>
              Dark mode
            </div>
            <input
              type='checkbox'
              checked={theme === 'dark'}
              onChange={this.handleToggleDarkTheme}
            />
          </div>
          <div className={classes.row}>
            <div className={classes.label}>
              Font size
            </div>
            <input
              type='number'
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              defaultValue={fontSize}
              onChange={this.handleFontSizeChange}
            />
          </div>
        </div>
      </div>
    ), document.body)
  }
}

export default injectSheet(styles)(Settings)
