import React from 'react'
import injectSheet from 'react-jss'
import * as JsSearch from 'js-search'
import * as builtIns from '../../interpreter/doc'
import FunctionEntry from './FunctionEntry'

const styles = (theme) => ({
  root: {
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)',
    background: theme.card.background,
    color: theme.card.color,
    marginLeft: 5,
    padding: '8px 16px 16px',
    minHeight: '100%'
  },
  noResults: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.5,
    fontSize: '14px'
  }
})

let jsSearchIndex

class Documentation extends React.PureComponent {
  state = { search: '' }

  componentDidMount () {
    jsSearchIndex = new JsSearch.Search('id')
    jsSearchIndex.addIndex('name')
    jsSearchIndex.addIndex('description')
    jsSearchIndex.addIndex(['params', 'description'])
    jsSearchIndex.addIndex(['returns', 'description'])
    jsSearchIndex.addDocuments(builtIns.functions.map((fun) => ({
      ...fun,
      id: getFunctionId(fun)
    })))
  }

  handleSearchInput = (e) => this.setState({ search: e.target.value })

  render () {
    const { classes } = this.props
    const { search } = this.state

    let functions
    if (search.trim() === '') {
      functions = [...builtIns.functions]
        .sort((a, b) => a.name.localeCompare(b.name))
    } else {
      functions = jsSearchIndex.search(search)
    }

    return (
      <div className={classes.root}>
        <input
          value={search}
          onChange={this.handleSearchInput}
        />
        {functions.length > 0 ? functions.map((fun) => {
          const id = fun.id || getFunctionId(fun)
          return (
            <FunctionEntry
              key={id}
              id={`pfdoc-${id}`}
              fun={fun}
            />
          )
        }) : (
          <div className={classes.noResults}>
            There are no functions that match the search query.
          </div>
        )}
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
