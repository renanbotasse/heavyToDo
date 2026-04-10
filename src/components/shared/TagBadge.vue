<template>
  <span
    class="inline-flex items-center text-[9px] font-tech font-bold uppercase tracking-[0.2em] px-2 py-0.5 border-2 border-ink bg-white relative overflow-hidden"
  >
    <span class="absolute left-0 top-0 bottom-0 w-1" :style="{ background: color }"></span>
    <span class="pl-1">{{ name }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{ name: string; color: string }>()
</script>
