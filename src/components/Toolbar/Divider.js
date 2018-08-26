import React from 'react'
import injectStyle from 'react-jss'

const styles = {
  root: {
    borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
    margin: '4px 8px',
    height: 24,
    float: 'left'
  }
}

function Divider ({ classes, children, icon, label, ...other }) {
  return (
    <div className={classes.root} />
  )
}

export default injectStyle(styles)(Divider)
