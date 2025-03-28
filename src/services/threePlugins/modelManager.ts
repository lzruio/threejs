import type { IPluginTemplate } from './IPlugin'
import { ThreeService } from '@/services/ThreeService'
import * as THREE from 'three'
import { ModuleType, MeshType, Module } from '@/types'
import { addShapeRelative, genByImportModule } from '@/utils/three/modelGenerator'
import { traverseTreeBySubModules } from '@/utils/treeUtil'
import { Group, Box3, Vector3, Object3D } from 'three'
import { CSS2DObject } from 'three/addons'
import { type ModelGenerationOptions } from '@/types'
import log from '@/utils/log'

export enum LoadMode {
  SYNC = 'sync', // 同步加载
  ASYNC = 'async', // 异步加载
}

// 模型管理器
export class ModelManager implements IPluginTemplate {
  static pluginName = 'ModelManager'
  static events: string[] = []
  static apis: string[] = []

  app: ThreeService

  constructor(app: ThreeService) {
    this.app = app
  }

  //kjl数据绘制模型
  public async drawKJLModel(
    models: Module[],
    center: boolean = true,
    loadMode: LoadMode = LoadMode.ASYNC,
    option: ModelGenerationOptions,
  ) {
    const scene = this.app.scene
    if (!scene) {
      log.error('场景为空')
      return
    }

    //绘制模型
    const shapes = models
      .map((model) => {
        return addShapeRelative(model, option)
      })
      .filter((shape) => shape !== null && shape !== undefined)

    // 是否将模型组移动到世界中心
    const movedShapes = center ? this.moveObjectsToWorldCenter(shapes) : shapes

    if (movedShapes.length > 0) {
      scene.add(...movedShapes)
    }

    // 根据模式选择加载方式
    if (loadMode === LoadMode.SYNC) {
      await this.loadImportModelSync(models)
    } else {
      this.loadImportModelAsync(models)
    }
  }

  // 同步加载导入的模型（等待所有模型加载完成）
  private async loadImportModelSync(models: Module[]) {
    const scene = this.app.scene
    if (!scene) {
      log.error('场景为空')
      return
    }

    const promises: Promise<void>[] = []

    traverseTreeBySubModules(models, (model) => {
      if (model.Info.Info.BDImportModelType !== '') {
        const promise = (async () => {
          try {
            const mesh = await genByImportModule(model)
            if (!mesh) {
              return
            }
            const parent = scene.getObjectByName(model.ObjID)
            if (parent) {
              parent.add(mesh)
            } else {
              // 直接添加到场景中
              scene.add(mesh)
            }
          } catch (error) {
            log.error(`加载模型${model.Info.Info.BDImportModelType}失败:`, error)
          }
        })()
        promises.push(promise)
      }
    })

    // 等待所有模型加载完成
    await Promise.all(promises)
  }

  // 异步加载导入的模型（不等待加载完成）
  private loadImportModelAsync(models: Module[]) {
    const scene = this.app.scene
    if (!scene) {
      log.error('场景为空')
      return
    }

    traverseTreeBySubModules(models, (model) => {
      if (model.Info.Info.BDImportModelType !== '') {
        genByImportModule(model)
          .then((mesh) => {
            if (!mesh) return
            const parent = scene.getObjectByName(model.ParentId)
            if (parent) {
              parent.add(mesh)
            } else {
              scene.add(mesh)
            }
          })
          .catch((error) => {
            log.error(`加载模型${model.Info.Info.BDImportModelType}失败:`, error)
          })
      }
    })
  }
  // 隐藏模型
  public hideModels(objects: Object3D[]) {
    objects.forEach((object) => {
      if (object) {
        object.visible = false
      }
    })
  }

  // 显示模型
  public showModels(objects: Object3D[]) {
    objects.forEach((object) => {
      if (object) {
        object.visible = true
      }
    })
  }

  // 删除所有模型
  public async deleteAllModel() {
    const scene = this.app.scene
    if (!scene) {
      log.error('场景为空')
      return
    }
    const objectsToRemove = scene.children.filter((child) => child.userData?.module)
    await scene.remove(...objectsToRemove)
    // 手动释放内存
    objectsToRemove.forEach((obj) => {
      obj.traverse((child) => {
        if (child instanceof CSS2DObject) {
          child.element.remove() // 移除 DOM 元素
        }
      })
      obj.clear() // 清除所有子对象
    })
  }

  // 将一组对象移动到世界中心
  public moveObjectsToWorldCenter(objects: Object3D[]): Object3D[] {
    // 创建临时组
    const tempGroup = new Group()
    objects.forEach((obj) => tempGroup.add(obj))

    // 计算整个模型组的包围盒
    const boundingBox = new Box3().setFromObject(tempGroup)
    const center = boundingBox.getCenter(new Vector3())

    // 将模型组移动到世界中心
    tempGroup.position.sub(new Vector3(center.x, center.y, 0))

    // 更新世界矩阵以确保子对象位置正确
    tempGroup.updateWorldMatrix(true, true)

    // 将所有子对象的世界位置保存下来
    const resultObjects: Object3D[] = []
    while (tempGroup.children.length) {
      const child = tempGroup.children[0]
      child.position.setFromMatrixPosition(child.matrixWorld)
      tempGroup.remove(child)
      resultObjects.push(child)
    }

    return resultObjects
  }
}
