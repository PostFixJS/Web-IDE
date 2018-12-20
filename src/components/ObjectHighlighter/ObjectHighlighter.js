import React from 'react'
import PropTypes from 'prop-types'
import { withTheme } from 'react-jss'

/**
 * A highlighter for PostFix object arrays.
 * This is similar to a syntax highlighter but uses previously tokenized strings.
 */
function ObjectHighlighter({ objects, theme }) {
  return (
    <React.Fragment>
      {objects.map((obj, i) => i > 0 ? (
        <React.Fragment key={i}>
          <span>, </span>
          <span style={{ color: getColor(obj, theme) }} title={obj}>{shorten(obj)}</span>
        </React.Fragment>
      ) : (
        <span key={i} style={{ color: getColor(obj, theme) }} title={obj}>{shorten(obj)}</span>
      ))}
    </React.Fragment>
  )
}

ObjectHighlighter.propTypes = {
  /**
   * The objects to highlight, as an array of strings.
   */
  objects: PropTypes.arrayOf(PropTypes.string).isRequired,
  /**
   * The current theme, automatically injected.
   * @ignore
   */
  theme: PropTypes.object.isRequired
}

export default withTheme(ObjectHighlighter)

/**
 * Shorten the given string.
 * @param {string} value A string
 * @returns The string shortened to maximum 100 characters
 */
function shorten (value) {
  if (value.length > 100) {
    return `${value.substr(0, 100)}…`
  }
  return value
}

/**
 * Get the color for the given PostFix object.
 * @param {string} value PostFix value
 * @param {object} theme Editor theme
 * @returns {string} Color for highlighting the object
 */
function getColor (value, theme) {
  return theme.highlighting[getType(value)] || '#000'
}

const highlightTypes = {
  BOOL: 'bool',
  STR: 'str',
  SYM_TYPE: 'symType',
  SYM: 'sym',
  SYM_HIGHLIGHT: 'symHighlight',
  NUM: 'num'
}

const keywords = [
  '!',
  'if',
  'cond',
  'cond-fun',
  'for',
  'fori',
  'loop',
  'break',
  'breakif',
  'fun',
  'lam',
  'update-lam',
  'true',
  'false',
  'nil',
  'err',
  'debugger',
  'datadef'
]
/**
 * Get the type of the given PostFix object.
 * @param {string} value PostFix object value
 * @returns {string} Type of the object
 */
function getType (value) {
  if (value === 'true' || value === 'false') {
    return highlightTypes.BOOL
  }

  const first = value[0]
  const last = value[value.length - 1]
  if (first === '"' && last === '"') {
    return highlightTypes.STR
  } else if (first === ':') {
    if (value[1].toUpperCase() === value[1]) {
      return highlightTypes.SYM_TYPE
    }
    return highlightTypes.SYM
  } else if (last === ':') {
    if (first.toUpperCase() === first) {
      return highlightTypes.SYM_TYPE
    }
    return highlightTypes.SYM
  } else if (!isNaN(value)) {
    return highlightTypes.NUM
  } else if (keywords.includes(value)) {
    return highlightTypes.SYM_HIGHLIGHT
  } else {
    return highlightTypes.SYM
  }
}
