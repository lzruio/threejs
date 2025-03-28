/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-20 14:58:40
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-20 17:54:49
 * @FilePath: \kdPlankCheck\src\hooks\useTable.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { useSceneStore } from '@/stores/scene'
import { useThreeJS } from '@/hooks/useThreejs'
import { scrollToRow } from './common'

import log from '@/utils/log'

// 数据
const cabinetTable = ref<ComponentPublicInstance | null>(null)
const columns = ref([
  {
    title: '柜号',
    dataIndex: 'index',
    key: 'index',
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '宽度',
    dataIndex: 'width',
    key: 'width',
  },
  {
    title: '深度',
    dataIndex: 'depth',
    key: 'depth',
  },
  {
    title: '高度',
    dataIndex: 'height',
    key: 'height',
  },
])

export const useCabinetTable = () => {
  // 获取服务
  const sceneStore = useSceneStore()
  const { drawCurrentCabinet, highlightModel } = useThreeJS()

  // 选中行高亮
  const customRowClassName = (record: any) => {
    return sceneStore.getCurrentModelID() === record.key ? 'selected-row' : null
  }

  const scrollAndHighlightRow = (id: string) => {
    sceneStore.getCurrentModelID()
    scrollToRow(id, cabinetTable)
  }

  // 单击事件
  const handleRowClick = (record: any) => {
    sceneStore.setCurrentModelID(record.key)
    highlightModel()
  }
  // 双击事件
  const handleRowDblClick = async (record: any) => {
    sceneStore.setCurrentCabinetByID(record.key)
    // 绘制当前柜体
    await drawCurrentCabinet()
  }

  return {
    cabinetTable,
    columns,
    customRowClassName,
    scrollAndHighlightRow,
    handleRowClick,
    handleRowDblClick,
  }
}
