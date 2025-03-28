import { Font, FontLoader } from 'three/addons'
export class ResourceManager {
  private static instance: ResourceManager
  private fonts: Map<string, Font> = new Map()
  private fontLoadingPromises: Map<string, Promise<Font>> = new Map()
  // 单例模式
  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager()
    }
    return ResourceManager.instance
  }
  private constructor() {}
  // 加载字体
  async loadFont(fontPath: string): Promise<Font> {
    // 如果字体已加载，直接返回
    const loadedFont = this.fonts.get(fontPath)
    if (loadedFont) {
      return loadedFont
    }
    // 如果正在加载中，返回现有的 Promise
    const loadingPromise = this.fontLoadingPromises.get(fontPath)
    if (loadingPromise) {
      return loadingPromise
    }
    // 创建新的加载 Promise
    const newPromise = new Promise<Font>((resolve, reject) => {
      const loader = new FontLoader()
      loader.load(
        fontPath,
        (font) => {
          this.fonts.set(fontPath, font)
          this.fontLoadingPromises.delete(fontPath)
          resolve(font)
        },
        undefined,
        (error) => {
          this.fontLoadingPromises.delete(fontPath)
          reject(error)
        },
      )
    })
    this.fontLoadingPromises.set(fontPath, newPromise)
    return newPromise
  }
  // 获取已加载的字体
  getFont(fontPath: string): Font | undefined {
    return this.fonts.get(fontPath)
  }
  // 检查字体是否已加载
  isFontLoaded(fontPath: string): boolean {
    return this.fonts.has(fontPath)
  }
  // 清理资源
  clearResources() {
    this.fonts.clear()
    this.fontLoadingPromises.clear()
  }
}
