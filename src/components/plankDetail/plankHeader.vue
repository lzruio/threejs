<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-13 15:29:33
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-13 16:25:21
 * @FilePath: \kdPlankCheck\src\components\plankDetail\plankHeader.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <navHeader>
    <template #left>
      <!-- 标题 -->
      <div class="text-lg font-medium tracking-wide">
        排孔图
      </div>
    </template>

    <template #center>
      <a-button @click="toWireFrame">线框模式</a-button>
      <a-button @click="toTransparentWireFrame">透明模式</a-button>
      <a-button @click="toMaterialAndWireFrame">材质模式</a-button>
    </template>

    <template #right>
      <a-button type="text" @click="gotoHome" class="hover:scale-115 transition-transform duration-400">
        <template #icon>
          <HomeOutlined />
        </template>
      </a-button>
    </template>

  </navHeader>
</template>
<script setup lang="ts">
import navHeader from '@/components/common/navHeader.vue'
import { subThreeService } from '@/hooks/useSubThreejs';

import { ViewMode } from '@/services/threePlugins';
import { HomeOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const gotoHome = () => {
  router.push('/')
}

const toWireFrame = () => {
  subThreeService.changeViewMode(ViewMode.WIREFRAME)
}

const toMaterialAndWireFrame = () => {
  subThreeService.changeViewMode(ViewMode.MATERIAL_AND_WIREFRAME)
}

const toTransparentWireFrame = () => {
  subThreeService.changeViewMode(ViewMode.TRANSPARENT_WIREFRAME)
}
</script>
