/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-12 09:59:40
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-18 17:18:16
 * @FilePath: \kdPlankCheck\src\stores\threeEffect.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import log from '@/utils/log'
import { threeService } from '@/hooks/useThreejs'
// 将threeService与状态结合
export const useThreeEffectStore = defineStore('threeEffect', () => {
  // 爆炸系数
  const explodeFactor = ref(1)

  // 执行爆炸
  watch(explodeFactor, (newVal) => {
    threeService.explodeModel(newVal)
  })

  // 设置爆炸系数，并执行爆炸
  const setExplodeFactor = (value: number) => {
    explodeFactor.value = value
  }

  return {
    explodeFactor,
    setExplodeFactor,
  }
})
