/*
 * @FilePath: \kjlordervue\src\utils\mathUtil\vector4.ts
 * @Description:
 * @Author: lzr
 * @Version: 0.0.1
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-19 08:59:21
 */
// 向量
class Vector4 {
  x: number
  y: number
  z: number
  w: number
  constructor(x: number, y: number, z: number, w: number) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }
  set(x: number, y: number, z: number, w: number): void {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }
  clone(): Vector4 {
    return new Vector4(this.x, this.y, this.z, this.w)
  }
  // 复制
  copy(v: Readonly<Vector4>): void {
    this.x = v.x
    this.y = v.y
    this.z = v.z
    this.w = v.w
  }
  // 加法
  add(v: Readonly<Vector4>): Vector4 {
    const t = this.clone()
    t.x += v.x
    t.y += v.y
    t.z += v.z
    t.w += v.w
    return t
  }
  // 减法
  sub(v: Readonly<Vector4>): Vector4 {
    const t = this.clone()
    t.x -= v.x
    t.y -= v.y
    t.z -= v.z
    t.w -= v.w
    return t
  }
  // 点积
  dot(v: Readonly<Vector4>): number {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w
  }
  // 对应位置相乘
  mul(v: Readonly<Vector4>): Vector4 {
    return new Vector4(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w)
  }
  // 叉积
  cross(v: Readonly<Vector4>): Vector4 {
    return new Vector4(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x,
      this.w,
    )
  }
  // 放缩
  scale(s: number): Vector4 {
    return new Vector4(this.x * s, this.y * s, this.z * s, this.w * s)
  }
  // 长度
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)
  }
  // 距离
  distanceTo(v: Readonly<Vector4>): number {
    return this.sub(v).length()
  }
  // 归一化
  normalize(): Vector4 {
    const len = this.length()
    return this.scale(1 / len)
  }
  // 是否相等
  equals(v: Readonly<Vector4>, epsilon: number = 0.001): boolean {
    return (
      Math.abs(this.x - v.x) < epsilon &&
      Math.abs(this.y - v.y) < epsilon &&
      Math.abs(this.z - v.z) < epsilon &&
      Math.abs(this.w - v.w) < epsilon
    )
  }
  // 取反
  negate(): Vector4 {
    return new Vector4(-this.x, -this.y, -this.z, -this.w)
  }

  // 小于等于，考虑浮点数精度
  lessThanOrEqual(v: Readonly<Vector4>, checkW: boolean = false): boolean {
    return this.x <= v.x && this.y <= v.y && this.z <= v.z && (checkW ? this.w <= v.w : true)
  }

  // 大于等于
  greaterThanOrEqual(v: Readonly<Vector4>, checkW: boolean = false): boolean {
    return this.x >= v.x && this.y >= v.y && this.z >= v.z && (checkW ? this.w >= v.w : true)
  }
}

export { Vector4 }
