import React from 'react'
import injectSheet from 'react-jss'
import { throttle } from 'throttle-debounce'
import Dialog from '../Dialog'
import Input from '../Input'

const styles = (theme) => ({
  row: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: 40,
    padding: '4px 0',
    lineHeight: '32px',
    '& input': {
      flex: 1
    },
    '& input[type=checkbox]': {
      margin: 'auto'
    }
  },
  label: {
    width: 200
  },
  about: {
    clear: 'both',
    margin: '20px -20px -20px',
    padding: 20,
    borderTop: `1px solid ${theme.background}`,
    fontSize: '10pt',
    '& a': {
      color: theme.card.linkColor,
      textDecoration: 'none'
    }
  }
})

const MIN_FONT_SIZE = 8 // minimum font size supported by monaco editor
const MAX_FONT_SIZE = 100 // maximum font size supported by monaco editor

class Settings extends React.PureComponent {
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

  handleToggleProperTailCalls = (e) => {
    this.props.onProperTailCallsChange(e.target.checked)
  }

  render () {
    const {
      classes,
      open,
      onClose,
      settings: { fontSize, theme, enableProperTailCalls }
    } = this.props

    return (
      <Dialog
        open={open}
        onClose={onClose}
        width={500}
      >
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
          <Input
            type='number'
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            defaultValue={fontSize}
            onChange={this.handleFontSizeChange}
          />
        </div>
        <div className={classes.row}>
          <div className={classes.label}>
            Proper tail calls
          </div>
          <input
            type='checkbox'
            checked={enableProperTailCalls}
            onChange={this.handleToggleProperTailCalls}
          />
        </div>
        <div className={classes.about}>
          The PostFix WebIDE is a JavaScript-based IDE for the PostFix language.<br/>
          Icons made by <a href='https://smashicons.com/' rel='noopener noreferrer' target='_blank'>Smashicons</a> from <a href='https://www.flaticon.com' rel='noopener noreferrer' target='_blank'>www.flaticon.com</a>
        </div>
      </Dialog>
    )
  }
}

export default injectSheet(styles)(Settings)
