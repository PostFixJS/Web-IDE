import React from 'react'
import injectSheet from 'react-jss'
import cx from 'classnames'

const styles = {
  root: {
    background: '#fff',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    padding: 5,
    margin: 5,
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    fontSize: '9pt',
    fontWeight: 500,
    textTransform: 'uppercase',
    color: 'rgba(0, 0, 0, 0.5)',
    cursor: 'default',
    userSelect: 'none'
  },
  content: {
    flex: 1
  },
  scrollable: {
    overflow: 'auto'
  }
}

function Card ({ classes, children, className, title, scrollable = false, ...other }) {
  return (
    <div className={cx(classes.root, className)} {...other}>
      {title && <div className={classes.title}>{title}</div>}
      <div className={cx(classes.content, {[classes.scrollable]: scrollable })}>
        {children}
      </div>
    </div>
  )
}

export default injectSheet(styles)(Card)
