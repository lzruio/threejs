// 矩阵工具类

import { Matrix4 } from './matrix4'
import type { Vector4 } from './vector4'
import { Euler, type EulerOrder } from './euler'

// 世界转局部
export function WorldToLocMat(t: Vector4, euler: Euler): Matrix4 {
  // 逆反order的顺序
  const order = euler.order.split('').reverse().join('') as EulerOrder
  const tempEuler = new Euler(-euler.x, -euler.y, -euler.z, order)
  const R = Matrix4.RotationFromEuler(tempEuler)
  const T = Matrix4.Translation(-t.x, -t.y, -t.z)
  const result = R.dot(T)
  return result
}
// 局部转世界
export function LocToWorldMat(t: Vector4, euler: Euler): Matrix4 {
  const R = Matrix4.RotationFromEuler(euler)
  const T = Matrix4.TranslationFromVector(t)
  return T.dot(R)
}

// 绕z轴中点旋转
export function RotateZCenterMat(angle: number, x: number, y: number): Matrix4 {
  const R = Matrix4.RotationZ(angle)
  const T = Matrix4.Translation(x, y, 0)
  const T1 = Matrix4.Translation(-x, -y, 0)
  const result = T.dot(R).dot(T1)
  return result
}
