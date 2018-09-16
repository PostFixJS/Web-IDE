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

function Divider ({ classes, children, icon, label, ...other }) {
  return (
    <div className={classes.root} />
  )
}

export default injectStyle(styles)(Divider)
