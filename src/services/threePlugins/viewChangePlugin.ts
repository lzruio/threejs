import type { IPluginTemplate } from './IPlugin'
import { ThreeService } from '@/services/ThreeService'
import * as THREE from 'three'
import { ModuleType, MeshType } from '@/types'

import log from '@/utils/log'
import { LineSegments2, LineSegmentsGeometry, LineMaterial } from 'three/addons'
import {
  type MaterialConfig,
  TransparentView,
  WireframeView,
  MaterialAndWireframeView,
  type ViewConfig,
} from '@/services/core/constants'
import { Module } from '@/types'
import { getTextureImg, getTextureImgs } from '@/http/api'
// 视图模式
export enum ViewMode {
  // 线框模式
  WIREFRAME = 'wireframe',
  // 材质+线框模式
  MATERIAL_AND_WIREFRAME = 'materialAndWireframe',
  // 透明线框模式
  TRANSPARENT_WIREFRAME = 'transparentWireframe',
}

// 视图切换插件
export class ViewChangePlugin implements IPluginTemplate {
  static pluginName = 'ViewChangePlugin'
  static events: string[] = []
  static apis: string[] = []

  app: ThreeService

  // 当前的视图模式
  currentViewMode: ViewMode = ViewMode.TRANSPARENT_WIREFRAME

  // 全局纹理加载器
  textureLoader: THREE.TextureLoader

  // 贴图映射
  textureMap: Map<string, THREE.Texture> = new Map()

  constructor(app: ThreeService) {
    this.app = app
    this.textureLoader = new THREE.TextureLoader()
  }
  // 释放数据
  public modelLoadBefore() {
    log.debug('释放贴图数据')
    this.textureMap.clear()
  }

  // 钩子函数
  public modelLoadAfter() {
    try {
      return this.buildTextureMap()
    } catch (error) {
      log.error('贴图初始化失败', error)
      throw error
    }
  }

  // 建立贴图映射
  private async buildTextureMap() {
    //遍历模型获取所有的贴图名
    const textureNames: string[] = []
    this.traverseAllNodes((node, module) => {
      if (node.userData.meshType === MeshType.Board && node instanceof THREE.Mesh) {
        if (module?.texture && !textureNames.includes(module.texture)) {
          textureNames.push(module.texture)
        }
      }
    })
    log.info('textureNames', JSON.stringify(textureNames))
    // 进行网络请求，建立映射
    const imgs = await getTextureImgs(JSON.stringify(textureNames))
    const mimeType = 'image/png'
    for (let i = 0; i < textureNames.length; i++) {
      const textureName = textureNames[i]
      const png = imgs.data?.[i]?.data
      if (!png) {
        return
      }
      const pngUrl = `data:${mimeType};base64,${png}`
      const texture = this.textureLoader.load(pngUrl)
      texture.encoding = THREE.sRGBEncoding
      this.textureMap.set(textureName, texture)
    }
  }

  // 切换视图模式
  public changeViewMode(mode: ViewMode) {
    if (this.currentViewMode === mode) {
      return
    }
    this.currentViewMode = mode
    switch (mode) {
      case ViewMode.WIREFRAME:
        this.toWireframe()
        break
      case ViewMode.MATERIAL_AND_WIREFRAME:
        this.toMaterialAndWireframe()
        break

      case ViewMode.TRANSPARENT_WIREFRAME:
        this.toTransparentWireframe()
        break
    }
  }

  // 切换到透明线框模式
  public toTransparentWireframe() {
    this.updateViewMode(TransparentView)
  }

  // 切换到线框模式
  public toWireframe() {
    this.updateViewMode(WireframeView)
  }

  // 切换到材质+线框模式
  public toMaterialAndWireframe() {
    if (!this.app.scene) {
      return
    }
    // 更新材质+线框模式
    this.updateViewMode(MaterialAndWireframeView)

    // 进行纹理加载
    this.traverseAllNodes((node, module) => {
      if (node.userData.meshType === MeshType.Board && node instanceof THREE.Mesh) {
        if (module?.texture) {
          const textureName = module.texture
          const texture = this.textureMap.get(textureName)
          if (texture) {
            node.material.transparent = false
            node.material.map = texture
            node.material.needsUpdate = true
          }
        }
      }
    })
  }

  // 更新视图模式
  private updateViewMode(viewMode: ViewConfig) {
    this.traverseAllNodes((node, module) => {
      if (node instanceof THREE.Mesh) {
        if (node.userData.meshType === MeshType.Board) {
          this.updateMaterial(node, viewMode.board)
        }
        if (node.userData.meshType === MeshType.Groove) {
          this.updateMaterial(node, viewMode.groove)
        }
        if (node.userData.meshType === MeshType.Hole) {
          this.updateMaterial(node, viewMode.hole)
        }
      }
      if (node instanceof LineSegments2) {
        if (node.userData.meshType === MeshType.BoardEdge) {
          this.updateLine(node, viewMode.boardEdge)
        }
        if (node.userData.meshType === MeshType.GrooveEdge) {
          this.updateLine(node, viewMode.grooveEdge)
        }
        if (node.userData.meshType === MeshType.HoleEdge) {
          this.updateLine(node, viewMode.holeEdge)
        }
      }
    })
  }

  // 更新材质
  private updateMaterial(node: THREE.Mesh, config: MaterialConfig) {
    const material = node.material as THREE.MeshBasicMaterial
    if (
      !material ||
      config.color === undefined ||
      config.color === null ||
      config.opacity === undefined ||
      config.opacity === null
    ) {
      return
    }

    material.map = null
    material.transparent = true
    material.opacity = config.opacity
    material.color.set(config.color)
    material.needsUpdate = true
  }

  // 更新线框
  private updateLine(node: LineSegments2, config: MaterialConfig) {
    const lineMaterial = node.material as LineMaterial
    if (
      !lineMaterial ||
      config.color === undefined ||
      config.color === null ||
      config.lineWidth === undefined ||
      config.lineWidth === null
    ) {
      return
    }
    lineMaterial.color.set(config.color)
    lineMaterial.linewidth = config.lineWidth
    lineMaterial.needsUpdate = true
  }

  // 切换到当前的视图模式
  public changeToCurrentViewMode() {
    switch (this.currentViewMode) {
      case ViewMode.WIREFRAME:
        this.toWireframe()
        break
      case ViewMode.MATERIAL_AND_WIREFRAME:
        this.toMaterialAndWireframe()
        break
      case ViewMode.TRANSPARENT_WIREFRAME:
        this.toTransparentWireframe()
        break
    }
  }

  // 将模型切换到当前的视图模式
  public changeMeshToCurrentViewMode(mesh: THREE.Mesh) {
    if (mesh.userData.meshType === MeshType.Board) {
      if (this.currentViewMode === ViewMode.WIREFRAME) {
        this.updateMaterial(mesh, WireframeView.board)
      } else if (this.currentViewMode === ViewMode.MATERIAL_AND_WIREFRAME) {
        this.updateMaterial(mesh, MaterialAndWireframeView.board)
      } else if (this.currentViewMode === ViewMode.TRANSPARENT_WIREFRAME) {
        this.updateMaterial(mesh, TransparentView.board)
      }
    }
  }
  // 遍历槽、孔、板
  private traverseAllNodes(callback: (node: THREE.Object3D, module?: Module) => void) {
    if (!this.app.scene) return

    this.app.scene.traverse((child) => {
      const module = child.userData.module
      if (
        module?.modelType === ModuleType.JCBoard ||
        module?.modelType === ModuleType.Groove ||
        module?.modelType === ModuleType.Hole
      ) {
        child.children.forEach((node) => callback(node, module))
      }
    })
  }
}
