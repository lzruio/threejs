import { Vector3 } from 'three'
export class MarkLine {
  // 基本属性
  public startPoint: Vector3
  public endPoint: Vector3
  public text: string
  // 标注线所在的平面
  public upVector: Vector3
  // 箭头属性
  public color?: string
  public headLength?: number
  public headWidth?: number
  // 文字属性
  public textSize?: number
  public textColor?: number
  public textDepth?: number
  public paddingBottom?: number
  // 连接线属性
  public closeLine?: {
    startLength?: number
    endLength?: number
    translateStart?: number
    translateEnd?: number
  }

  constructor(
    startPoint: Vector3,
    endPoint: Vector3,
    text: string,
    upVector: Vector3,
    options: Partial<MarkLineOptions> = {},
  ) {
    this.startPoint = startPoint
    this.endPoint = endPoint
    this.text = text
    this.upVector = upVector
    // 使用默认值和传入的选项合并
    const defaultOptions = MarkLine.getDefaultOptions()
    const finalOptions = { ...defaultOptions, ...options }
    this.color = finalOptions.color
    this.headLength = finalOptions.headLength
    this.headWidth = finalOptions.headWidth
    this.textSize = finalOptions.textSize
    this.textColor = finalOptions.textColor
    this.textDepth = finalOptions.textDepth
    this.paddingBottom = finalOptions.paddingBottom
    this.closeLine = finalOptions.closeLine
  }
  // 默认选项
  static getDefaultOptions(): MarkLineOptions {
    return {
      color: '#666666',
      headLength: 1,
      headWidth: 0.6,
      textSize: 1,
      textColor: 0x666666,
      textDepth: 0.5,
      paddingBottom: 0.5,
      closeLine: {
        startLength: 5,
        endLength: 5,
        translateStart: 0,
        translateEnd: 0,
      },
    }
  }
  // 克隆方法
  clone(): MarkLine {
    return new MarkLine(this.startPoint.clone(), this.endPoint.clone(), this.text, this.upVector, {
      color: this.color,
      headLength: this.headLength,
      headWidth: this.headWidth,
      textSize: this.textSize,
      textColor: this.textColor,
      textDepth: this.textDepth,
      paddingBottom: this.paddingBottom,
      closeLine: { ...this.closeLine },
    })
  }
  // 计算方向向量
  getDirection(): Vector3 {
    return this.endPoint.clone().sub(this.startPoint).normalize()
  }
  // 计算中点
  getCenterPoint(): Vector3 {
    return this.startPoint.clone().add(this.endPoint).multiplyScalar(0.5)
  }
  // 计算长度
  getLength(): number {
    return this.startPoint.distanceTo(this.endPoint)
  }
}
export interface MarkLineOptions {
  color?: string
  headLength?: number
  headWidth?: number
  textSize?: number
  textColor?: number
  textDepth?: number
  paddingBottom?: number
  closeLine?: {
    startLength?: number
    endLength?: number
    translateStart?: number
    translateEnd?: number
  }
}
