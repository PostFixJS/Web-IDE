import React from 'react'
import PropTypes from 'prop-types'
import injectStyles from 'react-jss'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import ExpandableItem from './ExpandableItem'

const styles = (theme) => ({
  table: {
    fontSize: 14
  },
  tbody: {
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"'
  },
  type: {
    color: theme.highlighting.symType
  },
  value: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: 0,
    whiteSpace: 'nowrap'
  }
})

class StackViewer extends React.Component {
  render () {
    const { classes, stack, invalid } = this.props

    return (
      <table className={classes.table}>
        <thead>
          <tr>
            <td style={{ width: '100%' }}>Value</td>
            <td>Type</td>
          </tr>
        </thead>
        <tbody className={classes.tbody} style={{ opacity: invalid ? 0.5 : 1 }}>
          {stack.map((item, i) => item.children && item.children.length > 0 ? (
            <ExpandableItem
              key={i}
              item={item}
              depth={0}
            />
          ) : (
            <tr key={i}>
              <td className={classes.value}>
                <ObjectHighlighter objects={[item.value]} />
              </td>
              <td className={classes.type}>{item.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

StackViewer.propTypes = {
  stack: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  })).isRequired,
  invalid: PropTypes.bool
}

export default injectStyles(styles)(StackViewer)
