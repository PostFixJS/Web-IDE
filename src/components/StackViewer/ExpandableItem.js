import React from 'react'
import PropTypes from 'prop-types'
import injectStyles from 'react-jss'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import ShowHideToggle from '../ShowHideToggle'

const styles = (theme) => ({
  topRow: {
    userSelect: 'none'
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
 * An expandable item for the StackViewer.
 */
class ExpandableItem extends React.Component {
  state = {
    expanded: false
  }

  toggle = () => {
    this.setState(({ expanded }) => ({ expanded: !expanded }))
  }

  render () {
    const { classes, item, depth } = this.props
    const { expanded } = this.state

    return (
      <React.Fragment>
        <tr onClick={this.toggle} className={classes.topRow}>
          <td
            className={classes.value}
            style={{ paddingLeft: 16 * depth }}
          >
            <ShowHideToggle
              show={expanded}
              size={6}
              style={{ marginRight: 4 }}
            />
            {item.value}
          </td>
          <td
            className={classes.type}
          >
            {item.type}
          </td>
        </tr>
        {expanded && item.children.map((child, i) => child.children ? (
          <StyledExpandableItem
            key={i}
            item={child}
            depth={depth + 1}
          />
        ) : (
          <tr key={i} className={classes.nestedRow}>
            <td style={{ paddingLeft: 16 * (depth + 1) }}>
              <ObjectHighlighter objects={[child.value]}/>
            </td>
            <td
              className={classes.type}
            >
              {child.type}
            </td>
          </tr>
        ))}
      </React.Fragment>
    )
  }
}

ExpandableItem.propTypes = {
  /** @ignore */
  classes: PropTypes.object.isRequired,
  /**
   * The depth of this item in the tree.
   */
  depth: PropTypes.number.isRequired,
  /**
   * The variable to display.
   */
  item: PropTypes.shape({
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
  }).isRequired
}

const StyledExpandableItem = injectStyles(styles)(ExpandableItem)
export default StyledExpandableItem
