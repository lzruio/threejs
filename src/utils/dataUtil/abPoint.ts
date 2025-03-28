import { PLOutLinePoint } from '@/types'
import { RotateZCenterMat, getBoundingRectXY, Matrix4, Vector4, Euler } from '@/utils/math'
import _ from 'lodash'
import log from '@/utils/log'
// 异形点生成逻辑
export function genAbPoints(module: any, plank: any): PLOutLinePoint[] {
  let abPoints: PLOutLinePoint[] = []
  if (module.PLOutLinePoints && module.PLOutLinePoints.length > 0) {
    abPoints = transKd8AbPoints(module, plank)
  } else {
    // 生成四个基础点
    abPoints = genPointsByDim(plank)
  }
  return abPoints
}

// 生成四个基础点
export function genPointsByDim(plank: any): PLOutLinePoint[] {
  const abPoint: PLOutLinePoint[] = []
  const x = plank.ObjWidth
  const y = plank.ObjDepth
  // 生成异形点
  abPoint.push({ X: 0, Y: 0, Z: 0, Type: 0 })
  abPoint.push({ X: x, Y: 0, Z: 0, Type: 0 })
  abPoint.push({ X: x, Y: y, Z: 0, Type: 0 })
  abPoint.push({ X: 0, Y: y, Z: 0, Type: 0 })
  return abPoint
}

// kd8异形点转kd10异形点
export function transKd8AbPoints(module: any, basePlank: any): PLOutLinePoint[] {
  return transKd8ToKd10AbPoints(module, basePlank)
}

// 旋转异形点
export function TransAbPoints(PLOutLinePoints: PLOutLinePoint[], angle: number): PLOutLinePoint[] {
  const abPoints: PLOutLinePoint[] = []
  // 对异形点绕原点旋转180度
  const rect = getBoundingRectXY(PLOutLinePoints)
  const center = {
    X: (rect.minX + rect.maxX) / 2,
    Y: (rect.minY + rect.maxY) / 2,
  }
  const matrix = RotateZCenterMat(angle, center.X, center.Y)
  PLOutLinePoints.forEach((point) => {
    const p = matrix.dotVec(new Vector4(point.X, point.Y, point.Z, 1))
    abPoints.push({
      X: p.x,
      Y: p.y,
      Z: p.z,
      Type: point.Type,
    })
  })
  return abPoints
}
// 将kd8的异形点转换为kd10的异形点
export function transKd8ToKd10AbPoints(module: any, basePlank: any): PLOutLinePoint[] {
  const abPoints: PLOutLinePoint[] = []
  // 根据逆矩阵，将kd8的异形点转换为kd10的异形点
  // const euler = new Euler(
  //   basePlank.relativeRot.x,
  //   basePlank.relativeRot.y,
  //   basePlank.relativeRot.z,
  //   'ZXY',
  // )

  // const R = Matrix4.RotationFromEuler(euler)
  // const T = Matrix4.TranslationFromVector(
  //   new Vector4(basePlank.relativePos.x, basePlank.relativePos.y, basePlank.relativePos.z, 1),
  // )
  // const CToPMat = T.dot(R)
  // const PToCMat = CToPMat.inverse()

  // (等价于逆矩阵)
  const euler = new Euler(
    -basePlank.relativeRot.x,
    -basePlank.relativeRot.y,
    -basePlank.relativeRot.z,
    'YXZ',
  )

  const R = Matrix4.RotationFromEuler(euler)
  const T = Matrix4.TranslationFromVector(
    new Vector4(-basePlank.relativePos.x, -basePlank.relativePos.y, -basePlank.relativePos.z, 1),
  )
  const PToCMat = R.dot(T)

  if (module.PlankTowardType.includes('横板')) {
    const transPoints = TransAbPoints(module.PLOutLinePoints, 180)
    transPoints.forEach((point) => {
      const p = new Vector4(point.X, point.Y, point.Z, 1)
      const p1 = PToCMat.dotVec(p)
      abPoints.push({
        X: p1.x,
        Y: p1.y,
        Z: 0,
        Type: point.Type,
      })
    })
  } else if (module.PlankTowardType.includes('竖板')) {
    const transPoints = TransAbPoints(module.PLOutLinePoints, 180)
    transPoints.forEach((point) => {
      const p = new Vector4(point.Z, point.Y, point.X, 1)
      const p1 = PToCMat.dotVec(p)
      abPoints.push({
        X: p1.x,
        Y: p1.y,
        Z: 0,
        Type: point.Type,
      })
    })
  } else if (module.PlankTowardType.includes('背板')) {
    const PLOutLinePoints = module.PLOutLinePoints as PLOutLinePoint[]
    const transPoints = PLOutLinePoints.map((point) => ({
      X: -point.X + module.ObjWidth, // X坐标取反实现翻转 + 平移X(也可使用矩阵)
      Y: point.Y,
      Z: 0,
      Type: point.Type,
    }))
    transPoints.forEach((point) => {
      const p = new Vector4(point.X, point.Z, point.Y, 1)
      const p1 = PToCMat.dotVec(p)
      abPoints.push({
        X: p1.x,
        Y: p1.y,
        Z: 0,
        Type: point.Type,
      })
    })
  }

  return abPoints
}

// 填充异形点
export function fillAbPoints(points: PLOutLinePoint[], num_points: number = 10): PLOutLinePoint[] {
  const abPoints = _.cloneDeep(points)
  const newPoints: PLOutLinePoint[] = []

  for (let i = 0; i < abPoints.length; i++) {
    // 检查连续三个点是否为圆弧段
    if (
      abPoints[i].Type === 1 &&
      abPoints[(i + 1) % abPoints.length].Type === 1 &&
      abPoints[(i + 2) % abPoints.length].Type === 0
    ) {
      // 是圆弧
      const P0 = [abPoints[i].X, abPoints[i].Y]
      const P1 = [abPoints[(i + 1) % abPoints.length].X, abPoints[(i + 1) % abPoints.length].Y]
      const P2 = [abPoints[(i + 2) % abPoints.length].X, abPoints[(i + 2) % abPoints.length].Y]

      // 计算生成圆弧点
      const arc_points = generateArcPoints(P0, P1, P2, num_points)

      // 将圆弧点加入到新点列表中
      newPoints.push(...arc_points)

      // 跳过接下来的两个点
      i += 2
    } else {
      // 不是圆弧，直接添加点
      newPoints.push(abPoints[i])
    }
  }
  return newPoints
}

// 进行圆弧点的扩展
function generateArcPoints(
  p1: Array<number>,
  p2: Array<number>,
  p3: Array<number>,
  steps: number,
): PLOutLinePoint[] {
  const { center, radius } = findCircle(p1, p2, p3)
  function angleFromCenter(point: Array<number>) {
    return Math.atan2(point[1] - center[1], point[0] - center[0])
  }

  let theta1 = angleFromCenter(p1)
  const theta2 = angleFromCenter(p2)
  let theta3 = angleFromCenter(p3)

  if (theta1 > theta3) {
    ;[theta1, theta3] = [theta3, theta1]
  }

  const arc: PLOutLinePoint[] = []
  if (theta1 < theta2 && theta2 < theta3) {
    for (let t = theta1; t <= theta3; t += (theta3 - theta1) / steps) {
      const p = {
        X: center[0] + radius * Math.cos(t),
        Y: center[1] + radius * Math.sin(t),
        Z: 0,
        Type: 1,
      }
      arc.push(p)
    }
  } else {
    for (let t = theta3; t <= theta1 + 2 * Math.PI; t += (theta1 + 2 * Math.PI - theta3) / steps) {
      const p = {
        X: center[0] + radius * Math.cos(t),
        Y: center[1] + radius * Math.sin(t),
        Z: 0,
        Type: 1,
      }
      arc.push(p)
    }
  }

  // 计算叉乘,使得生路径方向与p1,p2,p3的方向一致
  const crossProduct = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
  if (crossProduct < 0) {
    arc.reverse()
  }
  return arc
}

// 三点找圆
function findCircle(
  p1: Array<number>,
  p2: Array<number>,
  p3: Array<number>,
): { center: Array<number>; radius: number } {
  function perpBisector(pt1: Array<number>, pt2: Array<number>): [Array<number>, number | null] {
    const midPoint = [(pt1[0] + pt2[0]) / 2, (pt1[1] + pt2[1]) / 2]
    if (pt2[0] !== pt1[0]) {
      const slope = (pt2[1] - pt1[1]) / (pt2[0] - pt1[0])
      const perpSlope = -1 / slope
      return [midPoint, perpSlope]
    } else {
      return [midPoint, null]
    }
  }

  const [mid1, slope1] = perpBisector(p1, p2)
  const [mid2, slope2] = perpBisector(p2, p3)

  let cx, cy
  if (slope1 !== null && slope2 !== null) {
    const c1 = mid1[1] - slope1 * mid1[0]
    const c2 = mid2[1] - slope2 * mid2[0]
    cx = (c2 - c1) / (slope1 - slope2)
    cy = slope1 * cx + c1
  } else if (slope2 !== null) {
    cx = mid1[0]
    const c2 = mid2[1] - slope2 * mid2[0]
    cy = slope2 * cx + c2
  } else if (slope1 !== null) {
    cx = mid2[0]
    const c1 = mid1[1] - slope1 * mid1[0]
    cy = slope1 * cx + c1
  }

  if (!cx || !cy) {
    return { center: [0, 0], radius: 0 }
  }
  const center = [cx, cy]

  const radius = Math.hypot(center[0] - p1[0], center[1] - p1[1])

  return { center, radius }
}
