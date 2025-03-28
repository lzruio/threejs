/*
 * @FilePath: \kjlordervued:\Desktop\kdThreejsScene\src\utils\test.ts
 * @Description:
 * @Author: lzr
 * @Version: 0.0.1
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-18 17:43:08
 */
import log from '@/utils/log'
import { Euler, Matrix4 } from '@/utils/math/'
import { EllipseCurve } from 'three'
import * as THREE from 'three'
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, SAH } from 'three-mesh-bvh'

// 测试矩阵乘法
// log.debug('==========测试矩阵乘法==========')
// const matrix1 = new Matrix4()
// const matrix2 = new Matrix4()
// matrix1.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
// matrix2.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
// const result = matrix1.dot(matrix2)
// log.debug(result)

// 测试椭圆
const ellipse = new EllipseCurve(0, 0, 100, 50, 0, (Math.PI * 3) / 2, true, 0)
const points = ellipse.getPoints(20)
log.debug(points)

// 碰撞检测的代码
function checkIntersection(mesh1: THREE.Mesh, mesh2: THREE.Mesh) {
  THREE.Mesh.prototype.raycast = acceleratedRaycast
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree

  getMeshBuffer(mesh1)
  getMeshBuffer(mesh2)
  function getMeshBuffer(mesh: THREE.Mesh) {
    mesh.geometry.computeBoundsTree({ maxLeafTris: 0.1, strategy: SAH })
    return mesh
  }
  const r = []
  const matrix2to1 = new THREE.Matrix4()
    .copy(mesh1.matrixWorld)
    .invert()
    .multiply(mesh2.matrixWorld)

  const edge = new THREE.Line3()
  // console.log({ buff1, buff2 });
  if (!mesh1.geometry.boundsTree || !mesh2.geometry.boundsTree) {
    return false
  }
  mesh1.geometry.boundsTree?.bvhcast(mesh2.geometry.boundsTree, matrix2to1, {
    intersectsTriangles(triangle1, triangle2) {
      if (triangle1.intersectsTriangle(triangle2, edge)) {
        const { start, end } = edge
        r.push(start.x, start.y, start.z, end.x, end.y, end.z)
      }
    },
  })
  if (r.length > 0) {
    return true
  }
  return false
}
