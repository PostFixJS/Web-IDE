import * as types from 'postfixjs/types'
import Color from './Color'
import Pen from './Pen'
import Font from './Font'

export default class Image {
  constructor (width, height) {
    this.width = width
    this.height = height
  }

  static from (obj) {
    if (obj instanceof types.Arr && obj.items[0] instanceof types.Sym) {
      switch (obj.items[0].name) {
        case 'square':
          return Square.from(obj)
        case 'rectangle':
          return Rectangle.from(obj)
        case 'circle':
          return Circle.from(obj)
        case 'ellipse':
          return Ellipse.from(obj)
        case 'text':
          return Text.from(obj)
        case 'scale':
          return Scale.from(obj)
        case 'rotate':
          return Rotate.from(obj)
        case 'place-image':
          return PlaceImage.from(obj)
        case 'beside':
          return Beside.from(obj)
        case 'above':
          return Above.from(obj)
        case 'overlay':
          return Overlay.from(obj)
        case 'underlay':
          return Underlay.from(obj)
        default:
          throw new types.Err(`Unsupported image type ${obj.items[0].toString()}`, obj.origin)
      }
    }
    throw new types.Err('Invalid image', obj.origin)
  }
}

class Square extends Image {
  static from (obj) {
    if (obj.items.length >= 2 && obj.items[1] instanceof types.Num) {
      const size = obj.items[1].value
      let fill = null
      let stroke = null
      if (obj.items.length >= 3) fill = Color.from(obj.items[2])
      if (obj.items.length >= 4) stroke = Pen.from(obj.items[3])
      return new Rectangle(size, size, fill, stroke)
    }
    throw new types.Err('Invalid square', obj.origin)
  }
}

class Rectangle extends Image {
  constructor (width, height, fill, stroke) {
    super(width, height)
    this.fill = fill
    this.stroke = stroke
  }

  draw (ctx) {
    ctx.beginPath()
    ctx.rect(0, 0, this.width, this.height)
    if (this.fill) {
      ctx.fillStyle = this.fill.color
      ctx.fill()
    }
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color.color
      ctx.lineWidth = this.stroke.stroke
      ctx.stroke()
    }
  }

  static from (obj) {
    if (obj.items.length >= 3 && obj.items[1] instanceof types.Num && obj.items[2] instanceof types.Num) {
      const width = obj.items[1].value
      const height = obj.items[2].value
      let fill = null
      let stroke = null
      if (obj.items.length >= 4) fill = Color.from(obj.items[3])
      if (obj.items.length >= 5) stroke = Pen.from(obj.items[4])
      return new Rectangle(width, height, fill, stroke)
    }
    throw new types.Err('Invalid rectangle', obj.origin)
  }
}

class Circle extends Image {
  constructor (size, fill, stroke) {
    super(size, size)
    this.fill = fill
    this.stroke = stroke
  }

  draw (ctx) {
    ctx.beginPath()
    ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, 2 * Math.PI)
    if (this.fill) {
      ctx.fillStyle = this.fill.color
      ctx.fill()
    }
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color.color
      ctx.lineWidth = this.stroke.stroke
      ctx.stroke()
    }
  }

  static from (obj) {
    if (obj.items.length >= 2 && obj.items[1] instanceof types.Num) {
      const size = obj.items[1].value
      let fill = null
      let stroke = null
      if (obj.items.length >= 3) fill = Color.from(obj.items[2])
      if (obj.items.length >= 4) stroke = Pen.from(obj.items[3])
      return new Circle(size, fill, stroke)
    }
    throw new types.Err('Invalid circle', obj.origin)
  }
}

class Ellipse extends Image {
  constructor (width, height, fill, stroke) {
    super(width, height)
    this.fill = fill
    this.stroke = stroke
  }

  draw (ctx) {
    ctx.beginPath()
    ctx.ellipse(this.width / 2, this.height / 2, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI)
    if (this.fill) {
      ctx.fillStyle = this.fill.color
      ctx.fill()
    }
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color.color
      ctx.lineWidth = this.stroke.stroke
      ctx.stroke()
    }
  }

  static from (obj) {
    if (obj.items.length >= 3 && obj.items[1] instanceof types.Num && obj.items[2] instanceof types.Num) {
      const width = obj.items[1].value
      const height = obj.items[2].value
      let fill = null
      let stroke = null
      if (obj.items.length >= 4) fill = Color.from(obj.items[3])
      if (obj.items.length >= 5) stroke = Pen.from(obj.items[4])
      return new Ellipse(width, height, fill, stroke)
    }
    throw new types.Err('Invalid ellipse', obj.origin)
  }
}

class Text extends Image {
  constructor (text, font, fill, stroke) {
    super(Text.getTextWidth(text, font), font.size)
    this.text = text
    this.font = font
    this.fill = fill
    this.stroke = stroke
  }

  draw (ctx) {
    ctx.font = `${this.font.size}px ${this.font.name}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color.color
      ctx.lineWidth = this.stroke.stroke
      ctx.strokeText(this.text, 0, 0)
    }
    if (this.fill) {
      ctx.fillStyle = this.fill.color
      ctx.fillText(this.text, 0, 0)
    }
  }

  static getTextWidth (text, font) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = `${font.size}px ${font.name}`
    const width = ctx.measureText(text).width
    canvas.remove()
    return width
  }

  static from (obj) {
    if (obj.items.length >= 3 && obj.items[1] instanceof types.Str) {
      const text = obj.items[1].value
      const font = Font.from(obj.items[2])
      let fill = null
      let stroke = null
      if (obj.items.length >= 4) fill = Color.from(obj.items[3])
      if (obj.items.length >= 5) stroke = Pen.from(obj.items[4])
      return new Text(text, font, fill, stroke)
    }
    throw new types.Err('Invalid text', obj.origin)
  }
}

class Scale extends Image {
  constructor (scale, image) {
    super(scale * image.width, scale * image.height)
    this.image = image
    this.scale = scale
  }

  draw (ctx) {
    ctx.save()
    ctx.scale(this.scale, this.scale)
    this.image.draw(ctx)
    ctx.restore()
  }

  static from (obj) {
    if (obj.items.length === 3 && obj.items[1] instanceof types.Num) {
      return new Scale(obj.items[1].value, Image.from(obj.items[2]))
    }
    throw new types.Err('Invalid scale', obj.origin)
  }
}

class Rotate extends Image {
  constructor (angle, image) {
    super(
      Math.abs(image.height * Math.sin(angle)) + Math.abs(image.width * Math.cos(angle)),
      Math.abs(image.height * Math.cos(angle)) + Math.abs(image.width * Math.sin(angle))
    )
    this.image = image
    this.angle = angle
  }

  draw (ctx) {
    ctx.save()
    ctx.translate(this.width / 2, this.height / 2)
    ctx.rotate(this.angle)
    ctx.translate(-this.image.width / 2, -this.image.height / 2)
    this.image.draw(ctx)
    ctx.restore()
  }

  static from (obj) {
    if (obj.items.length === 3 && obj.items[1] instanceof types.Num) {
      return new Rotate(obj.items[1].value, Image.from(obj.items[2]))
    }
    throw new types.Err('Invalid rotate', obj.origin)
  }
}

class PlaceImage extends Image {
  constructor (front, back, x, y, hAlign = 'left', vAlign = 'top') {
    super(0, 0) // width and height are set below
    this.front = front
    this.back = back

    switch (hAlign) {
      case 'left':
        this.x = x
        break
      case 'center':
        this.x = x - front.width / 2
        break
      case 'right':
        this.x = x - front.width
        break
      default:
        throw new Error(`Unsupported horizontal alignment ${hAlign}`)
    }
    switch (vAlign) {
      case 'top':
        this.y = y
        break
      case 'center':
        this.y = y - front.height / 2
        break
      case 'bottom':
        this.y = y - front.height
        break
      default:
        throw new Error(`Unsupported vertical alignment ${vAlign}`)
    }
    this.width = Math.max(front.width + this.x, back.width)
    this.height = Math.max(front.height + this.y, back.height)
  }

  draw (ctx) {
    this.back.draw(ctx)
    ctx.save()
    ctx.translate(this.x, this.y)
    this.front.draw(ctx)
    ctx.restore()
  }

  static from (obj) {
    if (obj.items.length === 5 && obj.items[3] instanceof types.Num && obj.items[4] instanceof types.Num) {
      return new PlaceImage(Image.from(obj.items[1]), Image.from(obj.items[2]), obj.items[3].value, obj.items[4].value)
    } else if (obj.items.length === 7 && obj.items[3] instanceof types.Num && obj.items[4] instanceof types.Num && obj.items[5] instanceof types.Str && obj.items[6] instanceof types.Str) {
      if (!['left', 'center', 'right'].includes(obj.items[5].value)) {
        throw new types.Err(`Unsupported horizontal alignment "${obj.items[5].value}"`, obj.items[5].origin || obj.origin)
      }
      if (!['top', 'center', 'bottom'].includes(obj.items[6].value)) {
        throw new types.Err(`Unsupported vertical alignment "${obj.items[6].value}"`, obj.items[6].origin || obj.origin)
      }
      return new PlaceImage(Image.from(obj.items[1]), Image.from(obj.items[2]), obj.items[3].value, obj.items[4].value, obj.items[5].value, obj.items[6].value)
    }
    throw new types.Err('Invalid place-image', obj.origin)
  }
}

class Beside extends Image {
  constructor (images, vAlign = 'top') {
    super(
      images.reduce((sum, { width }) => width + sum, 0),
      Math.max.apply(undefined, images.map(({ height }) => height))
    )
    this.images = images
    this.vAlign = vAlign
    if (!['top', 'center', 'bottom'].includes(vAlign)) {
      throw new Error(`Unsupported vertical alignment ${vAlign}`)
    }
  }

  draw (ctx) {
    ctx.save()
    if (this.vAlign === 'top') {
      for (const image of this.images) {
        image.draw(ctx)
        ctx.translate(image.width, 0)
      }
    } else if (this.vAlign === 'center') {
      for (const image of this.images) {
        ctx.translate(0, (this.height - image.height) / 2)
        image.draw(ctx)
        ctx.translate(image.width, -(this.height - image.height) / 2)
      }
    } else if (this.vAlign === 'bottom') {
      for (const image of this.images) {
        ctx.translate(0, this.height - image.height)
        image.draw(ctx)
        ctx.translate(image.width, -(this.height - image.height))
      }
    }
    ctx.restore()
  }

  static from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Arr) {
      return new Beside(obj.items[1].items.map((image) => Image.from(image)))
    } else if (obj.items.length === 3 && obj.items[1] instanceof types.Arr && obj.items[2] instanceof types.Str) {
      if (!['top', 'center', 'bottom'].includes(obj.items[2].value)) {
        throw new types.Err(`Unsupported vertical alignment "${obj.items[2].value}"`, obj.items[2].origin || obj.origin)
      }
      return new Beside(obj.items[1].items.map((image) => Image.from(image)), obj.items[2].value)
    }
    throw new types.Err('Invalid beside', obj.origin)
  }
}

class Above extends Image {
  constructor (images, hAlign = 'left') {
    super(
      Math.max.apply(undefined, images.map(({ width }) => width)),
      images.reduce((sum, { height }) => height + sum, 0),
    )
    this.images = images
    this.hAlign = hAlign
    if (!['left', 'center', 'right'].includes(hAlign)) {
      throw new Error(`Unsupported horizontal alignment ${hAlign}`)
    }
  }

  draw (ctx) {
    ctx.save()
    if (this.hAlign === 'left') {
      for (const image of this.images) {
        image.draw(ctx)
        ctx.translate(0, image.height)
      }
    } else if (this.hAlign === 'center') {
      for (const image of this.images) {
        ctx.translate((this.width - image.width) / 2, 0)
        image.draw(ctx)
        ctx.translate(-(this.width - image.width) / 2, image.height)
      }
    } else if (this.hAlign === 'right') {
      for (const image of this.images) {
        ctx.translate(this.width - image.width, 0)
        image.draw(ctx)
        ctx.translate(-(this.width - image.width), image.height)
      }
    }
    ctx.restore()
  }

  static from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Arr) {
      return new Above(obj.items[1].items.map((image) => Image.from(image)))
    } else if (obj.items.length === 3 && obj.items[1] instanceof types.Arr && obj.items[2] instanceof types.Str) {
      if (!['left', 'center', 'right'].includes(obj.items[2].value)) {
        throw new types.Err(`Unsupported horizontal alignment "${obj.items[2].value}"`, obj.items[2].origin || obj.origin)
      }
      return new Above(obj.items[1].items.map((image) => Image.from(image)), obj.items[2].value)
    }
    throw new types.Err('Invalid above', obj.origin)
  }
}

class Underlay extends Image {
  constructor (images, hAlign = 'center', vAlign = 'center', dx = 0, dy = 0) {
    super(0, 0) // width and height are set below
    this.images = images
    this.hAlign = hAlign
    this.vAlign = vAlign
    this.dx = dx
    this.dy = dy
    this.maxImageWidth = Math.max.apply(undefined, images.map(({ width }) => width))
    this.maxImageHeight = Math.max.apply(undefined, images.map(({ height }) => height))

    if (this.dx === 0) {
      this.width = this.maxImageWidth
    } else {
      switch (this.hAlign) {
        case 'left':
          this.width = Math.max.apply(undefined, images.map(({ width }, i) => i * dx + width))
          break
        case 'center':
          this.width = Math.max.apply(undefined, images.map(({ width }, i) => (this.maxImageWidth - width) / 2 + i * dx + width))
          break
        case 'right':
          this.width = Math.max.apply(undefined, images.map((image, i) => this.maxImageWidth + i * dx))
          break
        default:
          throw new Error(`Unsupported horizontal alignment ${this.hAlign}`)
      }
    }
    if (this.dy === 0) {
      this.height = this.maxImageHeight
    } else {
      switch (this.vAlign) {
        case 'top':
          this.height = Math.max.apply(undefined, images.map(({ height }, i) => i * dy + height))
          break
        case 'center':
          this.height = Math.max.apply(undefined, images.map(({ height }, i) => (this.maxImageHeight - height) / 2 + i * dy + height))
          break
        case 'bottom':
          this.height = Math.max.apply(undefined, images.map((image, i) => this.maxImageHeight + i * dy))
          break
        default:
          throw new Error(`Unsupported horizontal alignment ${this.vAlign}`)
      }
    }
  }

  draw (ctx) {
    ctx.save()
    for (const image of this.images) {
      ctx.save()
      switch (this.hAlign) {
        case 'center':
          ctx.translate((this.maxImageWidth - image.width) / 2, 0)
          break
        case 'right':
          ctx.translate(this.maxImageWidth - image.width, 0)
          break
        default:
          break
      }
      switch (this.vAlign) {
        case 'center':
          ctx.translate(0, (this.maxImageHeight - image.height) / 2)
          break
        case 'bottom':
          ctx.translate(0, this.maxImageHeight - image.height)
          break
        default:
          break
      }
      image.draw(ctx)
      ctx.restore()
      ctx.translate(this.dx, this.dy)
    }
    ctx.restore()
  }

  static from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Arr) {
      return new Underlay(obj.items[1].items.map((image) => Image.from(image)))
    } else if (obj.items.length >= 4 && obj.items[1] instanceof types.Arr && obj.items[2] instanceof types.Str && obj.items[3] instanceof types.Str) {
      if (!['left', 'center', 'right'].includes(obj.items[2].value)) {
        throw new types.Err(`Unsupported horizontal alignment "${obj.items[2].value}"`, obj.items[2].origin || obj.origin)
      }
      if (!['top', 'center', 'bottom'].includes(obj.items[3].value)) {
        throw new types.Err(`Unsupported vertical alignment "${obj.items[3].value}"`, obj.items[3].origin || obj.origin)
      }
      if (obj.items.length === 4) {
        return new Underlay(obj.items[1].items.map((image) => Image.from(image)), obj.items[2].value, obj.items[3].value)
      } else if (obj.items.length === 6 && obj.items[4] instanceof types.Num && obj.items[5] instanceof types.Num) {
        return new Underlay(obj.items[1].items.map((image) => Image.from(image)), obj.items[2].value, obj.items[3].value, obj.items[4].value, obj.items[5].value)
      }
    }
    throw new types.Err('Invalid underlay', obj.origin)
  }
}

class Overlay extends Image {
  static from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Arr) {
      return new Underlay(obj.items[1].items.map((image) => Image.from(image)).reverse())
    } else if (obj.items.length >= 4 && obj.items[1] instanceof types.Arr && obj.items[2] instanceof types.Str && obj.items[3] instanceof types.Str) {
      if (!['left', 'center', 'right'].includes(obj.items[2].value)) {
        throw new types.Err(`Unsupported horizontal alignment "${obj.items[2].value}"`, obj.items[2].origin || obj.origin)
      }
      if (!['top', 'center', 'bottom'].includes(obj.items[3].value)) {
        throw new types.Err(`Unsupported vertical alignment "${obj.items[3].value}"`, obj.items[3].origin || obj.origin)
      }
      if (obj.items.length === 4) {
        return new Underlay(obj.items[1].items.map((image) => Image.from(image)).reverse(), obj.items[2].value, obj.items[3].value)
      } else if (obj.items.length === 6 && obj.items[4] instanceof types.Num && obj.items[5] instanceof types.Num) {
        return new Underlay(obj.items[1].items.map((image) => Image.from(image)).reverse(), obj.items[2].value, obj.items[3].value, obj.items[4].value, obj.items[5].value)
      }
    }
    throw new types.Err('Invalid overlay', obj.origin)
  }
}
