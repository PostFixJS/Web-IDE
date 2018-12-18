import React from 'react'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import cx from 'classnames'
import ReactMarkdown from 'react-markdown'
import SyntaxHighlighter from '../SyntaxHighlighter/SyntaxHighlighter';

const styles = (theme) => ({
  root: {
    fontSize: '14px',
    lineHeight: '20px',
    paddingTop: 16,
    paddingBottom: 16,
    borderBottom: `1px solid ${theme.divider.color}`,
    '&:first-child': {
      paddingTop: 8
    },
    '&:last-child': {
      paddingBottom: 0,
      borderBottom: 'none'
    }
  },
  code: {
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"'
  },
  name: {
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"',
    fontSize: '16px',
    lineHeight: '18px',
    margin: 0
  },
  synopsis: {
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"',
    fontSize: '12px',
    lineHeight: '12px',
    margin: 0,
    display: 'inline-block',
    opacity: 0.7
  },
  subtitle: {
    fontWeight: 500,
    display: 'block',
    clear: 'left',
    '& > em': {
      fontWeight: 400
    }
  },
  description: {
    maxWidth: 500,
    marginTop: 8,

    '& p, & ul': {
      margin: '0 0 8px',
    }
  },
  paramsTable: {
    border: 0,
    borderSpacing: 4,
    '& td': {
      padding: 0,
      verticalAlign: 'top'
    }
  },
  paramType: {
    color: theme.highlighting.symType
  },
  paramDescription: {
    paddingLeft: '4px !important',
    maxWidth: 500
  },
  example: {
    display: 'block',
    margin: '4px 0 4px 4px',
    whiteSpace: 'pre-wrap'
  }
})

/**
 * A documentation list element for a function. Displays the description with markdown,
 * its parameters, return values and examples with syntax highlighting.
 */
class FunctionEntry extends React.Component {
  render () {
    const {
      classes,
      fun,
      ...other
    } = this.props

    const {
      name,
      description,
      params,
      returns
    } = fun

    const signature = getFunctionSignature(this.props.fun)
    const examples = this.props.fun.tags && this.props.fun.tags.example
    const examplesCount = (examples && examples.length) || 0

    return (
      <div className={classes.root} {...other}>
        <h3 className={classes.name}>{name}</h3>
        {signature && <span className={classes.synopsis}>{signature}</span>}
        <ReactMarkdown className={classes.description} source={description} />
        
        <span className={classes.subtitle}>Params: {params.length === 0 && <em>none</em>}</span>
        {params.length > 0 && (
          <table className={classes.paramsTable}>
          <tbody>
            {params.map((param) => (
              <tr key={param.name}>
                <td className={classes.code}>{param.name}</td>
                <td className={cx(classes.code, classes.paramType)}>{param.type || ':Obj'}</td>
                <td className={classes.paramDescription}>{param.description}</td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
        
        <span className={classes.subtitle}>Returns: {returns.length === 0 && <em>nothing</em>}</span>
        {returns.length > 0 && (
          <table className={classes.paramsTable}>
            <tbody>
              {returns.map((ret, i) => (
                <tr key={i}>
                  <td className={cx(classes.code, classes.paramType)}>{ret.type || ':Obj'}</td>
                  <td className={classes.paramDescription}>{ret.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {examplesCount === 1 && <span className={classes.subtitle}>Example:</span>}
        {examplesCount > 1 && <span className={classes.subtitle}>Examples:</span>}
        {examplesCount > 0 && examples.map((example, i) => (
          <pre key={i} className={classes.example}>
            <SyntaxHighlighter>{example}</SyntaxHighlighter>
          </pre>
        ))}
      </div>
    )
  }
}

export default injectSheet(styles, { inject: ['classes'] })(FunctionEntry)

FunctionEntry.propTypes = {
  /**
   * The function to show, as produced by the DocParser.
   */
  fun: PropTypes.shape({
    /**
     * The function name.
     */
    name: PropTypes.string.isRequired,
    /**
     * The function description.
     */
    description: PropTypes.string.isRequired,
    /**
     * The function parameters.
     */
    params: PropTypes.arrayOf(PropTypes.shape({
      /**
       * Parameter variable name.
       */
      name: PropTypes.string.isRequired,
      /**
       * Parameter type, defaults to :Obj.
       */
      type: PropTypes.string,
      /**
       * Parameter description.
       */
      description: PropTypes.string.isRequired,
    })).isRequired,
    /**
     * Return values.
     */
    returns: PropTypes.arrayOf(PropTypes.shape({
      /**
       * Return value type, defaults to :Obj.
       */
      type: PropTypes.string,
      /**
       * Return value description.
       */
      description: PropTypes.string.isRequired,
    })).isRequired,
    /**
     * Additional documentation tags.
     */
    tags: PropTypes.shape({
      /**
       * Usage examples of the function.
       */
      example: PropTypes.arrayOf(PropTypes.string)
    })
  }).isRequired
}

/**
 * Generate text for a function signature.
 * @param {object} doc DocParser output objects for a function
 * @returns Function signature
 */
export function getFunctionSignature (doc) {
  const params = doc.params
    .map(({ name, type }) => `${name}${type ? ` ${type}` : ''}`)
    .join(', ')
  const returns = doc.returns.map((r) => r.type).join(', ')
  if (returns.length > 0) {
    return `${params.length > 0 ? `${params} ` : ''} -> ${returns}`
  } else if (params.length > 0) {
    return `${params}`
  } else {
    return null
  }
}
