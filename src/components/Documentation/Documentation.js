import React from 'react'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import * as JsSearch from 'js-search'
import { throttle } from 'throttle-debounce'
import * as builtIns from '../../interpreter/doc'
import FunctionEntry from './FunctionEntry'
import Input from '../Input';

const styles = (theme) => ({
  root: {
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)',
    background: theme.card.background,
    color: theme.card.color,
    marginLeft: 5,
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  noResults: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.5,
    fontSize: '14px'
  },
  searchBar: {
    width: '100%',
    padding: 16
  },
  search: {
    width: '100%',
    maxWidth: 700,
    float: 'right'
  },
  results: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 12px'
  }
})

let jsSearchIndex

/**
 * A documentation view that shows the documentation of all built-in operators.
 */
class Documentation extends React.PureComponent {
  state = { search: '', searchResults: [] }

  componentDidMount () {
    jsSearchIndex = new JsSearch.Search('id')
    jsSearchIndex.addIndex('name')
    jsSearchIndex.addIndex('description')
    jsSearchIndex.addIndex(['_params'])
    jsSearchIndex.addIndex(['_returns'])
    jsSearchIndex.addDocuments(builtIns.functions.map((fun) => ({
      ...fun,
      id: getFunctionId(fun),
      _params: fun.params.map((p) => p.description).join(' '),
      _returns: fun.returns.map((p) => p.description).join(' '),
    })))
  }

  handleSearchInput = (e) => {
    this.setState({ search: e.target.value })
    if (e.target.value.trim().length > 0) {
      this.doSearch(e.target.value) // indirection because the event is not persistent in React
    }
  }

  doSearch = throttle(300, (search) => {
    if (this.state.search !== '') { // otherwise, search was cancelled while waiting
      let functions
      if (search.trim() === '') {
        functions = [...builtIns.functions].sort((a, b) => a.name.localeCompare(b.name))
      } else {
        functions = jsSearchIndex.search(search)
      }
      this.setState({ searchResults: functions, search })
    }
  })

  /**
   * Clear the search and scroll the given ID into the view.
   */
  scrollIntoView = (id) => {
    this.setState({ search: '' }, () => {
      document.getElementById(id).scrollIntoView()
    })
  }

  render () {
    const { classes } = this.props
    const { search, searchResults } = this.state
    const functions = search.trim().length > 0 ? searchResults : [...builtIns.functions].sort((a, b) => a.name.localeCompare(b.name))

    return (
      <div className={classes.root}>
        <div className={classes.searchBar}>
          <Input
            value={search}
            onChange={this.handleSearchInput}
            className={classes.search}
            placeholder='Search in the documentation…'
          />
        </div>
        <div className={classes.results}>
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
      </div>
    )
  }
}

Documentation.propTypes = {
  /** @ignore */
  classes: PropTypes.object.isRequired
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
