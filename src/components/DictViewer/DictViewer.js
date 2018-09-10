import React from 'react'
import PropTypes from 'prop-types'
import injectStyles from 'react-jss'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import ExpandableItem from './ExpandableItem'

const styles = {
  table: {
    fontSize: 14
  },
  tbody: {
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"'
  },
  type: {
    color: '#008080' // match syntax highlighter for types
  },
  value: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: 0,
    whiteSpace: 'nowrap'
  }
}

class DictViewer extends React.Component {
  render () {
    const { classes, dicts, invalid } = this.props

    return (
      <table className={classes.table}>
        <thead>
          <tr>
            <td>Name</td>
            <td style={{ width: '100%' }}>Value</td>
            <td>Type</td>
          </tr>
        </thead>
        <tbody className={classes.tbody} style={{ opacity: invalid ? 0.5 : 1 }}>
          {dicts.map((dict, i) => (
            <React.Fragment key={i}>
              <tr>
                <td colSpan={3}>Dictionary #{i}</td>
              </tr>
              {dict.map((item, i) => item.children && item.children.length > 0 ? (
                <ExpandableItem
                  key={i}
                  item={item}
                  depth={0}
                />
              ) : (
                <tr key={i} style={{ paddingLeft: 16 }}>
                  <td>{item.name}</td>
                  <td className={classes.value}>
                    <ObjectHighlighter objects={[item.value]} />
                  </td>
                  <td className={classes.type}>{item.type}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    )
  }
}

DictViewer.propTypes = {
  dicts: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  }))).isRequired,
  invalid: PropTypes.bool
}

export default injectStyles(styles)(DictViewer)
