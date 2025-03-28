import { KJLDataChange } from './KJLDataChange'
import { Module } from '@/types'
// 数据转换插件
export interface Transfer {
  // 插件名称
  name: string
  // 插件描述
  description: string
  // 主转换器
  kjlDataChange: KJLDataChange
  // 转换数据
  translateData(data: any): any
}
