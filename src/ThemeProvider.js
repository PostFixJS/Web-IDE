import React from 'react'
import { connect } from 'react-redux'
import { ThemeProvider as JssThemeProvider } from 'react-jss'
import * as themes from './themes'

/**
 * A component that gets the current theme from the settings (from Redux) and wraps it children into the corresponding theme provider.
 */
export default connect((state) => ({
  theme: themes[state.settings.theme]
}))(({ theme, children }) => (
  <JssThemeProvider theme={theme}>
    {children}
  </JssThemeProvider>
))
