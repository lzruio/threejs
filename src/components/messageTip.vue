<template>
  <div class="
        w-80 h-20 border border-white/10 rounded-xl
        shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]
         transition-all duration-500
        hover:scale-103">
    <div class="flex items-baseline gap-2 group">
      <span class="tip-text">
        柜子:
      </span>
      <span class="tip-text">
        {{ cabinetTip }}
      </span>
    </div>

    <div class="flex items-baseline gap-2 group">
      <span class="tip-text">
        板件:
      </span>
      <span class="tip-text">
        {{ plankTip }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSceneStore } from '@/stores/scene'
const sceneStore = useSceneStore()


const { currentCabinet, currentPlank } = storeToRefs(sceneStore)

const cabinetTip = computed(() => {
  if (!currentCabinet.value) return ''
  const c = currentCabinet.value;
  const tip = c.ObjName + ' ' + c.Dim.x + '*' + c.Dim.y + '*' + c.Dim.z
  return tip
})

const plankTip = computed(() => {
  if (!currentPlank.value) return ''
  const p = currentPlank.value;
  const tip = p.ObjName + ' ' + p.Dim.x + '*' + p.Dim.y + '*' + p.Dim.z
  return tip
})

</script>
<style scoped>
@import "tailwindcss";

@layer components {
  .tip-text {
    @apply text-sm font-light tracking-wide
  }

}
</style>