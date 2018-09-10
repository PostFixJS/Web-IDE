import React from 'react'
import PropTypes from 'prop-types'
import injectStyles from 'react-jss'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'
import ShowHideToggle from './ShowHideToggle'

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
          <td
            className={classes.type}
            style={{ paddingLeft: 16 * depth }}
          >
            <ShowHideToggle
              show={expanded}
              size={6}
              style={{ marginRight: 4 }}
            />
            {item.type}
          </td>
          <td>
            {!expanded && item.value}
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
            <td
              className={classes.type}
              style={{ paddingLeft: 16 * (depth + 1) }}
            >
              {child.type}
            </td>
            <td><ObjectHighlighter objects={[child.value]}/></td>
          </tr>
        ))}
      </React.Fragment>
    )
  }
}

ExpandableItem.propTypes = {
  stack: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  })).isRequired,
  invalid: PropTypes.bool
}

const StyledExpandableItem = injectStyles(styles)(ExpandableItem)
export default StyledExpandableItem
