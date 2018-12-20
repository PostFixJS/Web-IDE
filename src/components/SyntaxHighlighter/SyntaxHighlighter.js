import React from 'react'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import tokenize from './monarchTokenizer'
import postFixGrammar from '../Editor/monaco-integration/MonarchTokensProvider'

const styles = (theme) => ({
  keyword: {
    color: theme.highlighting.symHighlight
  },
  comment: {
    color: theme.highlighting.comment
  },
  'type.identifier': {
    color: theme.highlighting.symType
  },
  number: {
    color: theme.highlighting.num
  },
  'number.float': {
    color: theme.highlighting.num
  },
  string: {
    color: theme.highlighting.str
  },
  'string.quote': {
    color: theme.highlighting.str
  },
  'string.escape': {
    color: theme.highlighting.str
  }
})

/**
 * Syntax highlighter for PostFix.
 */
class SyntaxHighlighter extends React.PureComponent {
  render () {
    const { children, classes } = this.props
    return (
      <React.Fragment>
        {Array.from(tokenize(postFixGrammar, children)).map(({ token, type }, i) => (
          <span key={i} className={classes[type]}>{token}</span>
        ))}
      </React.Fragment>
    )
  }
}

SyntaxHighlighter.propTypes = {
  /** @ignore */
  classes: PropTypes.object.isRequired,
  /**
   * PostFix code to be highlighted.
   */
  children: PropTypes.string.isRequired
}

export default injectSheet(styles)(SyntaxHighlighter)
