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
import {
  CONTROL_PANEL_WIDTH_CLASS,
  DUAL_LEADERBOARD_MAX_WIDTH_CLASS,
  LEADERBOARD_MAX_WIDTH_CLASS,
} from '@/config'
import type { GameKind, LeaderboardView } from '@/types'

const route = useRoute()
const playersStore = usePlayersStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()

const isPresentation = computed(() => route.query.present === '1')
function isLeaderboardView(value: unknown): value is LeaderboardView {
  return value === 'darts' || value === 'timed' || value === 'both'
}

// `?game=darts|timed|both` pins a projected tab to one layout; otherwise it follows the switch.
const isViewPinned = computed(() => isLeaderboardView(route.query.game))
const view = computed<LeaderboardView>(() =>
  isLeaderboardView(route.query.game) ? route.query.game : settingsStore.leaderboardView,
)
// With one game on screen the operator enters results for that game; with both, the
// operator picks the game inside the control panel.
const entryGame = computed<GameKind>(() =>
  view.value === 'both' ? settingsStore.activeGame : view.value,
)
const title = computed(() =>
  view.value === 'timed' ? settingsStore.timedGameTitle : settingsStore.competitionTitle,
)
const maxWidthClass = computed(() =>
  view.value === 'both' ? DUAL_LEADERBOARD_MAX_WIDTH_CLASS : LEADERBOARD_MAX_WIDTH_CLASS,
)

const viewOptions: { value: LeaderboardView; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'darts', label: '🎯 Darts' },
  { value: 'timed', label: '⏱ Time' },
]

function setView(next: LeaderboardView) {
  settingsStore.setLeaderboardView(next)
  if (next !== 'both') settingsStore.setActiveGame(next)
}
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
        :class="maxWidthClass"
      >
        <header class="mb-6 flex shrink-0 flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <h1
            class="min-w-0 flex-1 basis-64 text-3xl font-black tracking-tight text-gold-300 sm:text-5xl truncate"
          >
            {{ title }}
          </h1>
          <div v-if="!isPresentation" class="flex my-auto shrink-0 items-center gap-2">
            <GameSwitch
              v-if="!isViewPinned"
              :model-value="view"
              :options="viewOptions"
              layout-id="active-leaderboard-view"
              group-label="Leaderboards shown"
              @update:model-value="setView"
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

        <div v-else-if="view === 'both'" class="@container min-h-0 flex-1 pb-6">
          <div class="grid h-full grid-rows-2 gap-4 @5xl:grid-cols-2 @5xl:grid-rows-1 @5xl:gap-6">
            <section class="flex min-h-0 min-w-0 flex-col">
              <h2 class="mb-2 shrink-0 truncate text-lg font-bold text-stone-200 sm:text-2xl">
                🎯 Darts
              </h2>
              <div class="min-h-0 flex-1">
                <LeaderboardTable
                  :players="rankedPlayers"
                  :rounds-per-player="settingsStore.roundsPerPlayer"
                  :highlighted-id="playersStore.currentPlayerId"
                  indicator-layout-id="active-player-indicator-darts"
                  @select="selectPlayer"
                />
              </div>
            </section>
            <section class="flex min-h-0 min-w-0 flex-col">
              <h2 class="mb-2 shrink-0 truncate text-lg font-bold text-stone-200 sm:text-2xl">
                ⏱ {{ settingsStore.timedGameTitle }}
              </h2>
              <div class="min-h-0 flex-1">
                <TimeLeaderboardTable
                  :players="rankedTimedPlayers"
                  :attempts-per-player="settingsStore.attemptsPerPlayer"
                  :highlighted-id="playersStore.currentPlayerId"
                  indicator-layout-id="active-player-indicator-timed"
                  @select="selectPlayer"
                />
              </div>
            </section>
          </div>
        </div>

        <div v-else class="min-h-0 flex-1 pb-6">
          <TimeLeaderboardTable
            v-if="view === 'timed'"
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
        <ControlPanel :game="entryGame" :show-game-switch="view === 'both'" />
      </div>
    </div>
  </div>
</template>
