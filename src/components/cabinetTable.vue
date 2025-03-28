<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 10:18:03
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-20 16:21:30
 * @FilePath: \kdPlankCheck\src\components\boardTable.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!-- 板件列表 -->
<template>
  <div>
    <a-card size="small">
      <template #title>
        <div class="flex justify-between items-center">
          <span>柜体列表</span>
          <a-button shape="circle" @click="handleBtnClick" size="small" type="text" class="hover:scale-110">
            <template #icon>
              <CloseOutlined />
            </template>
          </a-button>
        </div>
      </template>

      <a-table ref="cabinetTable" :columns="columns" :data-source="cabinets" size="small" :scroll="{ y: 200 }"
        :pagination="false" :customRow="RowClick" :rowClassName="customRowClassName">

      </a-table>

    </a-card>
  </div>
</template>

<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue';
import { useSceneStore } from '@/stores/scene'
import { useCabinetTable } from "@/hooks/useCabinetTable"
import log from '@/utils/log';


const sceneStore = useSceneStore()
const { customRowClassName, handleRowClick, handleRowDblClick, columns, cabinetTable } = useCabinetTable()

const { cabinets } = storeToRefs(sceneStore)
// 行点击事件
const RowClick = (record: any) => {
  return {
    onClick: (event: any) => {
      handleRowClick(record)
    },
    onDblclick: (event: any) => {
      handleRowDblClick(record)
    }
  }
}


const emit = defineEmits(['closeTablePanel']);
const handleBtnClick = () => {
  emit('closeTablePanel');
};



</script>
<style scoped>
:deep(.ant-table-tbody>tr:hover>td) {
  color: #1568e2;
  background-color: #e0f2fe !important;
}

:deep(.ant-table-tbody>tr:hover) {
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

:deep(.selected-row>td) {
  color: #1568e2;
  background-color: #e0f2fe !important;
}
</style>