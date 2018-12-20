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
 * A tree view for the stack of the interpreter.
 */
class StackViewer extends React.Component {
  render () {
    const { classes, stack, invalid, fontSize } = this.props

    return (
      <table>
        <thead>
          <tr>
            <td style={{ width: '100%' }}>Value</td>
            <td>Type</td>
          </tr>
        </thead>
        <tbody className={classes.tbody} style={{ opacity: invalid ? 0.5 : 1, fontSize }}>
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
  /**
   * The stack elements.
   */
  stack: PropTypes.arrayOf(PropTypes.shape({
    /**
     * Element type.
     */
    type: PropTypes.string.isRequired,
    /**
     * Element value, serialized to a string.
     */
    value: PropTypes.string.isRequired,
    /**
     * Children of the element, e.g. array items.
     */
    children: PropTypes.arrayOf(PropTypes.shape({
      /**
       * Children type.
       */
      type: PropTypes.string.isRequired,
      /**
       * Children value, serialized to a string.
       */
      value: PropTypes.string.isRequired,
      /**
       * Nested children elements.
       */
      children: PropTypes.array
    }))
  })).isRequired,
  /**
   * True to change the opacity of the stack, e.g. if it is not up to date while the program is running.
   */
  invalid: PropTypes.bool,
  /**
   * The font size in pixels.
   */
  fontSize: PropTypes.number
}

StackViewer.defaultProps = {
  fontSize: 14
}

export default injectStyles(styles)(StackViewer)
