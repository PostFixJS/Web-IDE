import React from 'react'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'

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

function Input ({ classes, theme, ...other }) {
  return (
    <input
      className={classes.root}
      {...other}
    />
  )
}

Input.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default injectSheet(styles)(Input)
