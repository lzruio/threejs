// 按钮配置
export interface BtnConfig {
  id: string
  label: string
  icon: string
  event: string
}

// 绘制模型配置
export interface ModelGenerationOptions {
  generateGroove?: boolean
  generateHole?: boolean
  generateClothesRail?: boolean
}
