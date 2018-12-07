import React from 'react'
import injectStyle from 'react-jss'

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
    marginLeft: 8,
    lineHeight: '16px',
    float: 'left'
  }
})

function Button ({ classes, children, icon, label, ...other }) {
  return (
    <button className={classes.root} {...other}>
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
