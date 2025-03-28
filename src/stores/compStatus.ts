/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-11 17:12:29
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-12 09:08:09
 * @FilePath: \kdPlankCheck\src\stores\compStatus.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
export const useCompStatusStore = defineStore('compStatus', () => {
  // 当前激活的按钮
  const activeIds = ref<Set<string>>(new Set())

  // 面板状态
  const panelsStatus = reactive<{ [key: string]: boolean }>({
    boardTable: false,
    cabinetTable: false,
  })

  const explosionSlider = computed(() => activeIds.value.has('explosion'))

  // 切换面板
  const togglePanel = (panelId: string) => {
    Object.keys(panelsStatus).forEach((key) => {
      if (key !== panelId) {
        panelsStatus[key] = false
        activeIds.value.delete(key)
      }
    })
    panelsStatus[panelId] = !panelsStatus[panelId]
    if (panelsStatus[panelId]) {
      activeIds.value.add(panelId)
    } else {
      activeIds.value.delete(panelId)
    }
  }

  // 更新激活的按钮
  const updateActiveIds = (btnId: string) => {
    if (activeIds.value.has(btnId)) {
      activeIds.value.delete(btnId)
    } else {
      activeIds.value.add(btnId)
    }
  }

  return {
    activeIds,
    panelsStatus,
    explosionSlider,
    updateActiveIds,
    togglePanel,
  }
})
