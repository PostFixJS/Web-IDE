import React from 'react'
import PropTypes from 'prop-types'

const styles = {
  table: {
    fontSize: 14
  },
  tbody: {
    fontFamily: '"Droid Sans Mono", monospace, monospace, "Droid Sans Fallback"'
  },
  type: {
    color: '#008080' // match syntax highlighter for types
  }
}

export default class StackViewer extends React.Component {
  render () {
    const { stack, invalid } = this.props

    return (
      <table style={{ ...styles.table, opacity: invalid ? 0.5 : 1 }}>
        <thead>
          <tr>
            <td>Value</td>
            <td>Type</td>
          </tr>
        </thead>
        <tbody style={styles.tbody}>
          {stack.map((item, i) => (
            <tr key={i}>
              <td style={getValueStyle(item)}>{item.value}</td>
              <td style={styles.type}>{item.type}</td>
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

function getValueStyle ({ type, value }) {
  switch (type) {
    case ':Num':
    case ':Int':
    case ':Flt':
      return { color: '#09885a' }
    case ':Str':
      return { color: '#a31515' }
    case ':Bool':
      return { color: '#0000ff' }
    case ':Sym': {
      return value[1] === value[1].toUpperCase() ? { color: '#008080' } : {}
    }
    default:
      return {}
  }
}
