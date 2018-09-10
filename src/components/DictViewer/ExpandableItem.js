import React from 'react'
import PropTypes from 'prop-types'
import injectStyles from 'react-jss'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import ShowHideToggle from '../ShowHideToggle'

const styles = {
  table: {
    fontSize: 14
  },
  tbody: {
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"'
  },
  topRow: {
    userSelect: 'none'
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
          <td style={{ paddingLeft: 16 * depth }}>
            {depth === 0 && (
              <ShowHideToggle
                show={expanded}
                size={6}
                style={{ marginRight: 4 }}
              />
            )}
            {item.name}
          </td>
          <td className={classes.value}>
            {depth > 0 && (
              <ShowHideToggle
                show={expanded}
                size={6}
                style={{ marginRight: 4 }}
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
  classes: PropTypes.object.isRequired,
  depth: PropTypes.number.isRequired,
  item: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  }).isRequired
}

const StyledExpandableItem = injectStyles(styles)(ExpandableItem)
export default StyledExpandableItem
