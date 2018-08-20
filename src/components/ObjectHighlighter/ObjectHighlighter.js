import React from 'react'

export default function ObjectHighlighter({ objects }) {
  return (
    <React.Fragment>
      {objects.map((obj, i) => i > 0 ? (
        <React.Fragment key={i}>
          <span>, </span>
          <span style={{ color: getColor(obj) }}>{obj}</span>
        </React.Fragment>
      ) : (
        <span key={i} style={{ color: getColor(obj) }}>{obj}</span>
      ))}
    </React.Fragment>
  )
}

function getColor (value) {
  return colors[getType(value)] || '#000'
}

const highlightTypes = {
  BOOL: 1,
  STR: 2,
  SYM_TYPE: 3,
  SYM: 4,
  SYM_HIGHLIGHT: 5,
  NUM: 6
}

const colors = {
  [highlightTypes.BOOL]: '#0000ff',
  [highlightTypes.STR]: '#a31515',
  [highlightTypes.SYM_TYPE]: '#008080',
  [highlightTypes.SYM]: '#000',
  [highlightTypes.SYM_HIGHLIGHT]: '#0000ff',
  [highlightTypes.NUM]: '#09885a',
}

const keywords = [
  '!',
  'if',
  'for',
  'fori',
  'loop',
  'break',
  'breakif',
  'fun',
  'lam',
  'true',
  'false',
  'nil',
  'err',
  'debugger'
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
