import * as types from 'postfixjs/types'

export default class Color {
  constructor (color) {
    this.color = color
  }

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
    }
    throw new types.Err('Unsupported color format', obj.origin)
  }
}

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
