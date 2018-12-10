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
    padding: '8px 16px 16px'
  }
})

class Documentation extends React.Component {
  shouldComponentUpdate () {
    // the docs never change, no need to re-render them
    return false
  }

  componentDidMount () {
    // this is a bit hacky, but it is the only way to make a link work in Monaco markdown currently (see https://github.com/Microsoft/monaco-editor/issues/749)
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        const dataHref = e.target.dataset.href
        if (dataHref != null && dataHref.startsWith('pfdoc|')) {
          const [, id] = dataHref.split('|')
          document.getElementById(`pfdoc-${id}`).scrollIntoView()
        }
      }
    })
  }

  render () {
    const { classes } = this.props
    const functions = [...builtIns.functions].sort((a, b) => a.name.localeCompare(b.name))

    return (
      <div className={classes.root}>
        {functions.map((fun) => {
          const id = getFunctionId(fun)
          return (
            <FunctionEntry
              key={id}
              id={`pfdoc-${id}`}
              fun={fun}
            />
          )
        })}
      </div>
    )
  }
}

export default injectSheet(styles)(Documentation)

/**
 * Get a unique identifier for the given function.
 * @param {object} doc DocParser output object for a function
 * @returns {string} Unique identifier of that function
 */
export function getFunctionId ({name, params}) {
  return `${name}-${params.map(({type}) => type || 'Obj').join('-').replace(/:/g, '')}`
}
