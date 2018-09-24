import * as types from 'postfixjs/types'

export default class Font {
  constructor (name = 'Arial', size) {
    this.name = name
    this.size = size
  }

  static from (obj) {
    if (obj instanceof types.Num) {
      return new Font(undefined, obj.value)
    } else if (obj instanceof types.Arr && obj.items.length > 0 && obj.items[0] instanceof types.Sym && obj.items[0].name === 'font') {
      if (obj.items.length === 3 && obj.items[1] instanceof types.Str && obj.items[2] instanceof types.Num) {
        return new Font(obj.items[1].value, obj.items[2].value)
      }
    }
    throw new types.Err('Unsupported font format', obj.origin)
  }
}
