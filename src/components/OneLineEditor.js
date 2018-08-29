import React from 'react'
import MonacoEditor from 'react-monaco-editor'

export default function OneLineEditor ({ options, ...other }) {
  return (
    <MonacoEditor
      height={19}
      options={{
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'hidden',
          verticalSliderSize: 0
        },
        lineNumbers: 'off',
        scrollBeyondLastLine: false,
        minimap: {
          enabled: false
        },
        overviewRulerBorder: false,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        lineDecorationsWidth: 0,
        ...options
      }}
      {...other}
    />
  )
}
