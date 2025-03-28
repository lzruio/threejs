<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-08 18:01:38
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-11 15:48:02
 * @FilePath: \kdPlankCheck\src\components\floatBtnGroup.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="mt-2 flex flex-col gap-2">
    <a-button v-for="btn in buttons" :key="btn.id" shape="round"
      class="hover:scale-105 transition-transform duration-300" @click="handleClick(btn)"
      :type="activeIds.has(btn.id) ? 'primary' : 'default'">
      {{ btn.label }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
import type { BtnConfig } from '@/types/Config';

// 由父组件传入的按钮配置
const props = defineProps<{
  buttons: Array<BtnConfig>;
  activeIds: Set<string>;
}>();

// 暴露本次点击的按钮
const emit = defineEmits(['btn-click']);
const handleClick = (btn: BtnConfig) => {
  emit('btn-click', btn);
};

</script>
