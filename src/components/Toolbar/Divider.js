import React from 'react'
import injectStyle from 'react-jss'

const styles = (theme) => ({
  root: {
    borderLeft: `1px solid ${theme.divider.color}`,
    margin: '4px 8px',
    height: 24,
    float: 'left'
  }
})

/**
 * A divider for the toolbar.
 */
function Divider ({ classes }) {
  return (
    <div className={classes.root} />
  )
}

export default injectStyle(styles)(Divider)
