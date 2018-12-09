import React from 'react'
import injectSheet from 'react-jss'
import * as builtIns from '../../interpreter/doc'
import FunctionEntry from './FunctionEntry'

const styles = (theme) => ({
  root: {
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)',
    background: theme.card.background,
    color: theme.card.color,
    marginLeft: 5,
    padding: 16
  }
})

class Documentation extends React.Component {
  render () {
    const { classes } = this.props
    const functions = [...builtIns.functions].sort((a, b) => a.name.localeCompare(b.name))

    return (
      <div className={classes.root}>
        {functions.map((fun) => (
          <FunctionEntry
            key={`${fun.name}-${fun.params.length}`}
            fun={fun}
          />
        ))}
      </div>
    )
  }
}

export default injectSheet(styles)(Documentation)
