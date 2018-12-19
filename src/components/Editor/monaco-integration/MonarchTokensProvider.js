// Based on the examples at https://microsoft.github.io/monaco-editor/monarch.html
// but customized for PostFix tokens (especially comments, symbols, ! operator, ...)

/**
 * A Monarch grammar for PostFix.
 */
export default {
  defaultToken: 'invalid', // set defaultToken to invalid to display unknown tokens in red
  escapes: /\\["rtn]/,
  start: 'root',
  keywords: [
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
      [/:[A-Z][^"\s,[\](){}]*/, 'type.identifier'],
      [/:[^"\s,[\](){}]+/, 'identifier'],
      [/[A-Z][^"\s,[\](){}]*:/, 'type.identifier'],
      [/[^"\s,[\](){}]+:/, 'identifier'],

      // identifiers and keywords (define these here to give precedence to symbols)
      [/([^0-9"\s,[\](){}][^"\s,[\](){}]*[^"\s,[\](){}!])|([^0-9"\s,[\](){}!])/, {
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
