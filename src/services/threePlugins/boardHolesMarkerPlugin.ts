import type { IPluginTemplate } from './IPlugin'
import { ThreeService } from '@/services/ThreeService'
import { MarkLine } from '@/types/markLine'
import { genAnnoLine, genAnnoLineNoArrow2D } from '@/utils/three/modelGenerator'
import { Group, Object3D, Vector3 } from 'three'
import { Module, ModuleType, type MarkLineOptions } from '@/types'
import { FloatLessOrEqual, FloatGreaterOrEqual } from '@/utils/math'

import log from '@/utils/log'
// 板件标注插件
export class BoardHolesMarkerPlugin implements IPluginTemplate {
  static pluginName = 'BoardHolesMarkerPlugin'
  static events: string[] = []
  static apis: string[] = []

  app: ThreeService

  // 标注线缓存
  cacheMarkLineObj: Group[] = []

  constructor(app: ThreeService) {
    this.app = app
  }

  // 清除标注线
  public clearCache() {
    this.cacheMarkLineObj.forEach((obj) => {
      this.app.scene?.remove(obj)
    })
    this.cacheMarkLineObj = []
  }

  // 标注板件
  public markModule(JCB: Module) {
    log.debug('markModule', this.app.scene?.children)
    const JCBObj = this.app.scene?.getObjectByName(JCB.ObjID)
    log.info('markModule', JCBObj)
    if (!JCBObj) return

    // 获取板下所有的孔
    const holes: Module[] = []

    this.app.scene?.traverse((obj) => {
      const module = obj.userData.module as Module
      if (module && module.modelType === ModuleType.Hole) {
        holes.push(module)
      }
    })

    // 分类孔
    const sideHoles = this.classifyHoles(JCB, holes)

    this.markHoles(JCBObj, sideHoles)
    this.markBoardSize(JCBObj)
  }

  // 标注孔
  public markHoles(
    JCBObj: Object3D,
    sideHoles: {
      left: Module[]
      right: Module[]
      front: Module[]
      back: Module[]
    },
  ) {
    if (!JCBObj) return
    // 获取所有方向
    const directions = Object.keys(sideHoles) as Array<keyof typeof sideHoles>

    // 遍历每个方向
    directions.forEach((direction) => {
      const holes = sideHoles[direction]

      // 为每个方向的相邻孔创建标注线
      for (let i = 0; i < holes.length - 1; i++) {
        const hole = holes[i]
        const nextHole = holes[i + 1]
        this.createHoleMarkLine(JCBObj, hole, nextHole)
      }
    })
  }
  //标注板的尺寸
  public markBoardSize(obj: Object3D) {
    const JCB = obj.userData.module as Module
    // 标注线整体偏移
    const offset = 50
    // 基础配置
    const baseConfig = {
      textSize: 25,
      textColor: 0x666666,
      color: 'blue',
      paddingBottom: 10,
      closeLine: {
        startLength: offset,
        endLength: offset,
        translateStart: 0,
        translateEnd: 0,
      },
    }
    const Lines = [
      { p1: new Vector3(0, 0, JCB.Dim.z / 2), p2: new Vector3(0, JCB.Dim.y, JCB.Dim.z / 2) },
      {
        p1: new Vector3(0, JCB.Dim.y, JCB.Dim.z / 2),
        p2: new Vector3(JCB.Dim.x, JCB.Dim.y, JCB.Dim.z / 2),
      },
      {
        p1: new Vector3(JCB.Dim.x, 0, JCB.Dim.z / 2),
        p2: new Vector3(JCB.Dim.x, JCB.Dim.y, JCB.Dim.z / 2),
      },
      { p1: new Vector3(0, 0, JCB.Dim.z / 2), p2: new Vector3(JCB.Dim.x, 0, JCB.Dim.z / 2) },
    ]
    Lines.forEach((line) => {
      const { p1, p2 } = line
      const boardMarkLine = this.createAutoOffsetMarkLine(
        JCB,
        new Vector3(0, 0, 1),
        p1,
        p2,
        offset,
        baseConfig,
      )
      const annotationGroup = genAnnoLineNoArrow2D(boardMarkLine)
      obj.add(annotationGroup)
    })
  }

  // 创建标注想
  public createHoleMarkLine(parent: Object3D, hole1: Module, hole2: Module) {
    // 标注线整体偏移
    const offset = 25
    // 基础配置
    const baseConfig = {
      textSize: 25,
      textColor: 0x666666,
      color: 'blue',
      paddingBottom: 10,
      closeLine: {
        startLength: offset,
        endLength: offset,
        translateStart: 0,
        translateEnd: 0,
      },
    }
    // 坐标转换
    const JCBModule = parent.userData.module as Module
    const hole1Local = JCBModule.WorldToLocalMatrix.dotVec(hole1.AbsPos)
    const hole2Local = JCBModule.WorldToLocalMatrix.dotVec(hole2.AbsPos)

    const startP = new Vector3(hole1Local.x, hole1Local.y, hole1Local.z)
    const endP = new Vector3(hole2Local.x, hole2Local.y, hole2Local.z)
    const holeMarkLine = this.createAutoOffsetMarkLine(
      JCBModule,
      new Vector3(0, 0, 1),
      startP,
      endP,
      offset,
      baseConfig,
    )
    // 创建标注线
    const annotationGroup = genAnnoLineNoArrow2D(holeMarkLine)
    parent.add(annotationGroup)
  }

  // 分类孔
  classifyHoles(JCB: Module, holes: Module[]) {
    const sideHoles = {
      left: [] as Module[],
      right: [] as Module[],
      front: [] as Module[],
      back: [] as Module[],
    }
    // 局部
    holes.forEach((hole) => {
      // 转为局部坐标
      const holeLocal = JCB.WorldToLocalMatrix.dotVec(hole.AbsPos)
      if (FloatLessOrEqual(holeLocal.y, 0)) {
        sideHoles.left.push(hole)
      } else if (FloatGreaterOrEqual(holeLocal.y, JCB.Dim.y)) {
        sideHoles.right.push(hole)
      } else if (FloatLessOrEqual(holeLocal.x, 0)) {
        sideHoles.back.push(hole)
      } else if (FloatGreaterOrEqual(holeLocal.x, JCB.Dim.x)) {
        sideHoles.front.push(hole)
      }
    })
    // 排序
    sideHoles.left.sort((a, b) => a.relativePos.x - b.relativePos.x)
    sideHoles.right.sort((a, b) => a.relativePos.x - b.relativePos.x)
    sideHoles.front.sort((a, b) => a.relativePos.y - b.relativePos.y)
    sideHoles.back.sort((a, b) => a.relativePos.y - b.relativePos.y)
    return sideHoles
  }

  // 在两个点之间创建标注线，根据父对象的尺寸自动计算偏移
  public createAutoOffsetMarkLine(
    JCBModule: Module,
    upVector: Vector3,
    startP: Vector3,
    endP: Vector3,
    offset: number,
    baseConfig: MarkLineOptions,
  ) {
    const dis = startP.distanceTo(endP)
    const lineCenter = new Vector3().addVectors(startP, endP).divideScalar(2)
    const JCBCenter = new Vector3(JCBModule.Dim.x / 2, JCBModule.Dim.y / 2, JCBModule.Dim.z / 2)
    const dir = new Vector3().subVectors(endP, startP).normalize()
    // 计算偏移向量
    const verticalV = new Vector3().crossVectors(upVector, dir).normalize()
    const outerV = lineCenter.clone().sub(JCBCenter)
    const dotProduct = verticalV.dot(outerV)
    const offsetV = verticalV.clone()
    if (dotProduct < 0) {
      // 外偏
      offsetV.negate()
    }
    const offsetStart = startP.clone().add(offsetV.clone().multiplyScalar(offset))
    const offsetEnd = endP.clone().add(offsetV.clone().multiplyScalar(offset))

    // 创建标注线
    const holeMarkLine = new MarkLine(offsetStart, offsetEnd, dis.toFixed(0), upVector, {
      ...baseConfig,
      closeLine: baseConfig.closeLine,
    })
    return holeMarkLine
  }
}
