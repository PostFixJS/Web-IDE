import * as types from 'postfixjs/types'

/**
 * A color that can be used in images.
 */
export default class Color {
  /**
   * Create a new color instance.
   * @param {string} color Color
   */
  constructor (color) {
    this.color = color
  }

  /**
   * Create a color from a PostFix array.
   * [:color "name"], [:color "name" alpha], [:color r g b] or [:color r g b a]
   * @param {Obj} obj PostFix color array
   */
  static from (obj) {
    if (obj instanceof types.Str) {
      // "red"
      return new Color(obj.value)
    } else if (obj instanceof types.Arr && obj.items.length > 0 && obj.items[0] instanceof types.Sym && obj.items[0].name === 'color') {
      if (obj.items.length === 2 && obj.items[1] instanceof types.Str) {
        // [:color "red"]
        return new Color(obj.items[1].value)
      } else if (obj.items.length === 3 && obj.items[1] instanceof types.Str && obj.items[2] instanceof types.Num) {
        // [:color "red" 0.5]
        const { r, g, b } = colorToRgb(obj.items[1].value)
        return new Color(`rgba(${r}, ${g}, ${b}, ${obj.items[2].value})`)
      } else if (obj.items.length === 4 && obj.items[1] instanceof types.Num && obj.items[2] instanceof types.Num && obj.items[3] instanceof types.Num) {
        // [:color r g b]
        return new Color(`rgb(${Math.floor(obj.items[1].value * 255)}, ${Math.floor(obj.items[2].value * 255)}, ${Math.floor(obj.items[3].value * 255)})`)
      } else if (obj.items.length === 4 && obj.items[1] instanceof types.Num && obj.items[2] instanceof types.Num && obj.items[3] instanceof types.Num && obj.items[4] instanceof types.Num) {
        // [:color r g b a]
        return new Color(`rgba(${Math.floor(obj.items[1].value * 255)}, ${Math.floor(obj.items[2].value * 255)}, ${Math.floor(obj.items[3].value * 255)}, ${obj.items[4].value})`)
      }
    } else if (obj instanceof types.Nil) {
      return null // nil is a valid color (no color)
    }
    throw new types.Err('Unsupported color format', obj.origin)
  }
}

/**
 * Convert the given color name or hex code to an rgb color.
 * @param {string} color Color name or hex code
 */
function colorToRgb (color) {
  // https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-fillstyle

  const ctx = document.createElement('canvas').getContext('2d')
  ctx.fillStyle = color
  const normalizedColor = ctx.fillStyle // either hex or rgba
  if (normalizedColor[0] === '#') {
    return {
      r: parseInt(normalizedColor.substr(1, 2), 16),
      g: parseInt(normalizedColor.substr(3, 2), 16),
      b: parseInt(normalizedColor.substr(5, 2), 16)
    }
  }
}
