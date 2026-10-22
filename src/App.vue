<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { usePlayersStore } from '@/stores/players'
import { useSettingsStore } from '@/stores/settings'
import { usePersist } from '@/composables/usePersist'
import { onCelebration, type CelebrationEvent } from '@/composables/useCelebration'
import CelebrationOverlay from '@/components/CelebrationOverlay.vue'
import { STORAGE_KEY_PLAYERS, STORAGE_KEY_SETTINGS, SYNC_CHANNEL_NAME } from '@/config'
import type { Player, Settings } from '@/types'

const route = useRoute()
const playersStore = usePlayersStore()
const settingsStore = useSettingsStore()

const { error: playersError } = usePersist<Player[]>({
  storageKey: STORAGE_KEY_PLAYERS,
  channelName: `${SYNC_CHANNEL_NAME}:players`,
  getSnapshot: () => playersStore.players,
  applySnapshot: (data) => playersStore.replaceAll(data),
})

const { error: settingsError } = usePersist<Settings>({
  storageKey: STORAGE_KEY_SETTINGS,
  channelName: `${SYNC_CHANNEL_NAME}:settings`,
  getSnapshot: () => ({
    roundsPerPlayer: settingsStore.roundsPerPlayer,
    competitionTitle: settingsStore.competitionTitle,
    attemptsPerPlayer: settingsStore.attemptsPerPlayer,
    timedGameTitle: settingsStore.timedGameTitle,
    activeGame: settingsStore.activeGame,
    leaderboardView: settingsStore.leaderboardView,
  }),
  applySnapshot: (data) => settingsStore.replaceAll(data),
  deep: false,
})

const dismissed = reactive(new Set<string>())
const banners = computed(() =>
  [
    playersError.value ? { id: 'players', message: playersError.value } : null,
    settingsError.value ? { id: 'settings', message: settingsError.value } : null,
  ].filter((b): b is { id: string; message: string } => b !== null && !dismissed.has(b.id)),
)

const isPresentation = computed(
  () => route.name === 'leaderboard' && route.query.present === '1',
)

// Celebration overlay is global so it can appear over the leaderboard, the
// operator panel, or both — regardless of which tab triggered it.
const activeCelebration = ref<CelebrationEvent | null>(null)
onCelebration((event) => {
  activeCelebration.value = event
})
function closeCelebration() {
  activeCelebration.value = null
}
</script>

<template>
  <div class="min-h-screen" :class="{ 'cursor-none': isPresentation }">
    <div v-if="banners.length" class="fixed inset-x-0 top-0 z-50 flex flex-col gap-1 p-2">
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="flex items-center justify-between rounded-lg border border-amber-600/50 bg-amber-950/95 px-4 py-2 text-sm text-amber-100 shadow-lg"
      >
        <span>⚠ {{ banner.message }}</span>
        <button
          type="button"
          class="ml-4 rounded px-2 py-1 text-amber-200 hover:bg-amber-900"
          @click="dismissed.add(banner.id)"
        >
          Dismiss
        </button>
      </div>
    </div>

    <RouterView />

    <CelebrationOverlay
      v-if="activeCelebration"
      :tier="activeCelebration.tier"
      :player-name="activeCelebration.playerName"
      :round-score="activeCelebration.roundScore"
      @close="closeCelebration"
    />
  </div>
</template>
