import React from 'react'
import PropTypes from 'prop-types'
import injectSheet from 'react-jss'
import cx from 'classnames'

const styles = (theme) => ({
  root: {
    background: theme.card.background,
    color: theme.card.color,
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    padding: 5,
    margin: 5,
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    fontSize: '9pt',
    lineHeight: '15px',
    fontWeight: 500,
    textTransform: 'uppercase',
    color: theme.card.titleColor,
    cursor: 'default',
    userSelect: 'none'
  },
  content: {
    flex: 1,
    overflow: 'hidden'
  },
  scrollable: {
    overflow: 'auto'
  }
})

/**
 * A card with a very thin drop shadow and slightly rounded corners.
 * Used as the basic layout element. Unknown props are applied to the root div element.
 */
function Card ({ classes, children, className, title, scrollable = false, ...other }) {
  return (
    <div className={cx(classes.root, className)} {...other}>
      {title && <div className={classes.title}>{title}</div>}
      <div className={cx(classes.content, {[classes.scrollable]: scrollable })}>
        {children}
      </div>
    </div>
  )
}

Card.defaultProps = {
  scrollable: false
}

Card.propTypes = {
  /** @ignore */
  classes: PropTypes.object.isRequired,
  /**
   * Card content.
   */
  children: PropTypes.node,
  /**
   * Additional CSS class names to apply to the card.
   */
  className: PropTypes.string,
  /**
   * Title of the card.
   */
  title: PropTypes.string,
  /**
   * True to display a scrollbar if the content is bigger than the card.
   */
  scrollable: PropTypes.bool
}

export default injectSheet(styles)(Card)
