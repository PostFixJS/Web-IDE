import * as types from 'postfixjs/types'

/**
 * A font that can be used for texts in images.
 */
export default class Font {
  /**
   * Create a new font instance.
   * @param {string} name Font family
   * @param {number} size Font size
   */
  constructor (name = 'Arial', size) {
    this.name = name
    this.size = size
  }

  /**
   * Create a font from a PostFix array.
   * [:font "name"] or [:font "name" size]
   * @param {Obj} obj PostFix font array
   */
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
