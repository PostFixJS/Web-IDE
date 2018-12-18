import React from 'react'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import cx from 'classnames'

const styles = (theme) => ({
  root: {
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
})

/**
 * A styled input component that uses the theme.
 * All props are passed through to the HTML input component.
 */
function Input ({ classes, className, ...other }) {
  return (
    <input
      className={cx(classes.root, className)}
      {...other}
    />
  )
}

Input.propTypes = {
  /** @ignore */
  classes: PropTypes.object.isRequired,
  /**
   * Additional CSS classes to be applied to the input element.
   */
  className: PropTypes.string
}

export default injectSheet(styles, { inject: ['classes'] })(Input)
