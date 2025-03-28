/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-12 12:02:56
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-13 15:21:16
 * @FilePath: \kdPlankCheck\src\services\threePlugins\ModelNumberMarker.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import type { IPluginTemplate } from './IPlugin'
import { ThreeService } from '@/services/ThreeService'
import { Box3, Object3D, Vector3, Mesh, MeshBasicMaterial, Euler } from 'three'
import { CSS2DObject } from 'three/addons'
import log from '@/utils/log'
import { Module, TextureType } from '@/types'
import { gen3DText, gen2DText } from '@/utils/three/modelGenerator'
import { degToRad } from '@/utils/math'
// @ts-expect-error 没有找到官方的类型声明包
import { Text } from 'troika-three-text'

// 模型编号映射插件
export interface ModelNumberMap {
  id: string
  index: number
}
export class NumberMarkerPlugin implements IPluginTemplate {
  static pluginName = 'NumberMarkerPlugin'
  static events: string[] = []
  static apis: string[] = []

  app: ThreeService

  // 存储柜子及其对应的编号
  private cabinetNumberMap: Map<Object3D, Object3D> = new Map()

  // 存储板件及其对应的编号
  private boardNumberMap: Map<Object3D, Object3D[]> = new Map()

  constructor(app: ThreeService) {
    this.app = app
  }
  // 模型绘制前
  public modelLoadBefore() {
    log.debug('释放编号数据')
    this.cabinetNumberMap.clear()
    this.boardNumberMap.clear()
  }

  // 标记柜子(顶层标记)
  public showCabinetNumMarker(modelIDMap: ModelNumberMap[]) {
    if (!this.app.scene) {
      return
    }
    modelIDMap.forEach((item: ModelNumberMap) => {
      // 是否已经标记过
      const model = this.app?.scene?.getObjectByName(item.id)
      if (!model) return
      let numberMarkerObj = this.cabinetNumberMap.get(model)
      if (!numberMarkerObj) {
        numberMarkerObj = this._markSingleCabinet(model, item.index)
        if (numberMarkerObj) {
          this.cabinetNumberMap.set(model, numberMarkerObj)
        }
      }
      if (numberMarkerObj) {
        numberMarkerObj.visible = true
      }
    })
  }

  // 隐藏柜子编号
  public hideCabinetNumMarker() {
    this.cabinetNumberMap.forEach((numberMarkerObj) => {
      numberMarkerObj.visible = false
    })
  }

  // 标注板件编号
  public showBoardNumMarker(modelIDMap: ModelNumberMap[]) {
    if (!this.app.scene) return
    modelIDMap.forEach((item: ModelNumberMap) => {
      // 是否已经标记过
      const model = this.app?.scene?.getObjectByName(item.id)
      if (!model) return
      let numberMarkerObj = this.boardNumberMap.get(model)
      if (!numberMarkerObj) {
        numberMarkerObj = this._markSingleBoard(model, item.index)
        if (numberMarkerObj) {
          this.boardNumberMap.set(model, numberMarkerObj)
        }
      }
      if (numberMarkerObj) {
        numberMarkerObj.forEach((obj) => {
          obj.visible = true
        })
      }
    })
  }

  // 隐藏板件编号
  public hideBoardNumMarker() {
    this.boardNumberMap.forEach((numberMarkerObj) => {
      numberMarkerObj.forEach((obj) => {
        obj.visible = false
      })
    })
  }

  // 对单个柜子进行标记
  private _markSingleCabinet(model: Object3D, index: number) {
    // 创建2D对象
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.color = 'blue'
    div.style.fontSize = '20px'
    div.innerHTML = `${index}`
    const css2DObject = new CSS2DObject(div)
    // 世界坐标
    const modelBox = new Box3().setFromObject(model)
    const modelCenter = modelBox.getCenter(new Vector3())
    // 转化为在model下的坐标
    const localPos = model.worldToLocal(modelCenter)
    css2DObject.position.set(localPos.x, localPos.y, localPos.z)
    model.add(css2DObject)
    return css2DObject
  }

  // 对单个板件进行标记
  private _markSingleBoard(model: Object3D, index: number) {
    const module = model.userData.module as Module
    const ro1 = new Vector3(0, 0, 0)
    const ro2 = new Vector3(0, 0, 0)
    ro2.y = degToRad(180)
    const enhanceZ = 1
    if (module.textureType === TextureType.Vertical) {
      ro1.z = degToRad(-90)
      ro2.z = degToRad(-90)
    }

    // 正面文字
    const textMesh = gen2DText({
      text: `${index}`,
      position: new Vector3(module.Dim.x / 2, module.Dim.y / 2, module.Dim.z + enhanceZ),
      rotation: ro1,
      color: 'blue',
      size: 42,
      depth: 1,
    })

    // 背面文字
    const textMesh2 = gen2DText({
      text: `${index}`,
      position: new Vector3(module.Dim.x / 2, module.Dim.y / 2, 0 - enhanceZ),
      rotation: ro2,
      color: 'blue',
      size: 42,
      depth: 1,
    })

    model.add(textMesh)
    model.add(textMesh2)

    return [textMesh, textMesh2]
  }
}
