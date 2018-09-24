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
        case 'scale':
          return Scale.from(obj)
        case 'rotate':
          return Rotate.from(obj)
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
    if (obj.items.length >= 2 && obj.items[1] instanceof types.Num) {
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
    if (obj.items.length >= 2 && obj.items[1] instanceof types.Num && obj.items[2] instanceof types.Num) {
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
    throw new types.Err('Invalid scale')
  }
}

class Rotate extends Image {
  constructor (angle, image) {
    super(
      Math.abs(image.height * Math.cos(angle) + image.width * Math.cos(Math.PI - angle)),
      Math.abs(image.height * Math.sin(angle) + image.width * Math.sin(Math.PI - angle))
    )
    this.image = image
    this.angle = angle
  }

  draw (ctx) {
    ctx.save()
    ctx.translate(this.image.width / 2, this.image.height / 2)
    ctx.rotate(this.angle)
    ctx.translate(-this.image.width / 2, -this.image.height / 2)
    this.image.draw(ctx)
    ctx.restore()
  }

  static from (obj) {
    if (obj.items.length === 3 && obj.items[1] instanceof types.Num) {
      return new Rotate(obj.items[1].value, Image.from(obj.items[2]))
    }
    throw new types.Err('Invalid scale')
  }
}
