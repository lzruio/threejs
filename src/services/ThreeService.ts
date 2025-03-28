import { EventEmitter } from 'events'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  PointLight,
  AxesHelper,
  GridHelper,
  WebGLRenderTarget,
  RGBAFormat,
  LinearFilter,
  HalfFloatType,
  Object3D,
  Vector2,
} from 'three'
import { OrbitControls } from 'three/addons'
import { Module } from '@/types'
import { type ModelGenerationOptions } from '@/types'
import log from '@/utils/log'
import * as THREE from 'three'
// 引入事件钩子
import { AsyncSeriesHook } from 'tapable'
import {
  EffectComposer,
  RenderPass,
  Font,
  CSS2DRenderer,
  OutlinePass,
  ShaderPass,
  GammaCorrectionShader,
  FXAAShader,
  SMAAPass,
} from 'three/addons'
import Stats from 'three/addons/libs/stats.module.js'
import type { IPluginTemplate, IEditorHooksType, IPluginClass } from '@/services/threePlugins'
import {
  ExplodeModelPlugin,
  ViewChangePlugin,
  ViewMode,
  CameraManager,
  HighLightMeshPlugin,
  ModelManager,
  BoardHolesMarkerPlugin,
  NumberMarkerPlugin,
} from '@/services/threePlugins'
import { LoadMode } from '@/services/threePlugins/modelManager'
import { CameraDirection } from '@/services/threePlugins/cameraManager'
import { debounce } from 'lodash'
import { ResourceManager } from '@/services/core'

import type { ModelNumberMap } from '@/services/threePlugins'
import { Vector4 } from '@/utils/math'
// @ts-expect-error 没有找到官方的类型声明包
import { Text } from 'troika-three-text'
import { emptyShader } from '@/utils/three/shaderPass'
// 插件，事件，钩子管理器
class PluginManager extends EventEmitter {
  // 插件
  public pluginMap: {
    [propName: string]: IPluginTemplate
  } = {}

  // 自定义
  public customEvents: string[] = []
  public customApis: string[] = []
  // 钩子
  public hooks: IEditorHooksType[] = ['mounted', 'modelLoadBefore', 'modelLoadAfter']
  public hooksEntity: {
    [propName: string]: AsyncSeriesHook<any, any>
  } = {}

  // 初始化钩子
  _initActionHooks() {
    this.hooks.forEach((hookName) => {
      this.hooksEntity[hookName] = new AsyncSeriesHook(['data'])
    })
  }

  // 绑定钩子
  _bindingHooks(plugin: IPluginTemplate) {
    this.hooks.forEach((hookName) => {
      const hookFunc = plugin[hookName]
      if (hookFunc) {
        this.hooksEntity[hookName].tapPromise(plugin.pluginName + hookName, (args) => {
          const result = hookFunc.apply(plugin, args)
          // hook 兼容非 Promise 返回值
          return (result as any) instanceof Promise ? result : Promise.resolve(result)
        })
      }
    })
  }

  //检查插件
  _checkPlugin(plugin: IPluginTemplate) {
    const { pluginName, events = [], apis = [] } = plugin
    //名称检查
    if (this.pluginMap[pluginName]) {
      throw new Error(pluginName + '插件重复初始化')
    }
    //事件检查
    events.forEach((eventName: string) => {
      if (this.customEvents.find((info) => info === eventName)) {
        throw new Error(pluginName + '插件中' + eventName + '重复')
      }
    })
    //api检查
    apis.forEach((apiName: string) => {
      if (this.customApis.find((info) => info === apiName)) {
        throw new Error(pluginName + '插件中' + apiName + '重复')
      }
    })
    return true
  }

  // 合并插件自定义事件与API
  _saveCustomAttr(plugin: IPluginTemplate) {
    const { events = [], apis = [] } = plugin
    this.customApis = this.customApis.concat(apis)
    this.customEvents = this.customEvents.concat(events)
  }

  // 获取插件
  public getPlugin(pluginName: string) {
    return this.pluginMap[pluginName]
  }
  // 添加监听器
  on(eventName: string, listener: any): this {
    return super.on(eventName, listener)
  }
  // 卸载监听器
  off(eventName: string, listener: any): this {
    return listener ? super.off(eventName, listener) : this
  }
  // 销毁
  public dispose() {
    // 销毁插件
    Object.values(this.pluginMap).forEach((plugin) => {
      if (plugin.dispose) {
        plugin.dispose()
      }
    })
    this.pluginMap = {}
    this.customEvents = []
    this.customApis = []
    this.hooksEntity = {}
  }
}

// 启动事件机制和事件钩子
class ThreeService extends PluginManager {
  public parentContainer: Element | null = null
  private resizeObserver: ResizeObserver | null = null

  public scene: Scene | null = null
  public camera: PerspectiveCamera | null = null
  public renderer: WebGLRenderer | null = null
  // public css2DRenderer: CSS2DRenderer | null = null
  public control: OrbitControls | null = null

  public composer: EffectComposer | null = null

  public stats: Stats | null = null

  // 资源管理器
  public resourceManager: ResourceManager

  // 原始画布大小
  public size: {
    width: number
    height: number
  } = {
    width: 0,
    height: 0,
  }

  constructor() {
    super()
    this.resourceManager = ResourceManager.getInstance()
    // 初始化钩子
    this._initActionHooks()
  }

  // 获取字体
  async getFont(): Promise<Font> {
    const fontPath = '/font/threejsFont.json'
    return await this.resourceManager.loadFont(fontPath)
  }

  // 进行初始化，传入挂载节点
  public init(mountNode: Element) {
    this.parentContainer = mountNode
    this.renderer = new WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
    // this.renderer = new WebGLRenderer()
    this.renderer.setSize(mountNode.clientWidth, mountNode.clientHeight)
    this.size.width = mountNode.clientWidth
    this.size.height = mountNode.clientHeight
    // log.debug(mountNode.clientWidth, mountNode.clientHeight)

    mountNode.appendChild(this.renderer.domElement)
    this.renderer.setClearColor(0xffffff)
    // this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // 初始化stats
    this.stats = new Stats()
    this.stats.dom.style.cssText = 'position: absolute; right: 0px; bottom: 0px;'
    mountNode.appendChild(this.stats.dom)

    // 创建2D渲染器
    // this.css2DRenderer = this.create2DRenderer(mountNode)
  }

  //2D渲染器
  public create2DRenderer(mountNode: Element) {
    const css2DRenderer = new CSS2DRenderer()
    css2DRenderer.setSize(this.size.width, this.size.height)
    css2DRenderer.domElement.style.position = 'absolute'
    css2DRenderer.domElement.style.top = '0'
    css2DRenderer.domElement.style.pointerEvents = 'none'
    mountNode.appendChild(css2DRenderer.domElement)
    return css2DRenderer
  }

  // 使用插件
  public use(plugin: IPluginTemplate, options?: Record<string, unknown>) {
    if (this._checkPlugin(plugin)) {
      // 保存插件自定义事件与API
      log.debug('加载插件', plugin.pluginName)
      this._saveCustomAttr(plugin)
      const pluginRunTime = new (plugin as IPluginClass)(this, options || {})
      pluginRunTime.pluginName = plugin.pluginName
      this.pluginMap[plugin.pluginName] = pluginRunTime
      // 绑定钩子
      this._bindingHooks(pluginRunTime)
    }
    return this
  }

  public start(mountNode: Element, isEnhanceRender: boolean = true) {
    // 初始化
    this.init(mountNode)
    // 创建场景
    this.createScene()
    // 创建观察者
    this.createObserver()
    // 增强渲染
    if (isEnhanceRender) {
      this.enhanceRender()
    }
    // 循环渲染
    this.renderLoop()
    // 挂载完成钩子
    this.hooksEntity.mounted.callAsync(null, () => {
      log.debug('挂载完成')
    })
  }

  // 增强渲染
  public enhanceRender() {
    log.debug('增强渲染')
    if (!this.renderer) return
    // 创建多重采样的RenderTarget
    const pixelRatio = window.devicePixelRatio
    const width = window.innerWidth * pixelRatio
    const height = window.innerHeight * pixelRatio

    const renderTarget = new WebGLRenderTarget(width, height, {
      format: RGBAFormat,
      type: HalfFloatType, // 使用半浮点精度
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      samples: 4,
    })
    this.composer = new EffectComposer(this.renderer, renderTarget)

    const renderPass = new RenderPass(this.scene!, this.camera!)
    this.composer.addPass(renderPass)

    // const emptyShaderPass = new ShaderPass(emptyShader)
    // this.composer.addPass(emptyShaderPass)

    // const smaaPass = new SMAAPass(
    //   window.innerWidth * window.devicePixelRatio,
    //   window.innerHeight * window.devicePixelRatio,
    // )
    // this.composer.addPass(smaaPass)

    // // 添加FXAA抗锯齿
    // const fxaaPass = new ShaderPass(FXAAShader)
    // fxaaPass.uniforms['resolution'].value.set(
    //   1 / (window.innerWidth * window.devicePixelRatio),
    //   1 / (window.innerHeight * window.devicePixelRatio),
    // )
    // this.composer.addPass(fxaaPass)

    // 放在renderPass之后
    // const gammaCorrectionShader = new ShaderPass(GammaCorrectionShader)
    // this.composer.addPass(gammaCorrectionShader)

    // const outlinePass = new OutlinePass(new Vector2(width, height), this.scene!, this.camera!)
    // this.composer.addPass(outlinePass)

    // , {
    //   format: RGBAFormat,
    //   type: HalfFloatType, // 使用半浮点精度
    //   minFilter: LinearFilter,
    //   magFilter: LinearFilter,
    //   samples: 4, // 增加采样数
    // }
  }

  // , {
  //   format: RGBAFormat,
  //   type: HalfFloatType, // 使用半浮点精度
  //   minFilter: LinearFilter,
  //   magFilter: LinearFilter,
  //   samples: 4, // 增加采样数
  // }
  public createObserver() {
    this.resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        const { width = 0, height = 0 } = (entries[0] && entries[0].contentRect) || {}
        if (width === 0 || height === 0) return
        this.renderer!.setSize(width, height)
        this.size.width = width
        this.size.height = height
        if (this.camera) {
          this.camera!.aspect = width / height
          this.camera!.updateProjectionMatrix()
          this.control!.update()
        }
      }, 50),
    )
    if (this.parentContainer) {
      this.resizeObserver.observe(this.parentContainer)
    }
  }

  public explodeModel(scale: number) {
    const explodeModelPlugin = this.getPlugin('ExplodeModelPlugin') as ExplodeModelPlugin
    if (explodeModelPlugin) {
      explodeModelPlugin.explodeModel(scale)
    }
  }

  // 停止
  public stop() {
    super.dispose()
    this.renderer?.dispose()
    this.renderer?.domElement.remove()
    this.parentContainer = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  // 渲染
  public renderLoop() {
    const renderFunc = this.composer
      ? () => {
          this.composer!.render()
          if (this.css2DRenderer) {
            this.css2DRenderer.render(this.scene!, this.camera!)
          }
        }
      : () => {
          this.renderer!.render(this.scene!, this.camera!)
          if (this.css2DRenderer) {
            this.css2DRenderer.render(this.scene!, this.camera!)
          }
        }
    // 限制帧率
    let lastTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS
    const render = (currentTime: number) => {
      requestAnimationFrame(render)
      // 帧率控制
      const deltaTime = currentTime - lastTime
      if (deltaTime < frameInterval) return

      lastTime = currentTime - (deltaTime % frameInterval)

      this.stats?.update()
      renderFunc()
    }
    // 开始渲染
    requestAnimationFrame(render)
  }

  public setSize(width: number, height: number) {
    this.size.width = width
    this.size.height = height
    this.renderer!.setSize(width, height)
  }

  // 创建场景
  public createScene() {
    this.scene = new Scene()
    this.createCamera()
    this.addLight()
    this.addControls()
    this.addAxesHelper()
    // this.addGridHelper()
  }

  //相机
  public createCamera() {
    const camera = new PerspectiveCamera(
      undefined,
      window.innerWidth / window.innerHeight,
      10,
      140000,
    )
    camera.position.set(1400, -600, 500)
    camera.up.set(0, 0, 1)
    this.camera = camera
  }

  //灯光
  addLight() {
    const ambientLight = new AmbientLight()
    ambientLight.position.set(200, 200, 1400)
    this.scene?.add(ambientLight)

    const pointLight = new PointLight()
    pointLight.position.set(600, 200, 1400)
    this.scene?.add(pointLight)
  }
  /** 添加坐标轴 */
  addAxesHelper() {
    const axesHelper = new AxesHelper(1000)
    this.scene?.add(axesHelper)
  }
  /** 添加网格 */
  addGridHelper() {
    const gridHelper = new GridHelper(5000, 40)
    gridHelper.rotateX(Math.PI / 2)
    this.scene?.add(gridHelper)
  }
  /** 添加场景控制器 */
  addControls() {
    const orbit = new OrbitControls(this.camera!, this.renderer!.domElement)
    orbit.enableZoom = true
    this.control = orbit
  }

  // 绘制模型(包装成异步函数)
  public async drawModel(
    models: Module[],
    center: boolean = true,
    loadMode: LoadMode = LoadMode.ASYNC,
    option: ModelGenerationOptions = { generateGroove: true, generateHole: true },
  ): Promise<void> {
    const modelManager = this.getPlugin('ModelManager') as ModelManager
    return new Promise<void>((resolve) => {
      // 绘制前
      this.hooksEntity.modelLoadBefore.callAsync(models, async () => {
        log.info('绘制模型前')
        // 切换到透明线框模式
        // this.changeViewMode(ViewMode.TRANSPARENT_WIREFRAME)
        await modelManager.drawKJLModel(models, center, loadMode, option)
        this.hooksEntity.modelLoadAfter.callAsync(models, () => {
          log.info('绘制模型后')
          resolve()
        })
      })
    })
  }

  // 统一接口
  public adjustCameraMode(direction: CameraDirection, isAnimate: boolean = true) {
    const cameraManager = this.getPlugin('CameraManager') as CameraManager
    if (cameraManager) {
      switch (direction) {
        case CameraDirection.FRONT:
          this.adjustCameraToFrontView(isAnimate)
          break
        case CameraDirection.TOP:
          this.adjustCameraToTopView(isAnimate)
          break
        case CameraDirection.SIDE:
          this.adjustCameraToSideView(isAnimate)
          break
        case CameraDirection.AUTO:
          this.adjustCamera(isAnimate)
          break
      }
    }
  }

  // 相机缩放接口
  public setCameraZoom(value: number) {
    const cameraManager = this.getPlugin('CameraManager') as CameraManager
    if (cameraManager) {
      cameraManager.setZoomBySlider(value)
    }
  }

  // 设置自动调整时相机相对于场景的相对位置向量
  public setAutoAdjustCameraPos(pos: Vector4) {
    const cameraManager = this.getPlugin('CameraManager') as CameraManager
    if (cameraManager) {
      cameraManager.setAutoAdjustCameraPos(pos)
    }
  }
  // 调整相机(从上往下，自动)
  public adjustCamera(isAnimate: boolean = true) {
    const cameraManager = this.getPlugin('CameraManager') as CameraManager
    if (cameraManager) {
      cameraManager.adjustCamera(isAnimate)
    }
  }
  // 正视图
  public adjustCameraToFrontView(isAnimate: boolean = true) {
    const cameraManager = this.getPlugin('CameraManager') as CameraManager
    if (cameraManager) {
      cameraManager.adjustCameraToFrontView(isAnimate)
    }
  }
  // 俯视图
  public adjustCameraToTopView(isAnimate: boolean = true) {
    const cameraManager = this.getPlugin('CameraManager') as CameraManager
    if (cameraManager) {
      cameraManager.adjustCameraToTopView(isAnimate)
    }
  }
  // 侧视图
  public adjustCameraToSideView(isAnimate: boolean = true) {
    const cameraManager = this.getPlugin('CameraManager') as CameraManager
    if (cameraManager) {
      cameraManager.adjustCameraToSideView(isAnimate)
    }
  }

  // 聚焦到板件
  public adjustCameraToBoard(boardId: string, isAnimate: boolean = true) {
    const cameraManager = this.getPlugin('CameraManager') as CameraManager
    if (cameraManager) {
      const result = cameraManager.adjustCameraToBoard(boardId, isAnimate)
      // 如果聚焦失败，则自动调整相机
      if (!result) {
        this.adjustCamera()
      }
    }
  }

  // 高亮模型
  public highlightModels(modelIds: string[]) {
    if (modelIds.length === 0) return
    const obj3ds: Object3D[] = []
    modelIds.forEach((modelId) => {
      const mesh = this.scene?.getObjectByName(modelId)
      if (mesh) {
        obj3ds.push(mesh)
      }
    })
    const highLightMeshPlugin = this.getPlugin('HighLightMeshPlugin') as HighLightMeshPlugin
    if (highLightMeshPlugin) {
      highLightMeshPlugin.highLightMeshes(obj3ds)
    }
  }

  // 取消高亮
  public cancelHighlightModels() {
    const highLightMeshPlugin = this.getPlugin('HighLightMeshPlugin') as HighLightMeshPlugin
    if (highLightMeshPlugin) {
      highLightMeshPlugin.cancelHighLightMeshes()
    }
  }

  // 隐藏模型
  public hideModels(modelIds: string[]) {
    if (modelIds.length === 0) return
    const obj3ds: Object3D[] = []
    modelIds.forEach((modelId) => {
      const mesh = this.scene?.getObjectByName(modelId)
      if (mesh) {
        obj3ds.push(mesh)
      }
    })

    const modelManager = this.getPlugin('ModelManager') as ModelManager
    if (modelManager) {
      modelManager.hideModels(obj3ds)
    }
  }

  // 显示模型
  public showModels(modelIds: string[]) {
    if (modelIds.length === 0) return
    const obj3ds: Object3D[] = []
    modelIds.forEach((modelId) => {
      const mesh = this.scene?.getObjectByName(modelId)
      if (mesh) {
        obj3ds.push(mesh)
      }
    })
    const modelManager = this.getPlugin('ModelManager') as ModelManager
    if (modelManager) {
      modelManager.showModels(obj3ds)
    }
  }

  // 删除所有模型
  public async deleteAllModel() {
    const modelManager = this.getPlugin('ModelManager') as ModelManager
    if (modelManager) {
      await modelManager.deleteAllModel()
    }
  }

  // 切换视图模式
  public changeViewMode(mode: ViewMode) {
    const viewChangePlugin = this.getPlugin('ViewChangePlugin') as ViewChangePlugin
    if (viewChangePlugin) {
      viewChangePlugin.changeViewMode(mode)
    }
  }

  // 切换到当前的视图模式
  public changeToCurrentViewMode() {
    const viewChangePlugin = this.getPlugin('ViewChangePlugin') as ViewChangePlugin
    if (viewChangePlugin) {
      viewChangePlugin.changeToCurrentViewMode()
    }
  }

  // 将模型切换到当前的视图模式
  public changeMeshToCurrentViewMode(mesh: THREE.Mesh) {
    const viewChangePlugin = this.getPlugin('ViewChangePlugin') as ViewChangePlugin
    if (viewChangePlugin) {
      viewChangePlugin.changeMeshToCurrentViewMode(mesh)
    }
  }

  // 标注板件编号
  public showCabinetNumMarker(modelIDMap: ModelNumberMap[]) {
    const numberMarkerPlugin = this.getPlugin('NumberMarkerPlugin') as NumberMarkerPlugin
    if (numberMarkerPlugin) {
      numberMarkerPlugin.showCabinetNumMarker(modelIDMap)
    }
  }

  // 隐藏柜子编号
  public hideCabinetNumMarker() {
    const numberMarkerPlugin = this.getPlugin('NumberMarkerPlugin') as NumberMarkerPlugin
    if (numberMarkerPlugin) {
      numberMarkerPlugin.hideCabinetNumMarker()
    }
  }

  // 标注板件编号
  public showBoardNumMarker(modelIDMap: ModelNumberMap[]) {
    const numberMarkerPlugin = this.getPlugin('NumberMarkerPlugin') as NumberMarkerPlugin
    if (numberMarkerPlugin) {
      numberMarkerPlugin.showBoardNumMarker(modelIDMap)
    }
  }

  // 隐藏板号
  public hideBoardNumMarker() {
    const numberMarkerPlugin = this.getPlugin('NumberMarkerPlugin') as NumberMarkerPlugin
    if (numberMarkerPlugin) {
      numberMarkerPlugin.hideBoardNumMarker()
    }
  }

  // 标注板件
  public markBoard(JCB: Module) {
    const boardHolesMarkerPlugin = this.getPlugin(
      'BoardHolesMarkerPlugin',
    ) as BoardHolesMarkerPlugin
    if (boardHolesMarkerPlugin) {
      boardHolesMarkerPlugin.markModule(JCB)
    }
  }

  public test() {
    const myText = new Text()
    this.scene?.add(myText)

    // 调整为更大的尺寸
    myText.text = 'Hello world!'
    myText.fontSize = 50 // 显著增大字体尺寸
    myText.color = '#ff0000'

    // 材质设置
    myText.material.depthWrite = false
    myText.material.depthTest = false
    myText.material.transparent = true

    myText.sync()
  }
}
export { ThreeService }
