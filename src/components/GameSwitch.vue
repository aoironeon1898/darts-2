<script setup lang="ts">
import { motion } from 'motion-v'
import type { LeaderboardView } from '@/types'

// `LeaderboardView` covers both uses: picking a layout and picking a single game.
defineProps<{
  modelValue: LeaderboardView
  options: { value: LeaderboardView; label: string }[]
  /** Shared-layout id for the sliding highlight; must differ between switches on one screen. */
  layoutId: string
  /** Accessible name for the group of buttons. */
  groupLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LeaderboardView]
}>()
</script>

<template>
  <div
    class="flex gap-1 rounded-xl bg-wood-900/70 p-1 border border-wood-700 backdrop-blur-xl"
    role="group"
    :aria-label="groupLabel"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="relative flex-1 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-150 select-none"
      :class="
        modelValue === option.value
          ? 'text-stone-950'
          : 'text-stone-300 hover:text-white hover:bg-white/[0.04]'
      "
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      <motion.div
        v-if="modelValue === option.value"
        :layout-id="layoutId"
        :transition="{ type: 'spring', stiffness: 420, damping: 32 }"
        class="absolute inset-0 rounded-lg bg-amber-400 shadow-sm ring-1 ring-amber-300/40"
      />
      <span class="relative z-10">{{ option.label }}</span>
    </button>
  </div>
</template>
