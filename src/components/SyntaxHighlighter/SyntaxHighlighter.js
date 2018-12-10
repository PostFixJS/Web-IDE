import React from 'react'
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

export default injectSheet(styles)(SyntaxHighlighter)
