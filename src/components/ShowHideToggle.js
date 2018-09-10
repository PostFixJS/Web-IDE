import React from 'react'
import PropTypes from 'prop-types'

/**
 * A toggle component that animates a triangle between ▶ and ◢.
 */
export default function ShowHideToggle ({ show, size, style, ...other }) {
  return (
    <svg
      style={{
        transition: 'all 100ms',
        transform: show ? 'rotate(0)' : 'rotate(-45deg)',
        width: size,
        height: size,
        ...style
      }}
      viewBox='0 0 16 16'
      {...other}
    >
      <g>
        <path
          d='M 16 0 L 16 16 L 0 16 Z'
          fill='#4d4d4d'
        />
      </g>
    </svg>
  )
}

ShowHideToggle.propTypes = {
  /**
   * True to show the open state (◢), false to show the closed state (▶).
   */
  show: PropTypes.bool.isRequired,
  /**
   * The size of the icon, in pixels.
   */
  size: PropTypes.number.isRequired,
  /**
   * Additional styles to be applied to the svg image.
   */
  style: PropTypes.object
}
