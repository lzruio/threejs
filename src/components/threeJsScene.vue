<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:36:49
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-21 08:49:35
 * @FilePath: \kdPlankCheck\src\components\threeJsScene.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="three" :ref="(el) => (containerRef = el as Element)"></div>
</template>

<script setup lang="ts">
import { kjlDataChange } from '@/utils/dataUtil/KJLDataChange';

// 引入模型
import kdOriginData from "@/assets/test3.json"
import { useSceneStore } from '@/stores/scene'
import { useCompStatusStore } from '@/stores/compStatus';
import { Object3D } from 'three';
import { useThreeJS } from '@/hooks/useThreejs';
import { useBoardTable } from '@/hooks/useBoardTable';
import { useCabinetTable } from '@/hooks/useCabinetTable';
import { saveToJson } from '@/utils/export';
import log from '@/utils/log';
const containerRef = ref<Element | null>(null);
const sceneStore = useSceneStore()
const compStore = useCompStatusStore()
const { threeService, drawAllCabinet, drawCurrentCabinet, highlightModel } = useThreeJS();
const { scrollAndHighlightRow: scrollBoard } = useBoardTable()
const { scrollAndHighlightRow: scrollCabinet } = useCabinetTable()

onMounted(() => {
  if (containerRef.value) {

    threeService.start(containerRef.value, true);
    // 转换数据
    kjlDataChange.translateData(kdOriginData).then(res => {
      // 保存数据
      sceneStore.setModules(res)
      // 绘制模型
      drawAllCabinet()
    })

    // 监听事件
    threeService.on('doubleClickMesh', (mesh: Object3D) => {
      if (mesh.userData.module) {
        if (!compStore.activeIds.has('boardTable')) {
          compStore.togglePanel('boardTable')
        }
        sceneStore.setCurrentModelID(mesh.userData.module.ObjID)
        sceneStore.setCurrentPlankByID(mesh.userData.module.ObjID)
        highlightModel()
        scrollBoard(mesh.userData.module.ObjID)
      }
    })
    threeService.on('singleClickMesh', (mesh: Object3D) => {
      log.debug('单击事件', mesh)
      // 高亮柜子
      if (mesh.userData.module) {
        if (!compStore.activeIds.has('cabinetTable') && !compStore.activeIds.has('boardTable')) {
          compStore.togglePanel('cabinetTable')
        }
        sceneStore.setCurrentModelID(mesh.userData.module.ObjID)
        sceneStore.setCurrentCabinetByID(mesh.userData.module.ObjID)
        highlightModel()
        scrollCabinet(mesh.userData.module.ObjID)
      }
    })
  }
});

</script>
<style scoped>
.three {
  width: 100%;
  height: calc(100% - 64px);
  z-index: 1;
  bottom: 0;
  position: relative;
}
</style>
