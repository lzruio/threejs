import { ThreeService } from '@/services/ThreeService'

// 生命周期事件类型
export type IEditorHooksType = 'mounted' | 'modelLoadBefore' | 'modelLoadAfter'

// 插件
export declare class IPluginTemplate {
  // 插件名称
  static pluginName: string
  // 事件
  static events: string[]
  // api
  static apis: string[]

  // 初始化热键
  initHotkeys?: () => void
  // 初始化事件
  initEvent?: () => void
  // 初始化api
  initApi?: () => void
  // 初始化
  init?: () => void
  // 销毁
  destroy?: () => void

  //钩子
  hotkeyEvent?: (name: string, e: KeyboardEvent) => void
  hookImportBefore?: (...args: unknown[]) => Promise<unknown>
  hookImportAfter?: (...args: unknown[]) => Promise<unknown>

  // app的接口
  app?: ThreeService;

  // 插件选项
  [propName: string]: any
}

export declare interface IPluginClass {
  new (app: ThreeService, options?: Record<string, unknown>): IPluginTemplate
}
