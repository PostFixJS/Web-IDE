import React from 'react'
import injectStyle from 'react-jss'
import cx from 'classnames'

const styles = (theme) => ({
  root: {
    border: 0,
    background: 'transparent',
    height: 32,
    padding: 8,
    outline: 'none',
    float: 'left',
    borderRadius: 2,
    color: theme.type === 'light' ? '#000' : '#fff',
    fontSize: '12px',

    '&:hover': {
      background: theme.type === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'
    },

    '&:disabled': {
      opacity: 0.5,
      filter: 'saturate(0)',

      '&:hover': {
        background: 'transparent'
      }
    },

    '&:active': {
      background: theme.type === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
    }
  },
  icon: {
    width: 16,
    height: 16,
    display: 'block',
    float: 'left'
  },
  label: {
    lineHeight: '16px',
    float: 'left',

    'img ~ &': {
      marginLeft: 8
    }
  }
})

function Button ({ classes, children, icon, label, className, ...other }) {
  return (
    <button className={cx(classes.root, className)} {...other}>
      {icon && <img
        src={icon}
        className={classes.icon}
        alt={label || other.title}
      />}
      {label && <span className={classes.label}>{label}</span>}
      {children}
    </button>
  )
}

export default injectStyle(styles)(Button)
