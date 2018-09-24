import * as types from 'postfixjs/types'
import Color from './Color'

export default class Pen {
  constructor (color, stroke = 1) {
    this.color = color
    this.stroke = stroke
  }

  static from (obj) {
    if (obj instanceof types.Str) {
      // "red"
      return new Pen(Color.from(obj))
    } else if (obj instanceof types.Arr && obj.items.length > 0 && obj.items[0] instanceof types.Sym && obj.items[0].name === 'pen') {
      if (obj.items.length === 2) {
        // [:pen <color>]
        return new Pen(Color.from(obj.items[1]))
      } else if (obj.items.length === 3 && obj.items[2] instanceof types.Num) {
        // [:pen <color> <stroke width>]
        return new Pen(Color.from(obj.items[1]), obj.items[2].value)
      }
    } else if (obj instanceof types.Nil) {
      return null // nil is a valid pen (no pen)
    }
    throw new types.Err('Unsupported pen format', obj.origin)
  }
}
