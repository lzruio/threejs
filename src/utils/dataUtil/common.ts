/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-11 08:57:25
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-18 11:11:59
 * @FilePath: \kdPlankCheck\src\utils\dataUtil\common.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Vector4 } from '@/utils/math'

// 将字符串转换为Vector4
type towardString = 'X+' | 'X-' | 'Y+' | 'Y-' | 'Z+' | 'Z-'
export function strToVector4(str: towardString) {
  const vector4 = new Vector4(0, 0, 0, 1)
  if (str === 'X+') {
    vector4.x = 1
  } else if (str === 'X-') {
    vector4.x = -1
  } else if (str === 'Y+') {
    vector4.y = 1
  } else if (str === 'Y-') {
    vector4.y = -1
  } else if (str === 'Z+') {
    vector4.z = 1
  } else if (str === 'Z-') {
    vector4.z = -1
  }
  return vector4
}

// 字符串转向量
type growString = 'X' | 'Y' | 'Z'
export function strToGrowVector4(str: growString) {
  const vector4 = new Vector4(0, 0, 0, 1)
  if (str === 'X') {
    vector4.x = 1
  } else if (str === 'Y') {
    vector4.y = 1
  } else if (str === 'Z') {
    vector4.z = 1
  }
  return vector4
}
