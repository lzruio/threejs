<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-08 09:04:50
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-21 11:50:53
 * @FilePath: \kdPlankCheck\src\components\homeMain.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

<template>
  <div class=" relative h-full min-h-[calc(100vh-theme(spacing.12))] bg-white">
    <div class="absolute left-4 top-4 z-2">
      <!-- 触发按钮 -->
      <a-button shape="round" class="hover:scale-105 transition-transform" @click="toggleMenu">
        {{ isBtnGroupOpen ? '收起' : '展开' }}
      </a-button>
      <!-- 按钮组容器 -->
      <transition enter-active-class="transition-all duration-300 ease-out origin-top"
        leave-active-class="transition-all duration-200 ease-in origin-top"
        enter-from-class="opacity-0 scale-y-50 -translate-y-4" enter-to-class="opacity-100 scale-y-100 translate-y-0"
        leave-from-class="opacity-100 scale-y-100 translate-y-0" leave-to-class="opacity-0 scale-y-50 -translate-y-4">
        <FloatBtnGroup v-show="isBtnGroupOpen" :buttons="btns" :activeIds="activeIds" @btn-click="handleBtnClick" />
      </transition>

      <!-- 控制爆炸的滑动条 -->
      <a-slider v-show="explosionSlider" :min="1" :step="0.01" :max="3" v-model:value="explodeFactor" />
    </div>

    <!-- 动画面板 -->
    <transition enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in" enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0" leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-full">
      <BoardTable v-show="panelsStatus.boardTable" class="fixed bottom-0 left-0 right-0 h-[300px] shadow-lg z-50"
        @closeTablePanel="togglePanel('boardTable')" />
    </transition>

    <!-- 动画面板 -->
    <transition enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in" enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0" leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-full">
      <CabinetTable v-show="panelsStatus.cabinetTable" class="fixed bottom-0 left-0 right-0 h-[300px] shadow-lg z-50"
        @closeTablePanel="togglePanel('cabinetTable')" />
    </transition>

    <!-- 提示面板 -->
    <MessageTip class="absolute right-4 top-4 z-2" />

    <!-- 3D场景 -->
    <ThreeScene class="h-full min-h-[calc(100vh-theme(spacing.12))]  bg-white" />

  </div>

</template>

<script setup lang="ts">
import FloatBtnGroup from '@/components/floatBtnGroup.vue'
import BoardTable from '@/components/boardTable.vue'
import CabinetTable from '@/components/cabinetTable.vue'
import ThreeScene from '@/components/threeJsScene.vue'
import MessageTip from '@/components/messageTip.vue'
import { useThreeJS } from '@/hooks/useThreejs';
import type { BtnConfig } from '@/types/Config';
import { useCompStatusStore } from '@/stores/compStatus';
import { useThreeEffectStore } from '@/stores/threeEffect';
import { useRouter } from 'vue-router';

import { ViewMode } from '@/services/threePlugins';


const router = useRouter();
const compStore = useCompStatusStore();
const threeStore = useThreeEffectStore();

const isBtnGroupOpen = ref(true);

const toggleMenu = () => {
  isBtnGroupOpen.value = !isBtnGroupOpen.value;
};

// 解包
const { panelsStatus, explosionSlider, activeIds } = storeToRefs(compStore);
const { explodeFactor } = storeToRefs(threeStore);

// 按钮配置
const btns = reactive<BtnConfig[]>([
  {
    id: "currentScene",
    label: "当前场景",
    icon: '',
    event: 'currentScene',
  },
  {
    id: 'cabinetTable',
    label: '柜体列表',
    icon: '',
    event: 'togglePanel',
  },
  {
    id: 'boardTable',
    label: '板件列表',
    icon: '',
    event: 'togglePanel',
  },
  {
    id: 'showCabinetNumber',
    label: '显示柜号',
    icon: '',
    event: 'showCabinetNumber',
  },
  {
    id: "showBoardNumber",
    label: "显示板号",
    icon: '',
    event: 'showBoardNumber',
  },
  {
    id: 'hideDoor',
    label: '门板隐藏',
    icon: '',
    event: 'hideDoor',
  },
  {
    id: 'explosion',
    label: '爆炸图',
    icon: '',
    event: 'explosion',
  },
  {
    id: 'punching',
    label: '排孔图',
    icon: '',
    event: 'punching',
  },
]);

const { explosionModels, drawAllCabinet, hideDoorModels, showCabNum, showBoardNum } = useThreeJS();

const currentScene = async () => {
  await drawAllCabinet();

}

const togglePanel = (panelId: string) => {
  compStore.togglePanel(panelId);
}

// 进行爆炸
const explosion = () => {
  explosionModels();
}
// 隐藏门板
const hideDoor = () => {
  hideDoorModels();
}

const showCabinetNumber = () => {
  showCabNum();
}

const showBoardNumber = () => {
  showBoardNum();
}

const gotoPunching = () => {
  router.push('/plankDetail');
}



// 显示编号
const btnEventHandlers: Record<string, (btnId: string) => void> = {
  togglePanel: togglePanel,
  explosion: explosion,
  currentScene: currentScene,
  hideDoor: hideDoor,
  showCabinetNumber: showCabinetNumber,
  showBoardNumber: showBoardNumber,
  punching: gotoPunching,
};

const handleBtnClick = (btn: BtnConfig) => {
  const { id, event } = btn;
  const handler = btnEventHandlers[btn.event];
  handler?.(id);

};



</script>
