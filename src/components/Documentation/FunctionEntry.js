import React from 'react'
import injectSheet from 'react-jss'
import cx from 'classnames'

const styles = (theme) => ({
  root: {
    fontSize: '14px',
    lineHeight: '18px',
    marginBottom: 36,
    '&:last-child': {
      marginBottom: 0
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
    margin: '0 0 8px',
    display: 'inline-block',
    opacity: 0.7
  },
  subtitle: {
    fontWeight: 500
  },
  description: {
    margin: '0 0 8px',
    maxWidth: 500
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
  }
})

class FunctionEntry extends React.Component {
  render () {
    const {
      classes,
      fun
    } = this.props
    const {
      name,
      description,
      params,
      returns
    } = fun

    const signature = getFunctionSignature(this.props.fun)

    return (
      <div className={classes.root}>
        <h3 className={classes.name}>{name}</h3>
        {signature && <span className={classes.synopsis}>{signature}</span>}
        <p className={classes.description}>{description}</p>
        
        <span className={classes.subtitle}>Params: </span>{params.length === 0 && <em>none</em>}
        {params.length > 0 && <table className={classes.paramsTable}>
          {params.map((param) => (
            <tr>
              <td className={classes.code}>{param.name}</td>
              <td className={cx(classes.code, classes.paramType)}>{param.type}</td>
              <td className={classes.paramDescription}>{param.description}</td>
            </tr>
          ))}
        </table>}
        
        <span className={classes.subtitle}>Returns: </span>{returns.length === 0 && <em>nothing</em>}
        {returns.length > 0 && <table className={classes.paramsTable}>
          {returns.map((ret) => (
            <tr>
              <td className={cx(classes.code, classes.paramType)}>{ret.type}</td>
              <td className={classes.paramDescription}>{ret.description}</td>
            </tr>
          ))}
        </table>}
      </div>
    )
  }
}

export default injectSheet(styles)(FunctionEntry)


/**
 * Generate markdown text for a function signature.
 * @param {object} doc DocParser output objects for a function
 * @returns Markdown string
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
