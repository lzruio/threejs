/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 17:13:41
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-19 10:52:33
 * @FilePath: \kdPlankCheck\src\utils\math\mathUtil.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import _ from 'lodash'
// 公用的一些方法
import { Vector4 } from '.'

// 判断浮点数是否相等
export function isFloatEqual(a: number, b: number, epsilon = 1e-2) {
  return Math.abs(a - b) < epsilon
}

// 限制值在最小值和最大值之间
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

//将角度转弧度
export function degToRad(deg: number) {
  return (deg * Math.PI) / 180
}

//将弧度转角度
export function radToDeg(rad: number) {
  return (rad * 180) / Math.PI
}

// 获取[x, y, z]格式的数据
export function xyz(o: Vector4) {
  const { x, y, z } = o
  return [x, y, z] as [typeof x, typeof y, typeof z]
}

// 获取最大值
export function getMaxValue(values: number[]) {
  return Math.max(...values)
}

// 获取点的包围盒
export function getBoundingRectXY(points: Array<any>): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Number.MAX_VALUE
  let minY = Number.MAX_VALUE
  let maxX = -Number.MAX_VALUE
  let maxY = -Number.MAX_VALUE
  points.forEach((point) => {
    minX = Math.min(minX, point.X)
    minY = Math.min(minY, point.Y)
    maxX = Math.max(maxX, point.X)
    maxY = Math.max(maxY, point.Y)
  })
  return { minX, minY, maxX, maxY }
}

// 给向量进行四舍五入
export function roundVec(vec: Vector4, decimal = 1) {
  return new Vector4(
    _.round(vec.x, decimal),
    _.round(vec.y, decimal),
    _.round(vec.z, decimal),
    _.round(vec.w, decimal),
  )
}

// 浮点数小于或等于
export function FloatLessOrEqual(x: number, y: number) {
  return CompareFloat(x, y) <= 0
}

// 浮点数大于或等于
export function FloatGreaterOrEqual(x: number, y: number) {
  return CompareFloat(x, y) >= 0
}

// 比较两个浮点数,如果x大于y,返回1；如果x=y,返回0;否则返回-1;
export function CompareFloat(x: number, y: number) {
  if (Math.abs(x - y) < 1e-3) {
    return 0
  } else {
    return x - y > 0 ? 1 : -1
  }
}
