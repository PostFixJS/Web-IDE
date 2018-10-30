import React from 'react'
import { withTheme } from 'react-jss'

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

export default withTheme(ObjectHighlighter)

function shorten (value) {
  if (value.length > 100) {
    return `${value.substr(0, 100)}…`
  }
  return value
}

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
