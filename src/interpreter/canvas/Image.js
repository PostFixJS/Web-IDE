import * as types from 'postfixjs/types'
import Color from './Color'
import Pen from './Pen'
import Font from './Font'

/**
 * An image. This is the super class of everything that can be drawn, e.g. rectangles and bitmaps.
 */
export default class Image {
  /**
   * Create a new image.
   * @param {number} width Width of the image
   * @param {number} height Height of the image
   */
  constructor (width, height) {
    this.width = width
    this.height = height
  }

  /**
   * Create an image from the given PostFix array. Throws an error if the object does not match any shape.
   * @param {Obj} obj PostFix object
   */
  static async from (obj) {
    if (obj instanceof types.Arr && obj.items[0] instanceof types.Sym) {
      const firstTag = obj.items.findIndex((item, i) => i > 0 && item instanceof types.Sym)
      const shape = firstTag < 0 ? obj : new types.Arr(obj.items.slice(0, firstTag))
      shape.origin = obj.origin
      const taggedValues = new types.Arr(firstTag < 0 ? [] : obj.items.slice(firstTag))
      taggedValues.origin = obj.origin

      const image = await (() => {
        switch (shape.items[0].name) {
          case 'square':
            return Square.from(shape)
          case 'rectangle':
            return Rectangle.from(shape)
          case 'circle':
            return Circle.from(shape)
          case 'ellipse':
            return Ellipse.from(shape)
          case 'text':
            return Text.from(shape)
          case 'scale':
            return Scale.from(shape)
          case 'rotate':
            return Rotate.from(shape)
          case 'place-image':
            return PlaceImage.from(shape)
          case 'beside':
            return Beside.from(shape)
          case 'above':
            return Above.from(shape)
          case 'overlay':
            return Overlay.from(shape)
          case 'underlay':
            return Underlay.from(shape)
          case 'bitmap':
            return Bitmap.from(shape)
          default:
            throw new types.Err(`Unsupported image type ${obj.items[0].toString()}`, obj.origin)
        }
      })()
      image.taggedValues = taggedValues
      return image
    }
    throw new types.Err('Invalid image', obj.origin)
  }
}

/**
 * A square image.
 */
class Square extends Image {
  static from (obj) {
    if (obj.items.length >= 2 && obj.items[1] instanceof types.Num) {
      const size = obj.items[1].value
      let fill = "#000"
      let stroke = null
      if (obj.items.length >= 3) fill = Color.from(obj.items[2])
      if (obj.items.length >= 4) stroke = Pen.from(obj.items[3])
      return new Rectangle(size, size, fill, stroke)
    }
    throw new types.Err('Invalid square', obj.origin)
  }
}

/**
 * A rectangle image.
 */
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

  getImagesAt (x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height ? [{ image: this, x, y }] : []
  }

  static from (obj) {
    if (obj.items.length >= 3 && obj.items[1] instanceof types.Num && obj.items[2] instanceof types.Num) {
      const width = obj.items[1].value
      const height = obj.items[2].value
      let fill = "#000"
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

  getImagesAt (x, y) {
    const radius = this.width / 2
    const xCenter = x - radius
    const yCenter = y - radius
    return Math.pow(xCenter, 2) + Math.pow(yCenter, 2) <= Math.pow(radius, 2) ? [{ image: this, x, y }] : []
  }

  static from (obj) {
    if (obj.items.length >= 2 && obj.items[1] instanceof types.Num) {
      const size = obj.items[1].value
      let fill = "#000"
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

  getImagesAt (x, y) {
    const radiusX = this.width / 2
    const radiusY = this.height / 2
    const xCenter = x - radiusX
    const yCenter = y - radiusY
    return Math.pow(xCenter, 2) / Math.pow(radiusX, 2) + Math.pow(yCenter, 2) / Math.pow(radiusY, 2) <= 1 ? [{ image: this, x, y }] : []
  }

  static from (obj) {
    if (obj.items.length >= 3 && obj.items[1] instanceof types.Num && obj.items[2] instanceof types.Num) {
      const width = obj.items[1].value
      const height = obj.items[2].value
      let fill = "#000"
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

  getImagesAt (x, y) {
    // TODO perform an actual hit test against the text
    return x >= 0 && y >= 0 && x < this.width && y < this.height ? [{ image: this, x, y }] : []
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
      let fill = "#000"
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

  getImagesAt (x, y) {
    const hits = this.image.getImagesAt(x / this.scale, y / this.scale)
    if (hits.length > 0) {
      return [...hits, { image: this, x, y }]
    }
    return []
  }

  static async from (obj) {
    if (obj.items.length === 3 && obj.items[1] instanceof types.Num) {
      return new Scale(obj.items[1].value, await Image.from(obj.items[2]))
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

  getImagesAt (x, y) {
    // rotate the point around the center, then perform a hit test as usual
    // https://www.encyclopediaofmath.org/index.php/Rotation
    const { width, height } = this
    const angle = -this.angle
    const rotX = Math.cos(angle) * (x - width / 2) - Math.sin(angle) * (y - height / 2) + this.image.width / 2
    const rotY = Math.sin(angle) * (x - width / 2) + Math.cos(angle) * (y - height / 2) + this.image.height / 2
    const hits = this.image.getImagesAt(rotX, rotY)
    if (hits.length > 0) {
      return [...hits, { image: this, x, y }]
    }
    return []
  }

  static async from (obj) {
    if (obj.items.length === 3 && obj.items[1] instanceof types.Num) {
      return new Rotate(obj.items[1].value, await Image.from(obj.items[2]))
    }
    throw new types.Err('Invalid rotate', obj.origin)
  }
}

class PlaceImage extends Image {
  constructor (front, back, x, y, hAlign = 'center', vAlign = 'center') {
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
    this.width = back.width
    this.height = back.height
  }

  draw (ctx) {
    this.back.draw(ctx)
    ctx.save()
    ctx.rect(0, 0, this.back.width, this.back.height)
    ctx.clip()
    ctx.translate(this.x, this.y)
    this.front.draw(ctx)
    ctx.restore()
  }

  getImagesAt (x, y) {
    let hits = this.front.getImagesAt(x - this.x, y - this.y)
    if (hits.length === 0) {
      hits = this.back.getImagesAt(x, y)
    }
    if (hits.length > 0) {
      return [...hits, { image: this, x, y }]
    }
    return []
  }

  static async from (obj) {
    if (obj.items.length === 5 && obj.items[3] instanceof types.Num && obj.items[4] instanceof types.Num) {
      const [imageA, imageB] = await Promise.all([Image.from(obj.items[1]), Image.from(obj.items[2])])
      return new PlaceImage(imageA, imageB, obj.items[3].value, obj.items[4].value)
    } else if (obj.items.length === 7 && obj.items[3] instanceof types.Num && obj.items[4] instanceof types.Num && obj.items[5] instanceof types.Str && obj.items[6] instanceof types.Str) {
      if (!['left', 'center', 'right'].includes(obj.items[5].value)) {
        throw new types.Err(`Unsupported horizontal alignment "${obj.items[5].value}"`, obj.items[5].origin || obj.origin)
      }
      if (!['top', 'center', 'bottom'].includes(obj.items[6].value)) {
        throw new types.Err(`Unsupported vertical alignment "${obj.items[6].value}"`, obj.items[6].origin || obj.origin)
      }
      const [imageA, imageB] = await Promise.all([Image.from(obj.items[1]), Image.from(obj.items[2])])
      return new PlaceImage(imageA, imageB, obj.items[3].value, obj.items[4].value, obj.items[5].value, obj.items[6].value)
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

  getImagesAt (x, y) {
    let offsetX = 0
    if (this.vAlign === 'top') {
      for (const image of this.images) {
        const hits = image.getImagesAt(x - offsetX, y)
        if (hits.length > 0) {
          return [...hits, { image: this, x, y }]
        }
        offsetX += image.width
      }
    } else if (this.vAlign === 'center') {
      for (const image of this.images) {
        const hits = image.getImagesAt(x - offsetX, y - (this.height - image.height) / 2)
        if (hits.length > 0) {
          return [...hits, { image: this, x, y }]
        }
        offsetX += image.width
      }
    } else if (this.vAlign === 'bottom') {
      for (const image of this.images) {
        const hits = image.getImagesAt(x - offsetX, y - (this.height - image.height))
        if (hits.length > 0) {
          return [...hits, { image: this, x, y }]
        }
        offsetX += image.width
      }
    }
    return []
  }

  static async from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Arr) {
      return new Beside(await Promise.all(obj.items[1].items.map((image) => Image.from(image))))
    } else if (obj.items.length === 3 && obj.items[1] instanceof types.Arr && obj.items[2] instanceof types.Str) {
      if (!['top', 'center', 'bottom'].includes(obj.items[2].value)) {
        throw new types.Err(`Unsupported vertical alignment "${obj.items[2].value}"`, obj.items[2].origin || obj.origin)
      }
      return new Beside(await Promise.all(obj.items[1].items.map((image) => Image.from(image))), obj.items[2].value)
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

  getImagesAt (x, y) {
    let offsetY = 0
    if (this.hAlign === 'left') {
      for (const image of this.images) {
        const hits = image.getImagesAt(x, y - offsetY)
        if (hits.length > 0) {
          return [...hits, { image: this, x, y }]
        }
        offsetY += image.height
      }
    } else if (this.hAlign === 'center') {
      for (const image of this.images) {
        const hits = image.getImagesAt(x - (this.width - image.width) / 2, y - offsetY)
        if (hits.length > 0) {
          return [...hits, { image: this, x, y }]
        }
        offsetY += image.height
      }
    } else if (this.hAlign === 'right') {
      for (const image of this.images) {
        const hits = image.getImagesAt(x - (this.width - image.width), y - offsetY)
        if (hits.length > 0) {
          return [...hits, { image: this, x, y }]
        }
        offsetY += image.height
      }
    }
    return []
  }

  static async from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Arr) {
      return new Above(await Promise.all(obj.items[1].items.map((image) => Image.from(image))))
    } else if (obj.items.length === 3 && obj.items[1] instanceof types.Arr && obj.items[2] instanceof types.Str) {
      if (!['left', 'center', 'right'].includes(obj.items[2].value)) {
        throw new types.Err(`Unsupported horizontal alignment "${obj.items[2].value}"`, obj.items[2].origin || obj.origin)
      }
      return new Above(await Promise.all(obj.items[1].items.map((image) => Image.from(image))), obj.items[2].value)
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

  getImagesAt (x, y) {
    let offsetX = 0
    let offsetY = 0
    let lastHits = []
  
    for (const image of this.images) {
      let imageOffsetX = 0
      let imageOffsetY = 0
      if (this.hAlign === 'center') {
        imageOffsetX = (this.maxImageWidth - image.width) / 2
      } else if (this.hAlign === 'right') {
        imageOffsetX = this.maxImageWidth - image.width
      }
      if (this.vAlign === 'center') {
        imageOffsetY = (this.maxImageHeight - image.height) / 2
      } else if (this.vAlign === 'bottom') {
        imageOffsetY = this.maxImageHeight - image.height
      }

      const hits = image.getImagesAt(x - offsetX - imageOffsetX, y - offsetY - imageOffsetY)
      if (hits.length > 0) {
        lastHits = hits
      }

      offsetX += this.dx
      offsetY += this.dy
    }

    if (lastHits.length > 0) {
      return [...lastHits, { image: this, x, y }]
    }
    return []
  }

  static async from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Arr) {
      return new Underlay(await Promise.all(obj.items[1].items.map((image) => Image.from(image))))
    } else if (obj.items.length >= 4 && obj.items[1] instanceof types.Arr && obj.items[2] instanceof types.Str && obj.items[3] instanceof types.Str) {
      if (!['left', 'center', 'right'].includes(obj.items[2].value)) {
        throw new types.Err(`Unsupported horizontal alignment "${obj.items[2].value}"`, obj.items[2].origin || obj.origin)
      }
      if (!['top', 'center', 'bottom'].includes(obj.items[3].value)) {
        throw new types.Err(`Unsupported vertical alignment "${obj.items[3].value}"`, obj.items[3].origin || obj.origin)
      }
      if (obj.items.length === 4) {
        return new Underlay(await Promise.all(obj.items[1].items.map((image) => Image.from(image))), obj.items[2].value, obj.items[3].value)
      } else if (obj.items.length === 6 && obj.items[4] instanceof types.Num && obj.items[5] instanceof types.Num) {
        return new Underlay(await Promise.all(obj.items[1].items.map((image) => Image.from(image))), obj.items[2].value, obj.items[3].value, obj.items[4].value, obj.items[5].value)
      }
    }
    throw new types.Err('Invalid underlay', obj.origin)
  }
}

class Overlay extends Image {
  static async from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Arr) {
      return new Underlay(await Promise.all(obj.items[1].items.map((image) => Image.from(image)).reverse()))
    } else if (obj.items.length >= 4 && obj.items[1] instanceof types.Arr && obj.items[2] instanceof types.Str && obj.items[3] instanceof types.Str) {
      if (!['left', 'center', 'right'].includes(obj.items[2].value)) {
        throw new types.Err(`Unsupported horizontal alignment "${obj.items[2].value}"`, obj.items[2].origin || obj.origin)
      }
      if (!['top', 'center', 'bottom'].includes(obj.items[3].value)) {
        throw new types.Err(`Unsupported vertical alignment "${obj.items[3].value}"`, obj.items[3].origin || obj.origin)
      }
      if (obj.items.length === 4) {
        return new Underlay(await Promise.all(obj.items[1].items.map((image) => Image.from(image)).reverse()), obj.items[2].value, obj.items[3].value)
      } else if (obj.items.length === 6 && obj.items[4] instanceof types.Num && obj.items[5] instanceof types.Num) {
        return new Underlay(await Promise.all(obj.items[1].items.map((image) => Image.from(image)).reverse()), obj.items[2].value, obj.items[3].value, obj.items[4].value, obj.items[5].value)
      }
    }
    throw new types.Err('Invalid overlay', obj.origin)
  }
}

/**
 * A bitmap image that is downloaded from a URL.
 */
class Bitmap extends Image {
  /**
   * Create a bitmap of the given image.
   * @param {HTMLImageElement} img Image
   */
  constructor (img) {
    super(img.width, img.height)
    this.img = img
  }

  /**
   * Draw this bitmap.
   * @param {CanvasRenderingContext2D} ctx Canvas context
   */
  draw (ctx) {
    ctx.drawImage(this.img, 0, 0)
  }

  getImagesAt (x, y) {
    // TODO maybe check the alpha value of the clicked pixel
    return x >= 0 && y >= 0 && x < this.width && y < this.height ? [{ image: this, x, y }] : []
  }

  /**
   * Download the image and create a new Bitmap object.
   * @param {Obj} obj PostFix object, e.g. [:bitmap "url"]
   */
  static async from (obj) {
    if (obj.items.length === 2 && obj.items[1] instanceof types.Str) {
      return new Promise((resolve, reject) => {
          const img = new window.Image()  
          img.onload = () => resolve(new Bitmap(img))
          img.onerror = () => reject(new types.Err('Could not load image', obj.origin))
          img.src = obj.items[1].value
      })
    } else {
      throw new types.Err('Invalid bitmap', obj.origin)
    }
  }
}
