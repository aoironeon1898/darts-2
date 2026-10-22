<script setup lang="ts">
import { motion } from 'motion-v'
import OperatorPanel from '@/components/OperatorPanel.vue'
import TimedOperatorPanel from '@/components/TimedOperatorPanel.vue'
import PlayersPanel from '@/components/PlayersPanel.vue'
import GameSwitch from '@/components/GameSwitch.vue'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import type { GameKind, LeaderboardView } from '@/types'

defineProps<{
  /** Game the operator tab records results for. */
  game: GameKind
  /** Whether to let the operator pick the game (used when both leaderboards are shown). */
  showGameSwitch?: boolean
}>()

const settingsStore = useSettingsStore()
const uiStore = useUiStore()

const gameOptions: { value: GameKind; label: string }[] = [
  { value: 'darts', label: '🎯 Darts' },
  { value: 'timed', label: '⏱ Time' },
]

function selectGame(game: LeaderboardView) {
  if (game !== 'both') settingsStore.setActiveGame(game)
}
</script>

<template>
  <div class="flex h-full flex-col bg-wood-950/80 backdrop-blur-2xl border-l border-white/10">
    <!-- Top Bar with Apple-style Segmented Control & Dismiss Button -->
    <div
      class="flex shrink-0 items-center gap-3 border-b border-white/[0.08] px-4 py-3 bg-wood-950/50 backdrop-blur-xl"
    >
      <!-- Segmented Control -->
      <div
        class="flex flex-1 gap-1 rounded-xl bg-white/[0.06] p-1 border border-white/[0.08] shadow-inner"
      >
        <button
          type="button"
          class="relative flex-1 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-150 select-none"
          :class="
            uiStore.panelTab === 'operator'
              ? 'text-stone-950'
              : 'text-stone-300 hover:text-white hover:bg-white/[0.04]'
          "
          @click="uiStore.setTab('operator')"
        >
          <motion.div
            v-if="uiStore.panelTab === 'operator'"
            layout-id="active-panel-tab"
            :transition="{ type: 'spring', stiffness: 420, damping: 32 }"
            class="absolute inset-0 rounded-lg bg-amber-400 shadow-sm ring-1 ring-amber-300/40"
          />
          <span class="relative z-10">{{ game === 'timed' ? '⏱' : '🎯' }} Operator</span>
        </button>
        <button
          type="button"
          class="relative flex-1 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-150 select-none"
          :class="
            uiStore.panelTab === 'players'
              ? 'text-stone-950'
              : 'text-stone-300 hover:text-white hover:bg-white/[0.04]'
          "
          @click="uiStore.setTab('players')"
        >
          <motion.div
            v-if="uiStore.panelTab === 'players'"
            layout-id="active-panel-tab"
            :transition="{ type: 'spring', stiffness: 420, damping: 32 }"
            class="absolute inset-0 rounded-lg bg-amber-400 shadow-sm ring-1 ring-amber-300/40"
          />
          <span class="relative z-10">👥 Players</span>
        </button>
      </div>

      <!-- Close Button -->
      <button
        type="button"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-medium text-stone-400 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
        aria-label="Close panel"
        title="Close panel"
        @click="uiStore.closePanel()"
      >
        ✕
      </button>
    </div>

    <!-- Panel Content -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-5">
      <template v-if="uiStore.panelTab === 'operator'">
        <GameSwitch
          v-if="showGameSwitch"
          class="mb-4"
          :model-value="game"
          :options="gameOptions"
          layout-id="active-entry-game"
          group-label="Game to record results for"
          @update:model-value="selectGame"
        />
        <TimedOperatorPanel v-if="game === 'timed'" />
        <OperatorPanel v-else />
      </template>
      <PlayersPanel v-else />
    </div>
  </div>
</template>
