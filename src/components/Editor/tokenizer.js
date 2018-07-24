// Based on the examples at https://microsoft.github.io/monaco-editor/monarch.html
// but customized for PostFix tokens (especially comments, symbols, ! operator, ...)

export default {
  // Set defaultToken to invalid to see what you do not tokenize yet
  defaultToken: 'invalid',
  escapes: /\\[\\"]/,
  keywords: [
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
    'err'
  ],
  brackets: [
    ['(', ')', 'delimiter.parenthesis'],
    ['[', ']', 'delimiter.square'],
    ['{', '}', 'delimiter.curly']
  ],
  // The main tokenizer for our languages
  tokenizer: {
    root: [
      { include: '@whitespace' },
      [/[,(\->)]/, 'delimiter'],

      [/[(){}[\]]/, '@brackets'],

      // symbols
      [/:[A-Z][a-zA-Z_$]*/, 'type.identifier'],
      [/:[a-zA-Z_$]*/, 'identifier'],
      [/[A-Z][a-zA-Z_$]*:/, 'type.identifier'],
      [/[a-zA-Z_$]+:/, 'identifier'],

      // identifiers and keywords (define these here to give precedence to symbols)
      [/[a-zA-Z_$+!?]*[a-zA-Z_$+?]/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      [/!/, 'keyword'],

      // numbers
      [/\d+\.\d+/, 'number.float'],
      [/\d+e-\d+/, 'number.float'],
      [/\d+e\+?\d+/, 'number'],
      [/\d+/, 'number'],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
      [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ]
    ],
    comment: [
      [/[^#>]+/, 'comment'],
      [/#</, 'comment', '@push'],
      [/>#/, 'comment', '@pop'],
      [/[#<>]/, 'comment']
    ],
    string: [
      [/[^\\"]+/,  'string'],
      [/@escapes/, 'string.escape'],
      [/\\./,      'string.escape.invalid'],
      [/"/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
    ],
    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/#</, 'comment', '@comment'],
      [/#.*$/, 'comment']
    ]
  },
}
