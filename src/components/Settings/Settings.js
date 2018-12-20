import React from 'react'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import { throttle } from 'throttle-debounce'
import Dialog from '../Dialog'
import Input from '../Input'
import Button from '../Button'

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
    paddingLeft: 88,
    minHeight: 88,
    background: `url(${require('./logo.svg')}) 20px 20px no-repeat`,
    backgroundSize: '48px',
    borderTop: `1px solid ${theme.background}`,
    fontSize: '10pt',
    lineHeight: '1',
    '& a': {
      color: theme.card.linkColor,
      textDecoration: 'none'
    }
  }
})

const MIN_FONT_SIZE = 8 // minimum font size supported by monaco editor
const MAX_FONT_SIZE = 100 // maximum font size supported by monaco editor

/**
 * A settings dialog for the IDE.
 */
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
        buttons={[
          <Button
            onClick={onClose}
            key='ok'
          >
            OK
          </Button>
        ]}
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

Settings.propTypes = {
  /** @ignore */
  classes: PropTypes.object.isRequired,
  /**
   * True to show the settings.
   */
  open: PropTypes.bool.isRequired,
  /**
   * Callback to be invoked when the settings should close.
   */
  onClose: PropTypes.func.isRequired,
  /**
   * The settings.
   */
  settings: PropTypes.shape({
    /**
     * The font size of the editor in pixels.
     */
    fontSize: PropTypes.number.isRequired,
    /**
     * The theme.
     */
    theme: PropTypes.oneOf(['light', 'dark']).isRequired,
    /**
     * True to enable proper tail calls.
     */
    enableProperTailCalls: PropTypes.bool.isRequired
  }).isRequired
}

export default injectSheet(styles)(Settings)
