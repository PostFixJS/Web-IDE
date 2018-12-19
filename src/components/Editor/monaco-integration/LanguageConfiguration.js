/**
 * The language configuration of PostFix for the Monaco editor.
 */
export default {
  brackets: [
    ['(', ')'],
    ['{', '}'],
    ['[', ']']
  ],
  comments: {
    lineComment: '#',
    blockComment: ['#<', '>#']
  },
  wordPattern: /([^()[\]{},\s]+)/g,
  __electricCharacterSupport: {
    docComment: {
      open: '#<',
      close: ' >#'
    }
  }
}
