/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-20 16:05:47
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-20 16:06:04
 * @FilePath: \kdPlankCheck\src\hooks\common\table.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 滚动到指定key的行
export const scrollToRow = (targetId: string, tableRef: Ref<ComponentPublicInstance | null>) => {
  if (!tableRef.value) return
  const table = tableRef.value.$el
  if (!table) return
  const scrollBody = table.querySelector('.ant-table-body')
  const rowSelector = `tr[data-row-key="${targetId}"]` // 关键：利用行 key 选择器
  if (!scrollBody) return
  const targetRow = scrollBody.querySelector(rowSelector)

  nextTick(() => {
    if (targetRow && scrollBody) {
      // 👇 计算位置并滚动
      const offsetTop = targetRow.offsetTop - scrollBody.offsetTop
      scrollBody.scrollTo({
        top: offsetTop,
        behavior: 'smooth', // 启用平滑滚动
      })
    } else {
      console.warn('未找到目标行或滚动容器')
    }
  })
}
