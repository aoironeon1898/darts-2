<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import TimeLeaderboardTable from '@/components/TimeLeaderboardTable.vue'
import GameSwitch from '@/components/GameSwitch.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import { usePlayersStore } from '@/stores/players'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { rankPlayers } from '@/domain/scoring'
import { rankTimedPlayers } from '@/domain/timing'
import { CONTROL_PANEL_WIDTH_CLASS, LEADERBOARD_MAX_WIDTH_CLASS } from '@/config'
import type { GameKind } from '@/types'

const route = useRoute()
const playersStore = usePlayersStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()

const isPresentation = computed(() => route.query.present === '1')
// `?game=darts|timed` pins a projected tab to one game; otherwise it follows the operator's choice.
const game = computed<GameKind>(() => {
  const pinned = route.query.game
  return pinned === 'darts' || pinned === 'timed' ? pinned : settingsStore.activeGame
})
const isGamePinned = computed(() => route.query.game === 'darts' || route.query.game === 'timed')
const title = computed(() =>
  game.value === 'timed' ? settingsStore.timedGameTitle : settingsStore.competitionTitle,
)
const rankedPlayers = computed(() => rankPlayers(playersStore.players))
const rankedTimedPlayers = computed(() => rankTimedPlayers(playersStore.players))

function selectPlayer(id: string) {
  playersStore.selectPlayer(id)
}
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <div
      class="flex min-w-0 flex-1 flex-col overflow-hidden px-6 py-6 transition-[padding] duration-300 sm:px-10 sm:py-8"
    >
      <div
        class="mx-auto flex w-full min-h-0 flex-1 flex-col transition-[max-width] duration-300"
        :class="LEADERBOARD_MAX_WIDTH_CLASS"
      >
        <header class="mb-6 flex shrink-0 items-start justify-between gap-4">
          <h1 class="text-3xl font-black tracking-tight text-gold-300 sm:text-5xl truncate">
            {{ title }}
          </h1>
          <div v-if="!isPresentation" class="flex my-auto shrink-0 items-center gap-2">
            <GameSwitch
              v-if="!isGamePinned"
              :model-value="game"
              @update:model-value="settingsStore.setActiveGame"
            />
            <button
              type="button"
              class="flex backdrop-blur-xl h-10 w-10 items-center justify-center rounded-lg border border-wood-700 bg-wood-900/70 text-lg font-semibold text-stone-300 transition-colors hover:border-gold-400/60 hover:bg-wood-800 hover:text-gold-300"
              :aria-label="uiStore.panelOpen ? 'Close control panel' : 'Open control panel'"
              :title="uiStore.panelOpen ? 'Close control panel' : 'Open control panel'"
              @click="uiStore.togglePanel()"
            >
              {{ uiStore.panelOpen ? '✕' : '🎯' }}
            </button>
            <a
              href="#/settings"
              target="_blank"
              rel="noopener"
              class="flex backdrop-blur-xl h-10 w-10 items-center justify-center rounded-lg border border-wood-700 bg-wood-900/70 text-lg font-semibold text-stone-300 transition-colors hover:border-gold-400/60 hover:bg-wood-800 hover:text-gold-300"
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </a>
          </div>
        </header>

        <div
          v-if="playersStore.players.length === 0"
          class="flex flex-1 items-center justify-center"
        >
          <div class="text-center">
            <p class="mb-4 text-2xl text-stone-400">No players yet.</p>
            <button
              type="button"
              class="rounded-lg bg-gold-400 px-6 py-3 text-lg font-bold text-wood-950 hover:bg-gold-300"
              @click="uiStore.openPanel('players')"
            >
              Add players
            </button>
          </div>
        </div>

        <div v-else class="min-h-0 flex-1 pb-6">
          <TimeLeaderboardTable
            v-if="game === 'timed'"
            :players="rankedTimedPlayers"
            :attempts-per-player="settingsStore.attemptsPerPlayer"
            :highlighted-id="playersStore.currentPlayerId"
            @select="selectPlayer"
          />
          <LeaderboardTable
            v-else
            :players="rankedPlayers"
            :rounds-per-player="settingsStore.roundsPerPlayer"
            :highlighted-id="playersStore.currentPlayerId"
            @select="selectPlayer"
          />
        </div>
      </div>
    </div>

    <div
      class="shrink-0 overflow-hidden border-white/10 transition-[width] duration-300 ease-in-out"
      :class="uiStore.panelOpen ? `w-full ${CONTROL_PANEL_WIDTH_CLASS}` : 'w-0'"
    >
      <div class="h-full w-full sm:w-110">
        <ControlPanel :game="game" />
      </div>
    </div>
  </div>
</template>
