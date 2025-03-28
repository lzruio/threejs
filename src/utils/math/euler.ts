import { Matrix4 } from './matrix4'
import { clamp, radToDeg } from './mathUtil'
// 欧拉角顺序
export type EulerOrder = 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX'
// 欧拉角(角度制)
class Euler {
  order: EulerOrder
  x: number
  y: number
  z: number
  constructor(x?: number, y?: number, z?: number, order: EulerOrder = 'ZXY') {
    this.x = x || 0
    this.y = y || 0
    this.z = z || 0
    this.order = order
  }
  // 克隆
  clone(): Euler {
    return new Euler(this.x, this.y, this.z, this.order)
  }
  // 复制
  copy(euler: Euler): void {
    this.x = euler.x
    this.y = euler.y
    this.z = euler.z
    this.order = euler.order
  }
  // 静态方法
  static FromRotationMatrix(m: Readonly<Matrix4>, order: EulerOrder = 'ZXY'): Euler {
    const euler = new Euler()
    const te = m.elements
    const m11 = te[0],
      m12 = te[4],
      m13 = te[8]
    const m21 = te[1],
      m22 = te[5],
      m23 = te[9]
    const m31 = te[2],
      m32 = te[6],
      m33 = te[10]

    let x: number, y: number, z: number
    switch (order) {
      case 'XYZ':
        y = Math.asin(clamp(m13, -1, 1))

        if (Math.abs(m13) < 0.9999999) {
          x = Math.atan2(-m23, m33)
          z = Math.atan2(-m12, m11)
        } else {
          x = Math.atan2(m32, m22)
          z = 0
        }
        // 转换为角度制
        euler.x = radToDeg(x)
        euler.y = radToDeg(y)
        euler.z = radToDeg(z)

        break

      case 'YXZ':
        x = Math.asin(-clamp(m23, -1, 1))

        if (Math.abs(m23) < 0.9999999) {
          y = Math.atan2(m13, m33)
          z = Math.atan2(m21, m22)
        } else {
          y = Math.atan2(-m31, m11)
          z = 0
        }
        euler.x = radToDeg(x)
        euler.y = radToDeg(y)
        euler.z = radToDeg(z)

        break

      case 'ZXY':
        x = Math.asin(clamp(m32, -1, 1))

        if (Math.abs(m32) < 0.9999999) {
          y = Math.atan2(-m31, m33)
          z = Math.atan2(-m12, m22)
        } else {
          y = 0
          z = Math.atan2(m21, m11)
        }
        euler.x = radToDeg(x)
        euler.y = radToDeg(y)
        euler.z = radToDeg(z)

        break

      case 'ZYX':
        y = Math.asin(-clamp(m31, -1, 1))

        if (Math.abs(m31) < 0.9999999) {
          x = Math.atan2(m32, m33)
          z = Math.atan2(m21, m11)
        } else {
          x = 0
          z = Math.atan2(-m12, m22)
        }
        euler.x = radToDeg(x)
        euler.y = radToDeg(y)
        euler.z = radToDeg(z)

        break

      case 'YZX':
        z = Math.asin(clamp(m21, -1, 1))

        if (Math.abs(m21) < 0.9999999) {
          x = Math.atan2(-m23, m22)
          y = Math.atan2(-m31, m11)
        } else {
          x = 0
          y = Math.atan2(m13, m33)
        }
        euler.x = radToDeg(x)
        euler.y = radToDeg(y)
        euler.z = radToDeg(z)

        break

      case 'XZY':
        z = Math.asin(-clamp(m12, -1, 1))

        if (Math.abs(m12) < 0.9999999) {
          x = Math.atan2(m32, m22)
          y = Math.atan2(m13, m11)
        } else {
          x = Math.atan2(-m23, m33)
          y = 0
        }
        euler.x = radToDeg(x)
        euler.y = radToDeg(y)
        euler.z = radToDeg(z)

        break

      default:
        console.warn('欧拉角顺序错误')
    }

    euler.order = order
    return euler
  }
}

export { Euler }
