import React from 'react'
import PropTypes from 'prop-types'
import injectStyles from 'react-jss'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import ShowHideToggle from '../ShowHideToggle'

const styles = (theme) => ({
  topRow: {
    userSelect: 'none'
  },
  name: {
    whiteSpace: 'nowrap'
  },
  type: {
    color: theme.highlighting.symType
  },
  value: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: 0,
    whiteSpace: 'nowrap'
  },
  svg: {
    marginRight: 4,
    display: 'inline-block',
    verticalAlign: 'middle'
  }
})

/**
 * An expandable item in the DictViewer.
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
          <td style={{ paddingLeft: 16 * depth }} className={classes.name}>
            {depth === 0 && (
              <ShowHideToggle
                show={expanded}
                size={6}
                className={classes.svg}
              />
            )}
            {item.name}
          </td>
          <td className={classes.value}>
            {depth > 0 && (
              <ShowHideToggle
                show={expanded}
                size={6}
                className={classes.svg}
              />
            )}
            {item.value}
          </td>
          <td className={classes.type}>
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
            <td>
              {child.name}
            </td>
            <td
              className={classes.value}
              style={{ paddingLeft: 16 * depth }}
            >
              <ObjectHighlighter objects={[child.value]}/>
            </td>
            <td className={classes.type}>
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
