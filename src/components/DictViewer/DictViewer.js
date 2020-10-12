import React from 'react'
import PropTypes from 'prop-types'
import injectStyles from 'react-jss'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import ExpandableItem from './ExpandableItem'

const styles = (theme) => ({
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

/**
 * Tree view for the dictionary stack.
 */
class DictViewer extends React.Component {
  render () {
    const { classes, dicts, invalid, fontSize } = this.props

    return (
      <table>
        <thead>
          <tr>
            <td>Name</td>
            <td style={{ width: '100%' }}>Value</td>
            <td>Type</td>
          </tr>
        </thead>
        <tbody className={classes.tbody} style={{ opacity: invalid ? 0.5 : 1, fontSize }}>
          {dicts.map((dict, index) => (
            <React.Fragment key={index}>
              <tr>
                <td colSpan={3}>Dictionary #{dicts.length - index}</td>
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
  /** @ignore */
  classes: PropTypes.object.isRequired,
  /**
   * The dictionary stack.
   */
  dicts: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.shape({
    /**
     * Variable name
     */
    name: PropTypes.string.isRequired,
    /**
     * Variable type
     */
    type: PropTypes.string.isRequired,
    /**
     * Variable value, serialized to a string
     */
    value: PropTypes.string.isRequired
  }))).isRequired,
  /**
   * Whether or not the dictionary stack is invalid. It is invalid if it doesn't match the current
   * interpreter state, e.g. if the interpreter is running and the dict view is not updated.
   */
  invalid: PropTypes.bool,
  /**
   * The font size of the dictionary entries, in pixels.
   */
  fontSize: PropTypes.number
}

DictViewer.defaultProps = {
  fontSize: 14
}

export default injectStyles(styles)(DictViewer)
