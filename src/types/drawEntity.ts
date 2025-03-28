/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-13 10:29:19
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-13 10:30:53
 * @FilePath: \kdPlankCheck\src\types\drawEntity.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Vector3 } from 'three'
export interface TextEntity {
  text: string
  position: Vector3
  rotation: Vector3
  color: string
  size: number
  depth: number
}
