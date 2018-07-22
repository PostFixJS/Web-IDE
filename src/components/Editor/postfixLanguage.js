export const configuration = {
  brackets: [
    ['(', ')'],
    ['{', '}'],
    ['[', ']']
  ],
  comments: {
    lineComment: '#',
    blockComment: ['#<', '>#']
  }
}

export { default as tokensProvider } from './tokenizer'
