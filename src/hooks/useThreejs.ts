/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-12 08:44:05
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-21 11:50:26
 * @FilePath: \kdPlankCheck\src\hooks\useExplosion.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 组合各个store，提供公用函数
import { useThreeEffectStore } from '@/stores/threeEffect'
import { useCompStatusStore } from '@/stores/compStatus'
import { useSceneStore } from '@/stores/scene'
import { traverseTreeBySubModules } from '@/utils/treeUtil'
import { ModuleType, type Module } from '@/types'
import { LoadMode, ViewMode } from '@/services/threePlugins'
import type { ModelNumberMap } from '@/services/threePlugins'
import { ThreeService } from '@/services/ThreeService'
import {
  CameraManager,
  ModelManager,
  ViewChangePlugin,
  HighLightMeshPlugin,
  EventHandlerPlugin,
  ExplodeModelPlugin,
  NumberMarkerPlugin,
  TestPlugin,
} from '@/services/threePlugins'
import log from '@/utils/log'

// 主组件的threeJs服务
export const threeService = new ThreeService()
// 这里添加功能插件
threeService
  .use(CameraManager)
  .use(ModelManager)
  .use(HighLightMeshPlugin)
  .use(ViewChangePlugin)
  .use(EventHandlerPlugin)
  .use(ExplodeModelPlugin)
  .use(NumberMarkerPlugin)
  .use(TestPlugin)

// 主组件的threeJs服务
export const useThreeJS = () => {
  const threeStore = useThreeEffectStore()
  const compStore = useCompStatusStore()
  const sceneStore = useSceneStore()

  // 重设按钮激活状态
  const resetActiveIds = () => {
    threeStore.setExplodeFactor(1)
    compStore.activeIds.delete('showCabinetNumber')
    compStore.activeIds.delete('showBoardNumber')
    compStore.activeIds.delete('hideDoor')
    compStore.activeIds.delete('explosion')
  }

  // 重新绘制场景
  const resetScene = async (modules: Module[]) => {
    await threeService.deleteAllModel()
    await threeService.drawModel(modules, true, LoadMode.ASYNC, {
      generateGroove: true,
      generateHole: true,
      generateClothesRail: false,
    })
    // threeService.changeViewMode(ViewMode.WIREFRAME)
  }

  // 绘制当前柜体
  const drawCurrentCabinet = async () => {
    const cabinet = sceneStore.getCurrentCabinet()
    log.debug('绘制当前柜体', cabinet)
    if (!cabinet) {
      return
    }
    const modules = [cabinet]
    await resetScene(modules)
    resetActiveIds()
  }

  // 更新为全部场景
  const drawAllCabinet = async () => {
    const modules = sceneStore.getModules()
    log.debug('绘制全部柜体', modules)
    await resetScene(modules)
    resetActiveIds()
  }

  // 高亮模型
  const highlightModel = () => {
    const currentModelID = sceneStore.getCurrentModelID()
    if (!currentModelID) {
      return
    }
    log.debug('高亮模型', currentModelID)
    threeService.highlightModels([currentModelID])
  }

  // 隐藏门板
  const hideDoorModels = () => {
    compStore.updateActiveIds('hideDoor')
    // 获取所有的门板模型
    const modules = sceneStore.getModules()
    const doorModuleIds: string[] = []
    traverseTreeBySubModules(modules, (module: Module) => {
      if (module.modelType === ModuleType.DoorBoard) {
        doorModuleIds.push(module.ObjID)
      }
    })
    log.debug('隐藏门板', doorModuleIds)
    if (compStore.activeIds.has('hideDoor')) {
      threeService.hideModels(doorModuleIds)
    } else {
      threeService.showModels(doorModuleIds)
    }
  }
  const explosionModels = () => {
    log.debug('爆炸模型', threeStore.explodeFactor)
    compStore.updateActiveIds('explosion')
    if (compStore.explosionSlider) {
      threeStore.setExplodeFactor(1.5)
    } else {
      threeStore.setExplodeFactor(1)
    }
  }

  // 显示编号
  const showCabNum = () => {
    log.debug('显示编号')
    compStore.updateActiveIds('showCabinetNumber')
    if (compStore.activeIds.has('showCabinetNumber')) {
      const cabinets = sceneStore.cabinets
      const cabinetMap: ModelNumberMap[] = cabinets.map((cabinet) => {
        return {
          id: cabinet.key,
          index: cabinet.index,
        }
      })
      threeService.showCabinetNumMarker(cabinetMap)
    } else {
      threeService.hideCabinetNumMarker()
    }
  }

  // 显示板号
  const showBoardNum = () => {
    log.debug('显示板号')
    compStore.updateActiveIds('showBoardNumber')
    if (compStore.activeIds.has('showBoardNumber')) {
      const modules = sceneStore.boards
      const boardMap: ModelNumberMap[] = modules.map((module) => {
        return {
          id: module.key,
          index: module.index,
        }
      })
      threeService.showBoardNumMarker(boardMap)
    } else {
      threeService.hideBoardNumMarker()
    }
  }

  return {
    threeService,
    explosionModels,
    drawCurrentCabinet,
    drawAllCabinet,
    highlightModel,
    hideDoorModels,
    showCabNum,
    showBoardNum,
  }
}
