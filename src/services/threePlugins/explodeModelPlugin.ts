/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:20:07
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-12 11:47:33
 * @FilePath: \kdPlankCheck\src\services\threePlugins\explodeModelPlugin.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { Object3D } from 'three'
import { Vector3, Box3 } from 'three'
import { ThreeService } from '@/services/ThreeService'
import { ModuleType } from '@/types'
import type { IPluginTemplate } from './IPlugin'
import log from '@/utils/log'

interface ExplodeData {
  id: string
  // 爆炸中心
  explodeCenter: Vector3
  // 模型中心
  meshCenter: Vector3
  // 爆炸方向
  explodeDirection: Vector3
  // 爆炸距离
  explodeDistance: number
  // 爆炸前的世界位置
  originPosition: Vector3
}

class ExplodeModelPlugin implements IPluginTemplate {
  static pluginName = 'ExplodeModelPlugin'

  static events: string[] = []
  static apis: string[] = []

  public app?: ThreeService

  public explodeData: ExplodeData[] = []

  // 主程序提供的服务
  constructor(threeService: ThreeService) {
    this.app = threeService
  }

  // 初始化顶层模型的爆炸数据
  public initTopModelExplodeData() {
    if (!this.app || !this.app.scene) return
    // 计算所有模型的中心
    const topModels = this.app.scene.children.filter((child) => child.userData.module)
    if (topModels.length === 0) return
    // 包围所有topModels的包围盒
    const explodeBox = new Box3()
    topModels.forEach((child) => {
      explodeBox.expandByObject(child)
    })
    const explodeCenter = this.getBoxCenter(explodeBox)

    // 迭代计算每个模型的爆炸数据
    topModels.forEach((topModel) => {
      const explodeData = this.initModelExplodeData(topModel, explodeCenter)
      this.explodeData.push(explodeData)
    })
  }
  // 初始化板件模型的爆炸
  public initBoardModelExplodeData() {
    if (!this.app || !this.app.scene) return
    // 顶层模型
    const topModels = this.app.scene.children.filter((child) => child.userData.module)
    if (topModels.length === 0) return

    // 包围所有topModels的包围盒
    const explodeBox = new Box3()
    topModels.forEach((child) => {
      explodeBox.expandByObject(child)
    })
    const explodeCenter = this.getBoxCenter(explodeBox)

    topModels.forEach((topModel) => {
      // 获取下面的板件
      topModel.traverse((child) => {
        if (child.userData.module && child.userData.module.modelType === ModuleType.Board) {
          const explodeData = this.initModelExplodeData(child, explodeCenter)
          this.explodeData.push(explodeData)
        }
      })
    })
  }

  // 模型绘制前
  public modelLoadBefore() {
    log.debug('释放爆炸数据')
    this.explodeData = []
  }

  //模型绘制后
  public modelLoadAfter() {
    log.debug('初始化爆炸数据')
    if (!this.app || !this.app.scene) return
    // 初始化顶层模型的爆炸数据
    this.initTopModelExplodeData()
    // 初始化板件模型的爆炸数据
    this.initBoardModelExplodeData()
  }

  // 爆炸
  public explodeModel(scale: number) {
    if (!this.app || !this.app.scene) return

    this.explodeData.forEach((explodeData) => {
      this.updateModelPosition(explodeData, scale)
    })
  }

  // 根据模型中心和爆炸中心更新模型位置
  public updateModelPosition(explodeData: ExplodeData, scale: number) {
    const model = this.app?.scene?.getObjectByName(explodeData.id)
    if (!model) return

    const dis = explodeData.explodeDirection
      .clone()
      .multiplyScalar(explodeData.explodeDistance * scale)

    const offset = new Vector3().subVectors(explodeData.meshCenter, explodeData.originPosition)

    const center = explodeData.explodeCenter
    const newPos = new Vector3().copy(center).add(dis).sub(offset)
    const localPosition = model.parent?.worldToLocal(newPos)
    if (localPosition) {
      model.position.copy(localPosition)
    }
  }
  // 计算box的中心
  private getBoxCenter(box: Box3): Vector3 {
    return new Vector3().addVectors(box.max, box.min).multiplyScalar(0.5)
  }

  // 根据爆炸中心和模型计算初始化数据
  private initModelExplodeData(model: Object3D, explodeCenter: Vector3): ExplodeData {
    const meshBox = new Box3()
    meshBox.setFromObject(model)
    const meshCenter = this.getBoxCenter(meshBox)
    // 爆炸方向
    const explodeDirection = new Vector3().subVectors(meshCenter, explodeCenter).normalize()
    // 距离
    const explodeDistance = new Vector3().subVectors(meshCenter, explodeCenter).length()
    // 爆炸前的世界位置
    const originPosition = model.getWorldPosition(new Vector3())

    const explodeData: ExplodeData = {
      id: model.name,
      explodeCenter: explodeCenter.clone(),
      meshCenter: meshCenter.clone(),
      explodeDirection: explodeDirection,
      explodeDistance: explodeDistance,
      originPosition: originPosition,
    }

    return explodeData
  }
}

export { ExplodeModelPlugin }
