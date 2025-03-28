import { Module } from '@/types'
/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:20:07
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-20 17:57:42
 * @FilePath: \kdPlankCheck\src\services\threePlugins\eventHandlerPlugin.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { IPluginTemplate } from './IPlugin'
import { ThreeService } from '@/services/ThreeService'
import { Raycaster, Vector2 } from 'three'
import log from '@/utils/log'
// 事件处理插件
export class EventHandlerPlugin implements IPluginTemplate {
  static pluginName = 'EventHandlerPlugin'
  static events: string[] = ['doubleClickMesh']
  static apis: string[] = []

  app: ThreeService

  constructor(app: ThreeService) {
    this.app = app
  }

  // 钩子
  public mounted() {
    try {
      this.initEvent()
    } catch (error) {
      log.error('监听双击事件失败', error)
      throw error
    }
  }

  initEvent() {
    // 添加事件监听
    if (!this.app.renderer) {
      log.error('渲染器不存在!')
      return
    }
    // 单击事件
    this.app.renderer.domElement.addEventListener('click', this.onClick)
    // 双击事件
    this.app.renderer.domElement.addEventListener('dblclick', this.onDoubleClick)
  }

  // 单击事件
  onClick = (event: MouseEvent) => {
    // 递归找到最外层group
    const meshes = this.getIntersectedMesh(event)
    if (meshes && meshes.length > 0) {
      let current = meshes[0].object
      while (current.parent && current.parent.type !== 'Scene') {
        current = current.parent
      }
      this.app.emit('singleClickMesh', current)
    } else {
      log.debug('没有点击到任何物体')
    }
  }
  // 双击事件
  onDoubleClick = (event: MouseEvent) => {
    const intersects = this.getIntersectedMesh(event)
    if (intersects && intersects.length > 0) {
      const intersect = intersects[0]
      // 触发事件
      const obj = intersect.object
      if (obj?.parent) {
        this.app.emit('doubleClickMesh', obj.parent)
      }
    } else {
      log.debug('没有点击到任何物体')
    }
  }

  // 获取点击到的模型
  getIntersectedMesh = (event: MouseEvent) => {
    if (!this.app.scene || !this.app.camera) {
      log.error('场景或相机不存在!')
      return
    }
    const mouse = this.getMousePosition(event)
    if (!mouse) {
      log.error('鼠标位置不存在!')
      return
    }
    const raycaster = new Raycaster()
    raycaster.setFromCamera(mouse, this.app.camera)
    const intersects = raycaster.intersectObjects(this.app.scene.children, true)
    return intersects
  }

  // 获取鼠标位置
  getMousePosition = (event: MouseEvent) => {
    if (!this.app.renderer) {
      log.error('渲染器不存在!')
      return
    }
    const mouse = new Vector2()
    // 计算鼠标位置
    const rect = this.app.renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    return mouse
  }

  dispose() {
    if (this.app.renderer) {
      this.app.renderer.domElement.removeEventListener('dblclick', this.onDoubleClick)
      this.app.renderer.domElement.removeEventListener('click', this.onClick)
    }
  }
}
