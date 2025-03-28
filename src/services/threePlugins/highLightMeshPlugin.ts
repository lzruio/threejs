/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:20:07
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-21 09:03:08
 * @FilePath: \kdPlankCheck\src\services\threePlugins\highLightMeshPlugin.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { IPluginTemplate } from './IPlugin'
import { ThreeService } from '@/services/ThreeService'
import { BoxHelper, Object3D, Material } from 'three'
import log from '@/utils/log'
// 高亮管理器
export class HighLightMeshPlugin implements IPluginTemplate {
  static pluginName = 'HighLightMeshPlugin'
  static events: string[] = []
  static apis: string[] = []

  app: ThreeService

  // 存储对象和其对应的包围盒的Map
  private meshBoxMap: Map<Object3D, BoxHelper> = new Map()

  constructor(app: ThreeService) {
    this.app = app
  }

  // 释放数据
  public modelLoadBefore() {
    log.debug('释放高亮数据')
    this.meshBoxMap.clear()
  }

  // 高亮一个模型
  public highLightMesh(object: Object3D) {
    if (this.meshBoxMap.has(object)) {
      // 移除旧box
      const oldBox = this.meshBoxMap.get(object)!
      object.remove(oldBox)
      oldBox.dispose() // 释放资源
      this.meshBoxMap.delete(object)
    }

    // 创建新的包围盒
    const box = new BoxHelper(object, 0x00ffff)
    box.renderOrder = 999
    const boxMaterial = box.material as Material
    boxMaterial.depthTest = false
    object.attach(box)
    this.meshBoxMap.set(object, box)
  }

  // 高亮多个模型
  public highLightMeshes(objects: Object3D[]) {
    // 先隐藏所有包围盒
    this.meshBoxMap.forEach((box) => (box.visible = false))
    // 显示需要高亮的对象的包围盒
    objects.forEach((object) => this.highLightMesh(object))
  }

  // 取消所有模型的高亮
  public cancelHighLightMeshes() {
    this.meshBoxMap.forEach((box) => (box.visible = false))
  }
}
