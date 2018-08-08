import React from 'react'
import PropTypes from 'prop-types'
import ObjectHighlighter from '../ObjectHighlighter/ObjectHighlighter'

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
      <table style={styles.table}>
        <thead>
          <tr>
            <td>Type</td>
            <td>Value</td>
          </tr>
        </thead>
        <tbody style={{ ...styles.tbody, opacity: invalid ? 0.5 : 1 }}>
          {stack.map((item, i) => (
            <tr key={i}>
              <td style={styles.type}>{item.type}</td>
              <td><ObjectHighlighter objects={[item.value]}/></td>
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

