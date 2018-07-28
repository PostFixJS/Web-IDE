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

export default class DictViewer extends React.Component {
  render () {
    const { dicts, invalid } = this.props

    return (
      <table style={styles.table}>
        <thead>
          <tr>
            <td>Name</td>
            <td>Type</td>
            <td>Value</td>
          </tr>
        </thead>
        <tbody style={{ ...styles.tbody, opacity: invalid ? 0.5 : 1 }}>
          {dicts.map((dict, i) => (
            <React.Fragment key={i}>
              <tr>
                <td colSpan={3}>Dictionary #{i}</td>
              </tr>
              {dict.map((item, i) => (
                <tr key={i} style={{ paddingLeft: 16 }}>
                  <td>{item.name}</td>
                  <td style={styles.type}>{item.type}</td>
                  <td style={getValueStyle(item)}>{item.value}</td>
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
