/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:19:53
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-20 13:35:19
 * @FilePath: \kdPlankCheck\src\utils\three\modelGenerator.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Module, ModuleType, MarkLine, MeshType, type ModelGenerationOptions } from '@/types'
import {
  Group,
  Euler,
  Shape,
  MeshBasicMaterial,
  Mesh,
  ExtrudeGeometry,
  BufferGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  BoxGeometry,
  CylinderGeometry,
  Quaternion,
  ArrowHelper,
  Vector3,
  Vector2,
  Line,
  type ColorRepresentation,
  CatmullRomCurve3,
  Matrix4,
} from 'three'
import {
  STLLoader,
  LineMaterial,
  LineSegmentsGeometry,
  LineSegments2,
  TextGeometry,
  LineGeometry,
  Font,
} from 'three/addons'

import * as THREE from 'three'
import { xyz, degToRad, Vector4 } from '@/utils/math'
import { PLOutLinePoint, type TextEntity } from '@/types'
import { traverseTreeBySubModules } from '../treeUtil'
import log from '@/utils/log'
import { TransparentView, type MaterialConfig } from '@/services/core/constants'

// @ts-expect-error 没有找到官方的类型声明包
import { Text } from 'troika-three-text'

// 模型生成逻辑
export function basicModelGeneration(model: Module, options: ModelGenerationOptions) {
  const { modelType } = model
  // 如果是基础板件
  if (modelType === ModuleType.JCBoard) {
    // 物料板不建模
    if (model.ObjRefCode.includes('KuWL')) {
      return null
    }
    const plankConfig = TransparentView.board
    const plankEdgeConfig = TransparentView.boardEdge
    return genShapeModel(model, plankConfig, plankEdgeConfig)
  } else if (modelType === ModuleType.ClothesRail && options.generateClothesRail) {
    // return genClothesRailModel(model)
  } else if (modelType === ModuleType.Groove && options.generateGroove) {
    const grooveConfig = TransparentView.groove
    const grooveEdgeConfig = TransparentView.grooveEdge
    return genGrooveModel(model, grooveConfig, grooveEdgeConfig)
  } else if (modelType === ModuleType.Hole && options.generateHole) {
    const holeConfig = TransparentView.hole
    const holeEdgeConfig = TransparentView.holeEdge
    return genHoleModel(model, holeConfig, holeEdgeConfig)
  }
  return null
}

// 需要在外部导入的模型
export async function genByImportModule(model: Module) {
  // 链接下面的基础板
  const basePlank = model.SubModules.find((m) => m.modelType === ModuleType.JCBoard) || null
  if (!basePlank) {
    return null
  }
  const boardConfig = TransparentView.board
  const mesh = await getImportModelPlank(model, boardConfig)
  if (!mesh) {
    return null
  }
  mesh.userData.meshType = MeshType.Board

  // 板件描边
  const boardEdgeConfig = TransparentView.boardEdge
  const plankEdge = getEdge(mesh.geometry, boardEdgeConfig)
  // 生成板件组
  const plankGroup = getCalibratedGroup(new Vector4(0, 0, 0, 1), mesh, plankEdge)
  // 还原位置
  plankGroup.position.set(...xyz(basePlank.relativePos))
  // 还原旋转
  const x = degToRad(basePlank.relativeRot.x)
  const y = degToRad(basePlank.relativeRot.y)
  const z = degToRad(basePlank.relativeRot.z)
  const euler = new Euler(x, y, z, 'ZXY')
  plankGroup.setRotationFromEuler(euler)

  plankGroup.name = basePlank.ObjID || ''
  plankGroup.userData.module = basePlank
  // 设置z轴为厚度
  plankGroup.scale.set(basePlank.Dim.x, basePlank.Dim.y, basePlank.Dim.z)
  return plankGroup
}
// 根据module生成导入的模型
async function getImportModelPlank(model: Module, config: MaterialConfig) {
  const fileName = 'models/' + model.Info.Info.BDImportModelType + '.stl'

  // 导入stl模型
  const stlLoader = new STLLoader()
  const geometry = await stlLoader.loadAsync(fileName)
  if (!geometry) {
    return null
  }

  // 计算包围盒
  geometry.computeBoundingBox()
  const boundingBox = geometry.boundingBox
  if (!boundingBox) {
    return null
  }
  const { min, max } = boundingBox

  // 计算尺寸
  const size = {
    width: max.x - min.x,
    length: max.y - min.y,
    height: max.z - min.z,
  }

  // 使用 TypedArray 直接访问提高性能
  const positions = geometry.attributes.position.array
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (positions[i] - min.x) / size.width // x
    positions[i + 1] = (positions[i + 1] - min.y) / size.length // y
    positions[i + 2] = (positions[i + 2] - min.z) / size.height // z
  }

  geometry.attributes.position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()

  const standardMaterial = new MeshBasicMaterial({
    color: config.color,
    transparent: true,
    opacity: config.opacity,
    // depthWrite: false,
  })
  const mesh = new Mesh(geometry, standardMaterial)

  return mesh
}

// 根据PLOutLinePoint生成shape绘制模型
function genShapeModel(
  model: Module,
  plankConfig: MaterialConfig,
  plankEdgeConfig: MaterialConfig,
) {
  const PLOutLinePoint = model.PLOutLinePoints
  if (PLOutLinePoint.length === 0) {
    return null
  }
  // 根据PLOutLinePoint生成板件形状
  const plankShape = getShape(PLOutLinePoint)
  // 板件材质设置
  const plank = getPlank(plankShape, model.Dim.z, plankConfig)
  // 板件描边
  const plankEdge = getEdge(plank.geometry, plankEdgeConfig)

  // 生成板件组
  const plankGroup = getCalibratedGroup(new Vector4(0, 0, 0, 1), plank, plankEdge)
  // 还原位置
  plankGroup.position.set(...xyz(model.relativePos))
  // 还原旋转
  const x = degToRad(model.relativeRot.x)
  const y = degToRad(model.relativeRot.y)
  const z = degToRad(model.relativeRot.z)
  const euler = new Euler(x, y, z, 'ZXY')
  plankGroup.setRotationFromEuler(euler)
  plankGroup.name = model.ObjID
  plankGroup.userData.module = model

  // 链接信息
  plank.userData.meshType = MeshType.Board
  plankEdge.userData.meshType = MeshType.BoardEdge
  return plankGroup
}

// 生成棱(圆)柱模型
function genCylinderModel(model: Module, config: MaterialConfig) {
  const { holeDiameter, holeHeight } = model.parameters
  if (!holeDiameter || !holeHeight) {
    return null
  }
  const geometry = new CylinderGeometry(holeDiameter / 2, holeDiameter / 2, holeHeight, 8)
  // 微调位置
  const material = new MeshBasicMaterial({
    color: config.color,
    transparent: true,
    opacity: config.opacity,
    // depthWrite: false,
  })
  const cylinder = new Mesh(geometry, material)
  return cylinder
}

// 绘制孔
export function genHoleModel(
  model: Module,
  holeConfig: MaterialConfig,
  holeEdgeConfig: MaterialConfig,
) {
  const { relativePos, towardVecInParent } = model
  const { holeHeight } = model.parameters
  if (!holeHeight) {
    return null
  }
  const hole = genCylinderModel(model, holeConfig)
  if (!hole) {
    return null
  }
  const holeEdge = getEdge(hole.geometry, holeEdgeConfig)
  hole.userData.meshType = MeshType.Hole
  holeEdge.userData.meshType = MeshType.HoleEdge

  const euler = rotateModelByTowardVec(towardVecInParent)
  // 构建组
  const holeGroup = getCalibratedGroup(new Vector4(0, holeHeight / 2, 0, 1), hole, holeEdge)
  holeGroup.position.set(...xyz(relativePos))
  holeGroup.setRotationFromEuler(euler)
  holeGroup.name = model.ObjID
  holeGroup.userData.module = model
  return holeGroup
}

// 根据朝向向量计算需要旋转的欧拉角
function rotateModelByTowardVec(towardVecInParent: Vector4) {
  // 建模朝向
  const currentDir = new THREE.Vector3(0, 1, 0).normalize()
  const targetDir = new THREE.Vector3(...xyz(towardVecInParent)).normalize()
  const dotProduct = currentDir.dot(targetDir)
  // 计算轴和角
  const rotationAxis = new THREE.Vector3()
  let angle: number
  if (Math.abs(dotProduct + 1) < 1e-6) {
    rotationAxis.set(1, 0, 0)
    if (Math.abs(currentDir.x) < 1e-6 && Math.abs(currentDir.z) < 1e-6) {
      rotationAxis.set(0, 0, 1)
    }
    rotationAxis.crossVectors(currentDir, rotationAxis).normalize()
    angle = Math.PI
  } else {
    rotationAxis.crossVectors(currentDir, targetDir).normalize()
    angle = Math.acos(Math.max(-1, Math.min(1, dotProduct))) // 限制角度范围
  }
  // 四元数
  const quaternion = new THREE.Quaternion()
  quaternion.setFromAxisAngle(rotationAxis, angle)
  // 欧拉角
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'ZXY')
  return euler
}

// 绘制槽
function genGrooveModel(
  model: Module,
  grooveConfig: MaterialConfig,
  grooveEdgeConfig: MaterialConfig,
) {
  // 生成路径点模型
  model.PLOutLinePoints = genPointsByModuleDim(model)
  const grooveGroup = genShapeModel(model, grooveConfig, grooveEdgeConfig)
  if (!grooveGroup) {
    return null
  }
  grooveGroup.children.forEach((child) => {
    if (child instanceof Mesh) {
      child.userData.meshType = MeshType.Groove
    }
    if (child instanceof LineSegments2) {
      child.userData.meshType = MeshType.GrooveEdge
    }
  })
  return grooveGroup
}

/** 校准模型初始位置 */
export function getCalibratedGroup(offset: Vector4, ...obj3d: Object3D[]) {
  const offsetGroup = new Group()
  offsetGroup.add(...obj3d)
  offsetGroup.children.forEach((child) => {
    child.position.set(...xyz(offset))
  })
  return offsetGroup
}
/** 板件材质设置 */
export function getPlank(plankShape: Shape, thickness: number, config: MaterialConfig) {
  const standardMaterial = new MeshBasicMaterial({
    color: config.color,
    transparent: true,
    opacity: config.opacity,
    // depthWrite: false,
  })
  const plank = new Mesh(new ExtrudeGeometry(plankShape, { depth: thickness }), standardMaterial)
  // 计算uv
  calculateUV(plank.geometry)
  return plank
}

// 计算模型的uv，用于贴图(对于shape建立的模型需要此方法)
function calculateUV(geometry: ExtrudeGeometry) {
  geometry.computeBoundingBox()
  const max = geometry.boundingBox!.max
  const min = geometry.boundingBox!.min

  const positions = geometry.attributes.position
  const uvs = []

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    uvs.push((x - min.x) / (max.x - min.x), (y - min.y) / (max.y - min.y))
  }

  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
}

/** 描边 */
// export function getEdge(geometry: BufferGeometry, color: ColorRepresentation | undefined) {
// 不能设置线宽，已废弃
// const geo = new EdgesGeometry(geometry)
// const mat = new LineBasicMaterial({
//   color,
//   linewidth: 1,
// })
// const edge = new LineSegments(geo, mat)
// return edge

// }
/** 描边 */
export function getEdge(geometry: BufferGeometry, config: MaterialConfig) {
  const edgesGeometry = new EdgesGeometry(geometry)

  // 获取位置数据
  const positions = edgesGeometry.attributes.position.array

  // 创建 LineSegmentsGeometry
  const lineGeometry = new LineSegmentsGeometry()
  lineGeometry.setPositions(Array.from(positions))

  // 创建线段材质
  const lineMaterial = new LineMaterial({
    color: config.color,
    linewidth: config.lineWidth,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    polygonOffset: true, // 启用多边形偏移
    polygonOffsetFactor: -0.5, // 设置偏移因子
    polygonOffsetUnits: -2, // 设置偏移单位
  })

  // 创建线段
  const edge = new LineSegments2(lineGeometry, lineMaterial)
  return edge
}

export function getShape(abPoint: PLOutLinePoint[]) {
  const shape = new Shape()
  const [startPoint, ...otherPoints] = abPoint
  shape.moveTo(startPoint.X, startPoint.Y)
  otherPoints.forEach((point) => {
    shape.lineTo(point.X, point.Y)
  })
  shape.closePath()
  return shape
}
// 使用相对位置创建模型
export function addShapeRelative(model: Module, option: ModelGenerationOptions) {
  // 防止建立空基础板组
  if (model.modelType === ModuleType.JCBoard && !basicModelGeneration(model, option)) {
    return null
  }
  const { relativeRot, relativePos } = model
  const group = new Group()
  group.name = model.ObjID
  group.position.set(...xyz(relativePos))

  // 将欧拉角转换为弧度制
  const x = degToRad(relativeRot.x)
  const y = degToRad(relativeRot.y)
  const z = degToRad(relativeRot.z)
  const euler = new Euler(x, y, z, 'ZXY')
  group.setRotationFromEuler(euler)
  group.userData.module = model
  if (!model.SubModules) return

  const shapes = model.SubModules.map((model) => {
    const shape = basicModelGeneration(model, option) || addShapeRelative(model, option)
    return shape
  })
  shapes.forEach((shape) => {
    if (shape) group.add(shape)
  })
  return group
}

/** 使用绝对位置，还原元件形状与位置 */
export function addShapeAbsolute(model: Module, option: ModelGenerationOptions) {
  const floorModel: Module[] = []
  traverseTreeBySubModules(model.SubModules, (m) => {
    if (m.modelType === ModuleType.JCBoard) {
      floorModel.push(m)
    }
    return null
  })
  const shapes = floorModel.map((model) => {
    model.relativePos = model.AbsPos
    model.relativeRot = model.AbsRot
    return basicModelGeneration(model, option)
  })
  const group = new Group()
  shapes.forEach((shape) => {
    if (shape) group.add(shape)
  })

  return group
}

// 生成一个长方体
export function getRectangularPrism(module: Module) {
  const { Dim } = module
  const geometry = new BoxGeometry(Dim.x, Dim.y, Dim.z)
  const material = new MeshBasicMaterial({ color: 'white' })
  const mesh = new Mesh(geometry, material)
  mesh.name = module.ObjID
  mesh.userData.module = module
  mesh.position.set(...xyz(module.relativePos))
  const x = degToRad(module.relativeRot.x)
  const y = degToRad(module.relativeRot.y)
  const z = degToRad(module.relativeRot.z)
  const euler = new Euler(x, y, z, 'ZXY')
  mesh.setRotationFromEuler(euler)
  return mesh
}

// 生成四个基础点
function genPointsByModuleDim(module: Module): PLOutLinePoint[] {
  const abPoint: PLOutLinePoint[] = []
  const x = module.Dim.x
  const y = module.Dim.y
  // 生成异形点
  abPoint.push({ X: 0, Y: 0, Z: 0, Type: 0 })
  abPoint.push({ X: x, Y: 0, Z: 0, Type: 0 })
  abPoint.push({ X: x, Y: y, Z: 0, Type: 0 })
  abPoint.push({ X: 0, Y: y, Z: 0, Type: 0 })
  return abPoint
}

// 创建标注线
export function genAnnoLine(markLine: MarkLine, font: Font): Group {
  const group = new Group()
  // 获取基本参数
  const centerPoint = markLine.getCenterPoint()
  const halfLength = markLine.getLength() / 2
  const dir0 = markLine.startPoint.clone().sub(markLine.endPoint).normalize()
  const dir1 = dir0.clone().negate()
  // 创建双向箭头
  const arrowHelper0 = new ArrowHelper(
    dir0,
    centerPoint,
    halfLength,
    markLine.color,
    markLine.headLength,
    markLine.headWidth,
  )
  const arrowHelper1 = new ArrowHelper(
    dir1,
    centerPoint,
    halfLength,
    markLine.color,
    markLine.headLength,
    markLine.headWidth,
  )
  group.add(arrowHelper0, arrowHelper1)
  // 创建文字
  if (markLine.text) {
    const textGeometry = new TextGeometry(markLine.text, {
      font: font,
      size: markLine.textSize,
      depth: markLine.textDepth,
    })
    textGeometry.computeBoundingBox()
    textGeometry.center()
    const textMaterial = new MeshBasicMaterial({ color: markLine.textColor })
    const textMesh = new Mesh(textGeometry, textMaterial)
    // 设置文字位置和旋转
    textMesh.position.copy(centerPoint)
    const direction = markLine.startPoint.x <= markLine.endPoint.x ? dir1 : dir0
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), direction)
    textMesh.setRotationFromQuaternion(quaternion)
    // 添加文字偏移
    const normalVector = new Vector3().crossVectors(direction, new Vector3(0, 0, 1)).normalize()
    textMesh.position.sub(normalVector.multiplyScalar(markLine.paddingBottom))
    group.add(textMesh)
  }
  // 创建连接线
  if (markLine.closeLine.startLength > 0 || markLine.closeLine.endLength > 0) {
    // 判断是否是垂直方向（Z轴）的标注
    const isVertical =
      Math.abs(markLine.endPoint.z - markLine.startPoint.z) >
      Math.max(
        Math.abs(markLine.endPoint.x - markLine.startPoint.x),
        Math.abs(markLine.endPoint.y - markLine.startPoint.y),
      )
    const direction = markLine.startPoint.x <= markLine.endPoint.x ? dir1 : dir0
    if (markLine.closeLine.startLength > 0) {
      const startLineGeometry = new BufferGeometry().setFromPoints([
        new Vector3(0, 0, 0).add(
          direction.clone().multiplyScalar(markLine.closeLine.startLength / 2),
        ),
        new Vector3(0, 0, 0).sub(
          direction.clone().multiplyScalar(markLine.closeLine.startLength / 2),
        ),
      ])

      const lineMaterial = new LineBasicMaterial({ color: markLine.color })
      const startLine = new Line(startLineGeometry, lineMaterial)

      startLine.position.copy(markLine.startPoint)
      startLine.translateOnAxis(direction, markLine.closeLine.translateStart)

      // 根据方向选择旋转轴
      if (isVertical) {
        startLine.rotateX(Math.PI / 2) // Z轴标注时绕X轴旋转
      } else {
        startLine.rotateZ(Math.PI / 2) // X、Y轴标注时绕Z轴旋转
      }

      group.add(startLine)
    }
    if (markLine.closeLine.endLength > 0) {
      const endLineGeometry = new BufferGeometry().setFromPoints([
        new Vector3(0, 0, 0).add(
          direction.clone().multiplyScalar(markLine.closeLine.endLength / 2),
        ),
        new Vector3(0, 0, 0).sub(
          direction.clone().multiplyScalar(markLine.closeLine.endLength / 2),
        ),
      ])

      const lineMaterial = new LineBasicMaterial({ color: markLine.color })
      const endLine = new Line(endLineGeometry, lineMaterial)

      endLine.position.copy(markLine.endPoint)
      endLine.translateOnAxis(direction, markLine.closeLine.translateEnd)

      // 根据方向选择旋转轴
      if (isVertical) {
        endLine.rotateX(Math.PI / 2) // Z轴标注时绕X轴旋转
      } else {
        endLine.rotateZ(Math.PI / 2) // X、Y轴标注时绕Z轴旋转
      }

      group.add(endLine)
    }
  }
  return group
}

// 绘制一个带箭头的线
export function genArrowLine(
  A: Vector3,
  B: Vector3,
  size: number = 3,
  color: ColorRepresentation = 'yellow',
) {
  const AB = B.clone().sub(A)
  const dir = AB.clone().normalize()
  const length = AB.length()

  const goldenRatio = 1.618033988749895
  const headLength = size
  const headWidth = size / goldenRatio
  const arrowHelper = new ArrowHelper(dir, A, length, color, headLength, headWidth)
  return arrowHelper
}

export function gen3DText(text: TextEntity, font: Font): Mesh {
  // 创建一个以中心点为中心的文字
  const textGeometry = new TextGeometry(`${text.text}`, {
    font: font,
    size: text.size,
    depth: text.depth,
  })

  // 以中心点为中心
  textGeometry.computeBoundingBox()
  textGeometry.center()
  const textMaterial = new MeshBasicMaterial({ color: text.color })
  const textMesh = new Mesh(textGeometry, textMaterial)
  textMesh.position.set(text.position.x, text.position.y, text.position.z)
  textMesh.setRotationFromEuler(new Euler(text.rotation.x, text.rotation.y, text.rotation.z, 'ZXY'))

  return textMesh
}

export function gen2DText(text: TextEntity): Mesh {
  // 创建一个以中心点为中心为2D文字
  const textMesh = new Text()
  textMesh.text = text.text
  textMesh.fontSize = text.size
  textMesh.color = text.color
  textMesh.anchorX = 'center'
  textMesh.anchorY = 'middle'
  textMesh.position.set(text.position.x, text.position.y, text.position.z)
  textMesh.setRotationFromEuler(new Euler(text.rotation.x, text.rotation.y, text.rotation.z, 'ZXY'))
  return textMesh
}

// 绘制不带箭头的标注线
export function genAnnoLineNoArrow2D(markLine: MarkLine): Group {
  const group = new Group()

  // 获取标注线的基本参数
  const centerPoint = markLine.getCenterPoint()
  const direction = markLine.getDirection()

  // 创建标注线
  const material = new THREE.LineBasicMaterial({
    color: markLine.color,
  })
  const points = [markLine.startPoint, markLine.endPoint]
  const geometry = new BufferGeometry().setFromPoints(points)
  const line = new Line(geometry, material)
  group.add(line)

  // 创建一个正交基
  const xAxis = direction.clone()
  const zAxis = markLine.upVector.clone().normalize()
  // 确保z轴与x轴正交
  if (Math.abs(xAxis.dot(zAxis)) > 0.001) {
    zAxis.sub(xAxis.clone().multiplyScalar(xAxis.dot(zAxis)))
    zAxis.normalize()
  }
  // y轴
  const yAxis = new Vector3().crossVectors(zAxis, xAxis).normalize()

  if (markLine.text) {
    const textMesh = new Text()
    textMesh.text = markLine.text
    textMesh.fontSize = markLine.textSize
    textMesh.color = markLine.textColor
    textMesh.anchorX = 'center'
    textMesh.anchorY = 'middle'
    textMesh.sdfGlyphSize = 64
    textMesh.position.copy(centerPoint)

    const rotationMatrix = new Matrix4().makeBasis(xAxis, yAxis, zAxis)
    // 提取四元数
    const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix)
    // 应用旋转
    textMesh.quaternion.copy(quaternion)

    // 进行文字偏移 - 现在可以直接使用y轴作为偏移方向
    textMesh.position.add(yAxis.clone().multiplyScalar(markLine.paddingBottom))
    group.add(textMesh)
  }

  // 连接线
  if (markLine.closeLine.startLength > 0) {
    const inc = markLine.closeLine.startLength / 2
    const startLineP1 = markLine.startPoint.clone().add(yAxis.clone().multiplyScalar(inc))
    const startLineP2 = markLine.startPoint.clone().sub(yAxis.clone().multiplyScalar(inc))

    const startLinePoints = [startLineP1, startLineP2]
    const startLineGeometry = new BufferGeometry().setFromPoints(startLinePoints)
    const startLine = new Line(startLineGeometry, material)
    // 设置连接线位置
    // startLine.position.copy(markLine.startPoint)
    startLine.translateOnAxis(yAxis, markLine.closeLine.translateStart)

    group.add(startLine)
  }
  // 连接线
  if (markLine.closeLine.endLength > 0) {
    const inc = markLine.closeLine.endLength / 2
    const endLineP1 = markLine.endPoint.clone().add(yAxis.clone().multiplyScalar(inc))
    const endLineP2 = markLine.endPoint.clone().sub(yAxis.clone().multiplyScalar(inc))

    const endLinePoints = [endLineP1, endLineP2]
    const endLineGeometry = new BufferGeometry().setFromPoints(endLinePoints)
    const endLine = new Line(endLineGeometry, material)

    endLine.translateOnAxis(yAxis, markLine.closeLine.translateEnd)

    group.add(endLine)
  }

  return group
}

// 模型测试
export function genTestModel() {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-10, 0, 0),
      new THREE.Vector3(-5, 5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(5, -5, 0),
      new THREE.Vector3(10, 0, 0),
    ],
    false,
    'catmullrom',
    1,
  )

  const points = curve.getPoints(50)
  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 })

  // Create the final object to add to the scene
  const curveObject = new THREE.Line(geometry, material)
  return curveObject
}
