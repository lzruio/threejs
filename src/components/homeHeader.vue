<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-07 17:22:33
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-18 17:30:07
 * @FilePath: \kdPlankCheck\src\components\Header.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <navHeader>
    <template #left>
      <a-button @click="toWireFrame">线框模式</a-button>
      <a-button @click="toTransparentWireFrame">透明模式</a-button>
      <a-button @click="toMaterialAndWireFrame">材质模式</a-button>
    </template>
    <template #center>

    </template>
    <template #right>
    </template>
  </navHeader>
</template>
<script setup lang="ts">
import navHeader from '@/components/common/navHeader.vue'
import { threeService } from '@/hooks/useThreejs';
import { ViewMode } from '@/services/threePlugins';
const toWireFrame = () => {
  threeService.changeViewMode(ViewMode.WIREFRAME)
}

const toMaterialAndWireFrame = () => {
  threeService.changeViewMode(ViewMode.MATERIAL_AND_WIREFRAME)
}

const toTransparentWireFrame = () => {
  threeService.changeViewMode(ViewMode.TRANSPARENT_WIREFRAME)
}

</script>
