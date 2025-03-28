import { Vector4, Matrix4 } from '@/utils/math'
import log from '@/utils/log'
// AABB检测
class AABB {
  xMin: number
  yMin: number
  zMin: number
  xMax: number
  yMax: number
  zMax: number
  constructor(xMin: number, yMin: number, zMin: number, xMax: number, yMax: number, zMax: number) {
    this.xMin = xMin
    this.yMin = yMin
    this.zMin = zMin
    this.xMax = xMax
    this.yMax = yMax
    this.zMax = zMax
  }

  // 计算AABB盒的中心
  get center(): Vector4 {
    return new Vector4(
      (this.xMin + this.xMax) / 2,
      (this.yMin + this.yMax) / 2,
      (this.zMin + this.zMax) / 2,
      1,
    )
  }

  get min(): Vector4 {
    return new Vector4(this.xMin, this.yMin, this.zMin, 1)
  }

  get max(): Vector4 {
    return new Vector4(this.xMax, this.yMax, this.zMax, 1)
  }

  get size(): Vector4 {
    return this.max.sub(this.min)
  }

  // 最小包围盒
  static genMiniAABB(): AABB {
    const min = new Vector4(Infinity, Infinity, Infinity, 1)
    const max = new Vector4(-Infinity, -Infinity, -Infinity, 1)
    return AABB.fromVector(min, max)
  }
  // 从给定的维度生成AABB
  static fromDimensions(
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
    height: number,
  ): AABB {
    const xMax = x + width
    const yMax = y + depth
    const zMax = z + height
    return new AABB(x, y, z, xMax, yMax, zMax)
  }

  // 给定向量生成AABB
  static fromVector(min: Vector4, max: Vector4): AABB {
    return new AABB(min.x, min.y, min.z, max.x, max.y, max.z)
  }

  // 计算包围两个盒子的AABB
  include(other: AABB): AABB {
    const xMin = Math.min(this.xMin, other.xMin)
    const yMin = Math.min(this.yMin, other.yMin)
    const zMin = Math.min(this.zMin, other.zMin)
    const xMax = Math.max(this.xMax, other.xMax)
    const yMax = Math.max(this.yMax, other.yMax)
    const zMax = Math.max(this.zMax, other.zMax)
    return new AABB(xMin, yMin, zMin, xMax, yMax, zMax)
  }

  // 检查一个点是否在这个三维矩形内
  containsPoint(point: Vector4): boolean {
    return (
      point.x >= this.xMin &&
      point.x <= this.xMax &&
      point.y >= this.yMin &&
      point.y <= this.yMax &&
      point.z >= this.zMin &&
      point.z <= this.zMax
    )
  }

  // 判断是否碰撞，允许误差为+-0.1
  isCollision(other: AABB, error: number = 0.1): boolean {
    return (
      this.xMin <= other.xMax + error &&
      this.xMax >= other.xMin - error &&
      this.yMin <= other.yMax + error &&
      this.yMax >= other.yMin - error &&
      this.zMin <= other.zMax + error &&
      this.zMax >= other.zMin - error
    )
  }

  // 获取AABB的顶点
  getVertices(): Vector4[] {
    return [
      new Vector4(this.xMin, this.yMin, this.zMin, 1),
      new Vector4(this.xMax, this.yMin, this.zMin, 1),
      new Vector4(this.xMin, this.yMax, this.zMin, 1),
      new Vector4(this.xMin, this.yMin, this.zMax, 1),
      new Vector4(this.xMax, this.yMax, this.zMin, 1),
      new Vector4(this.xMax, this.yMin, this.zMax, 1),
      new Vector4(this.xMin, this.yMax, this.zMax, 1),
      new Vector4(this.xMax, this.yMax, this.zMax, 1),
    ]
  }

  // 应用矩阵变换并返回新的AABB
  transform(matrix: Matrix4): AABB {
    const vertices = this.getVertices()
    const transformedVertices = vertices.map((vertex) => {
      return matrix.dotVec(vertex)
    })
    const [xMin, yMin, zMin, xMax, yMax, zMax] = calcAABBMinMax(transformedVertices)
    return new AABB(xMin, yMin, zMin, xMax, yMax, zMax)
  }
}

function calcAABBMinMax(points: Vector4[]): [number, number, number, number, number, number] {
  const minX = Math.min(...points.map((v) => v.x))
  const minY = Math.min(...points.map((v) => v.y))
  const minZ = Math.min(...points.map((v) => v.z))
  const maxX = Math.max(...points.map((v) => v.x))
  const maxY = Math.max(...points.map((v) => v.y))
  const maxZ = Math.max(...points.map((v) => v.z))
  return [minX, minY, minZ, maxX, maxY, maxZ]
}

export { AABB }
