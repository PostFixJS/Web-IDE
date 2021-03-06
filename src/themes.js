import * as monaco from 'monaco-editor'

monaco.editor.defineTheme('webide-light', {
  base: 'vs',
  inherit: true,
  colors: {
    // monaco-editor displays warnings in green by default, which doesn't really make sense
    'editorWarning.foreground': '#ffa311',
    'editorOverviewRuler.warningForeground': '#ffa311'
  },
  rules: []
})

monaco.editor.defineTheme('webide-dark', {
  base: 'vs-dark',
  inherit: true,
  colors: {
    // monaco-editor displays warnings in green by default, which doesn't really make sense
    'editorWarning.foreground': '#ffa311',
    'editorOverviewRuler.warningForeground': '#ffa311'
  },
  rules: []
})

export const light = {
  type: 'light',
  monaco: {
    baseTheme: 'webide-light'
  },
  background: '#efefef',
  card: {
    background: '#fff',
    color: '#000',
    titleColor: 'rgba(0, 0, 0, 0.5)',
    highlightColor: 'rgb(0, 122, 204)',
    linkColor: 'rgb(0, 122, 204)'
  },
  highlighting: {
    bool: '#0000ff',
    str: '#a31515',
    symType: '#008080',
    sym: '#000',
    symHighlight: '#0000ff',
    num: '#09885a',
    comment: '#008000'
  },
  divider: {
    color: 'rgba(0, 0, 0, 0.1)'
  },
  input: {
    borderColor: 'rgb(0, 122, 204)',
    background: 'rgba(0, 0, 0, 0.05)',
    color: '#000'
  }
}

export const dark = {
  type: 'dark',
  monaco: {
    baseTheme: 'webide-dark'
  },
  background: '#2f2f2f',
  card: {
    background: '#1e1e1e',
    color: '#fff',
    titleColor: 'rgba(255, 255, 255, 0.8)',
    highlightColor: 'rgb(0, 122, 204)',
    linkColor: '#569cd6'
  },
  highlighting: {
    bool: '#569cd6',
    str: '#ce9178',
    symType: '#3dc9b0',
    sym: '#d4d4d4',
    symHighlight: '#569cd6',
    num: '#b5cea8',
    comment: '#608b4e'
  },
  divider: {
    color: 'rgba(255, 255, 255, 0.2)'
  },
  input: {
    borderColor: 'rgb(0, 122, 204)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff'
  }
}
