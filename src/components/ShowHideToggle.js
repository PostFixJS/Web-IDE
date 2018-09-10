import React from 'react'
import PropTypes from 'prop-types'
import toggle from './toggle.svg'

/**
 * A toggle component that animates a triangle between ▶ and ◢.
 */
export default function ShowHideToggle ({ show, size, style, ...other }) {
  return (
    <img
      src={toggle}
      style={{
        transition: 'all 100ms',
        transform: show ? 'rotate(0)' : 'rotate(-45deg)',
        width: size,
        height: size,
        ...style
      }}
      {...other}
    />
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
   * Additional styles to be applied to the image.
   */
  style: PropTypes.object
}
