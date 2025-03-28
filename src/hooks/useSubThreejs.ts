/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-18 16:59:29
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-21 11:10:34
 * @FilePath: \kdPlankCheck\src\hooks\useSubThreejs.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 子组件的threejs
import { ThreeService } from '@/services/ThreeService'
import {
  CameraManager,
  ModelManager,
  ViewChangePlugin,
  BoardHolesMarkerPlugin,
  ViewMode,
} from '@/services/threePlugins'
import { Module, ModuleType } from '@/types'
import { cloneDeep } from 'lodash'
import { calcRelative } from '@/utils/dataUtil/KJLDataChange'
import { Euler, Vector4, isFloatEqual, WorldToLocMat, Matrix4 } from '@/utils/math'
import { traverseTreeBySubModules, getModuleById } from '@/utils/treeUtil'
import { useSceneStore } from '@/stores/scene'
import log from '@/utils/log'

export const subThreeService = new ThreeService()
subThreeService
  .use(CameraManager)
  .use(ModelManager)
  .use(ViewChangePlugin)
  .use(BoardHolesMarkerPlugin)

export const useSubThreejs = () => {
  const sceneStore = useSceneStore()

  // 绘制板下的孔和槽
  const drawPlankHolesAndGrooves = (JCB: Module) => {
    const modules = sceneStore.getModules()
    const plank = getModuleById(JCB.ParentId, modules)
    if (!plank) return
    subThreeService.deleteAllModel().then(() => {
      const moduleList = findHolesAndGrooves(JCB, modules)
      offsetHoleAndGroove(moduleList, modules)
      const newPlank = convertToDrawData(plank, moduleList)
      // 绘制
      subThreeService.drawModel(newPlank).then(() => {
        subThreeService.markBoard(JCB)
        subThreeService.changeViewMode(ViewMode.MATERIAL_AND_WIREFRAME)
      })
    })
  }
  return {
    drawPlankHolesAndGrooves,
  }
}

// 转换成绘制数据
const convertToDrawData = (plank: Module, moduleList: Module[]) => {
  const newPlank = cloneDeep(plank)
  newPlank.SubModules = newPlank.SubModules.filter(
    (module) => module.modelType === ModuleType.JCBoard,
  )

  for (const module of moduleList) {
    newPlank.SubModules.push(cloneDeep(module))
  }

  const plankAndModules = [newPlank]
  // 更新相对位置
  calcRelative(plankAndModules)

  // 将板放回平面
  const JCBoardModule = newPlank.SubModules.find(
    (module) => module.modelType === ModuleType.JCBoard,
  )
  if (!JCBoardModule) return []
  const { relativeRot, relativePos } = JCBoardModule
  const PToCMat = WorldToLocMat(relativePos, relativeRot)
  const euler = Euler.FromRotationMatrix(PToCMat)
  const pos = Matrix4.TranslationFromMatrix(PToCMat)
  newPlank.relativeRot = euler
  newPlank.relativePos = pos

  return plankAndModules
}

// 偏移孔和槽,使得外部能看见
const offsetHoleAndGroove = (holeAndGroove: Module[], modules: Module[]) => {
  const offset = 0.3
  holeAndGroove.forEach((module) => {
    // 局部
    const offsetV = module.towardVecInParent.negate().scale(offset)
    const newLocalPos = module.relativePos.add(offsetV)
    newLocalPos.w = 1
    // 世界
    const p = getModuleById(module.ParentId, modules) as Module | null
    if (!p) {
      module.AbsPos = newLocalPos
    } else {
      module.AbsPos = p.LocalToWorldMatrix.dotVec(newLocalPos)
    }
  })
}

// 找板件下面的孔和槽
const findHolesAndGrooves = (plank: Module, modules: Module[]) => {
  const plankHolesAndGrooves: Module[] = []
  traverseTreeBySubModules(modules, (module) => {
    if (module.modelType === ModuleType.Hole && holeInPlank(module, plank)) {
      plankHolesAndGrooves.push(module)
    } else if (module.modelType === ModuleType.Groove && grooveInPlank(module, plank)) {
      plankHolesAndGrooves.push(module)
    }
  })
  return plankHolesAndGrooves
}

const holeInPlank = (hole: Module, plank: Module) => {
  if (!hole.parameters.holeHeight) return
  const offset = 0.5
  const p1 = hole.AbsPos
  const p2 = p1.add(hole.towardVecInWorld.scale(hole.parameters.holeHeight))
  p1.w = 1
  p2.w = 1

  const p1InPlank = plank.WorldToLocalMatrix.dotVec(p1)
  const p2InPlank = plank.WorldToLocalMatrix.dotVec(p2)

  const minBound = new Vector4(0, 0, 0, 0).sub(new Vector4(offset, offset, offset, 0))
  const maxBound = new Vector4(plank.Dim.x, plank.Dim.y, plank.Dim.z, 0).add(
    new Vector4(offset, offset, offset, 0),
  )
  // 在板内
  if (
    p1InPlank.lessThanOrEqual(maxBound) &&
    p1InPlank.greaterThanOrEqual(minBound) &&
    p2InPlank.lessThanOrEqual(maxBound) &&
    p2InPlank.greaterThanOrEqual(minBound)
  ) {
    return true
  }
  return false
}

const grooveInPlank = (groove: Module, plank: Module) => {
  const params = groove.parameters
  if (!params || !params.grooveInWorldToward) return

  const getGrooveLocal4Point = (groove: Module) => {
    const p1 = new Vector4(0, 0, 0, 1)
    const p2 = new Vector4(0, 0, 0, 1)
    const pMin = new Vector4(0, 0, 0, 1)
    const pMax = new Vector4(groove.Dim.x, groove.Dim.y, groove.Dim.z, 1)
    const params = groove.parameters
    if (!params.grooveInWorldToward) return
    if (isFloatEqual(Math.abs(params.grooveInWorldToward.x), 1)) {
      p1.x = 0
      p1.y = groove.Dim.y / 2
      p1.z = groove.Dim.z / 2
      p2.x = groove.Dim.x
      p2.y = groove.Dim.y / 2
      p2.z = groove.Dim.z / 2
    } else if (isFloatEqual(Math.abs(params.grooveInWorldToward.z), 1)) {
      p1.x = groove.Dim.x / 2
      p1.y = groove.Dim.y / 2
      p1.z = 0
      p2.x = groove.Dim.x / 2
      p2.y = groove.Dim.y / 2
      p2.z = groove.Dim.z
    } else if (isFloatEqual(Math.abs(params.grooveInWorldToward.y), 1)) {
      p1.x = groove.Dim.x / 2
      p1.y = 0
      p1.z = groove.Dim.z / 2
      p2.x = groove.Dim.x / 2
      p2.y = groove.Dim.y
      p2.z = groove.Dim.z / 2
    } else {
      console.error('槽的生长方向错误')
    }
    return { p1, p2, pMin, pMax }
  }
  let p1: Vector4, p2: Vector4, pMin: Vector4, pMax: Vector4
  const res = getGrooveLocal4Point(groove)
  if (!res) return false
  ;({ p1, p2, pMin, pMax } = res)
  if (!p1 || !p2 || !pMin || !pMax) return false
  // 世界坐标
  p1 = groove.LocalToWorldMatrix.dotVec(p1)
  p2 = groove.LocalToWorldMatrix.dotVec(p2)
  pMin = groove.LocalToWorldMatrix.dotVec(pMin)
  pMax = groove.LocalToWorldMatrix.dotVec(pMax)

  // 转成局部坐标系
  p1 = plank.WorldToLocalMatrix.dotVec(p1)
  p2 = plank.WorldToLocalMatrix.dotVec(p2)
  pMin = plank.WorldToLocalMatrix.dotVec(pMin)
  pMax = plank.WorldToLocalMatrix.dotVec(pMax)

  const grooveCenter = p1.add(p2).scale(0.5)

  if (
    pMin.z <= plank.Dim.z &&
    pMin.z >= 0 &&
    pMax.z <= plank.Dim.z &&
    pMax.z >= 0 &&
    grooveCenter.lessThanOrEqual(plank.Dim) &&
    grooveCenter.greaterThanOrEqual(new Vector4(0, 0, 0, 0))
  ) {
    return true
  }
  return false
}
