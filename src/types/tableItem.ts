import { TextureType } from '@/types'

export interface BoardData {
  key: string
  index: number
  name: string
  length: number
  width: number
  thickness: number
  textureType: TextureType
}

export interface CabinetData {
  key: string
  index: number
  name: string
  width: number
  depth: number
  height: number
}
