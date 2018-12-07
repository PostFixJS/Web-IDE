import React from 'react'
import injectSheet from 'react-jss'
import cx from 'classnames'

const styles = (theme) => ({
  root: {
    background: 'transparent',
    minHeight: 32,
    lineHeight: '16px',
    fontSize: '14px',
    padding: '8px 16px',
    outline: 'none',
    float: 'left',
    borderRadius: 2,
    color: theme.type === 'light' ? '#000' : '#fff',
    border: `1px solid ${theme.type === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,

    '&:hover': {
      background: theme.type === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'
    },

    '&:active': {
      background: theme.type === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
    }
  },
  primary: {
    borderColor: theme.type === 'light' ? '#000' : '#fff'
  }
})

function Button ({ children, classes, primary, ...other }) {
  return (
    <button
      className={cx(classes.root, { [classes.primary]: primary })}
      {...other}
    >
      {children}
    </button>
  )
}

export default injectSheet(styles)(Button)
