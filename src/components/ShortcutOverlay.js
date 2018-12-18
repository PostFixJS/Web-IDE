import React from 'react'
import PropTypes from 'prop-types'
import injectStyle from 'react-jss'
import Dialog from '../components/Dialog'
import Button from '../components/Button'

const sectionStyles = {
  root: {
    marginBottom: 16
  },
  title: {
    fontSize: '18px',
    lineHeight: '20px',
    marginBottom: 8
  }
}

const Section = injectStyle(sectionStyles)(({ children, classes, title }) => (
  <div className={classes.root}>
    <div className={classes.title}>{title}</div>
    {children}
  </div>
))

const shortcutStyles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 4
  },
  keys: {
    display: 'inline-block',
    width: 120
  },
  description: {
    flex: 1
  }
}

const Shortcut = injectStyle(shortcutStyles)(({ children, classes, keys }) => (
  <div className={classes.root}>
    <div className={classes.keys}>{keys}</div>
    <div className={classes.description}>{children}</div>
  </div>
))

/**
 * Dialog component that displays keyboard shortcuts.
 */
export default function ShortcutOverlay ({ open, onClose }) {
  return (
    <Dialog
      width={500}
      open={open}
      onClose={onClose}
      buttons={[
        <Button
          key='ok'
          onClick={onClose}
        >
            OK
        </Button>
      ]}
    >
      <Section title='Editor'>
        <Shortcut keys='Ctrl + O'>Open a file</Shortcut>
        <Shortcut keys='Ctrl + S'>Save the editor content</Shortcut>
        <Shortcut keys='F9'>Add a breakpoint at the cursor position</Shortcut>
        <Shortcut keys='F10'>Add a conditional breakpoint at the cursor position</Shortcut>
        <Shortcut keys='Ctrl + Shift + C'>Copy the current line into the REPL</Shortcut>
      </Section>
      <Section title='Autocomplete'>
        <Shortcut keys='Ctrl + Space'>Open the autocomplete menu or toggle the documentation if it is already open</Shortcut>
        <Shortcut keys='Tab'>Insert the selected autocomplete item</Shortcut>
      </Section>
      <Section title='Run and debug'>
        <Shortcut keys='F5'>Run or continue the program</Shortcut>
        <Shortcut keys='F6'>Step through the program</Shortcut>
        <Shortcut keys='F8'>Pause a running program</Shortcut>
        <Shortcut keys='Ctrl + F5'>Stop the program</Shortcut>
      </Section>
    </Dialog>
  )
}

ShortcutOverlay.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}
