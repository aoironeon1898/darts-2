<script setup lang="ts">
import { ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePlayersStore } from '@/stores/players'
import { useSettingsStore } from '@/stores/settings'
import { rankPlayers } from '@/domain/scoring'
import { attemptLabel, formatTime, rankTimedPlayers } from '@/domain/timing'
import type { ExportedData } from '@/types'

const playersStore = usePlayersStore()
const settingsStore = useSettingsStore()

const titleDraft = ref(settingsStore.competitionTitle)
const roundsDraft = ref(settingsStore.roundsPerPlayer)
const timedTitleDraft = ref(settingsStore.timedGameTitle)
const attemptsDraft = ref(settingsStore.attemptsPerPlayer)

function saveTitle() {
  settingsStore.setCompetitionTitle(titleDraft.value)
  titleDraft.value = settingsStore.competitionTitle
}

function saveRounds() {
  settingsStore.setRoundsPerPlayer(Number(roundsDraft.value))
  roundsDraft.value = settingsStore.roundsPerPlayer
}

function saveTimedTitle() {
  settingsStore.setTimedGameTitle(timedTitleDraft.value)
  timedTitleDraft.value = settingsStore.timedGameTitle
}

function saveAttempts() {
  settingsStore.setAttemptsPerPlayer(Number(attemptsDraft.value))
  attemptsDraft.value = settingsStore.attemptsPerPlayer
}

function syncDrafts() {
  titleDraft.value = settingsStore.competitionTitle
  roundsDraft.value = settingsStore.roundsPerPlayer
  timedTitleDraft.value = settingsStore.timedGameTitle
  attemptsDraft.value = settingsStore.attemptsPerPlayer
}

function stepRounds(delta: number) {
  const current = Number(roundsDraft.value) || 1
  roundsDraft.value = Math.min(20, Math.max(1, current + delta))
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function exportJson() {
  const data: ExportedData = {
    version: 2,
    players: playersStore.players,
    settings: {
      roundsPerPlayer: settingsStore.roundsPerPlayer,
      competitionTitle: settingsStore.competitionTitle,
      attemptsPerPlayer: settingsStore.attemptsPerPlayer,
      timedGameTitle: settingsStore.timedGameTitle,
      activeGame: settingsStore.activeGame,
      leaderboardView: settingsStore.leaderboardView,
    },
  }
  download('darts-scoreboard.json', JSON.stringify(data, null, 2), 'application/json')
}

function csvEscape(value: string | number): string {
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function exportCsv() {
  const ranked = rankPlayers(playersStore.players)
  const header = ['Rank', 'Name', 'Class', 'Rounds completed', 'Best round', 'Total']
  const rows = ranked.map((p) => [
    p.rank,
    p.name,
    p.className ?? '',
    `${p.roundsCompleted}/${settingsStore.roundsPerPlayer}`,
    p.bestRound,
    p.total,
  ])
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  download('leaderboard.csv', csv, 'text/csv')
}

function exportTimesCsv() {
  const ranked = rankTimedPlayers(playersStore.players)
  const attemptColumns = Array.from(
    { length: settingsStore.attemptsPerPlayer },
    (_, i) => `Attempt ${i + 1}`,
  )
  const header = ['Rank', 'Name', 'Class', 'Best time', ...attemptColumns]
  const rows = ranked.map((p) => [
    p.bestTime === null ? '' : p.rank,
    p.name,
    p.className ?? '',
    p.bestTime === null ? '' : formatTime(p.bestTime),
    ...attemptColumns.map((_, i) => {
      const attempt = p.attempts[i]
      return attempt ? attemptLabel(attempt) : ''
    }),
  ])
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  download('time-leaderboard.csv', csv, 'text/csv')
}

const importError = ref<string | null>(null)
const importSuccess = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
  importError.value = null
  importSuccess.value = null
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const raw = reader.result
      if (typeof raw !== 'string') throw new Error('Unreadable file.')
      const data = JSON.parse(raw) as Partial<ExportedData>
      if (!data || typeof data !== 'object' || !Array.isArray(data.players)) {
        throw new Error('This file does not look like a Darts Scoreboard export.')
      }
      playersStore.replaceAll(data.players)
      if (data.settings) settingsStore.replaceAll(data.settings)
      syncDrafts()
      importError.value = null
      importSuccess.value = `Imported ${playersStore.players.length} player(s).`
    } catch (err) {
      importError.value =
        err instanceof Error
          ? `Import failed: ${err.message}`
          : 'Import failed: the file could not be read as valid JSON.'
    }
  }
  reader.onerror = () => {
    importError.value = 'Import failed: could not read the file.'
  }
  reader.readAsText(file)
}

const showResetConfirm = ref(false)

function confirmReset() {
  playersStore.resetAll()
  settingsStore.resetToDefaults()
  syncDrafts()
  showResetConfirm.value = false
}
</script>

<template>
  <div class="min-h-screen py-8 sm:py-12">
    <div class="mx-auto max-w-2xl px-4 sm:px-6">
      <!-- Navigation / Header -->
      <header class="mb-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-stone-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all shadow-sm"
            aria-label="Back to leaderboard"
            title="Back to leaderboard"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="10 3 5 8 10 13" />
            </svg>
          </RouterLink>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">Settings</h1>
        </div>
      </header>

      <div class="flex flex-col gap-6">
        <!-- Section: Competition -->
        <section
          class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
        >
          <h2
            class="mb-4 text-xs font-semibold tracking-wider text-stone-400 uppercase select-none"
          >
            Competition
          </h2>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-stone-300"
                >Competition title</label
              >
              <div class="flex gap-2">
                <input
                  v-model="titleDraft"
                  type="text"
                  class="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  @keyup.enter="saveTitle"
                />
                <button
                  type="button"
                  class="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-300 active:scale-95 transition-all shadow-sm"
                  @click="saveTitle"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-stone-300"
                >Rounds per player</label
              >
              <div class="flex items-center gap-2">
                <!-- Apple HIG Stepper input -->
                <div
                  class="flex items-center rounded-xl border border-white/10 bg-white/[0.05] shadow-inner focus-within:border-amber-400/80 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all"
                >
                  <input
                    v-model.number="roundsDraft"
                    type="number"
                    min="1"
                    max="20"
                    class="w-16 px-3.5 py-2 text-sm font-semibold tabular-nums text-stone-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    @keyup.enter="saveRounds"
                  />
                  <div class="flex flex-col border-l border-white/10 pr-0.5">
                    <button
                      type="button"
                      class="flex h-4 w-6 items-center justify-center rounded-t text-stone-400 hover:bg-white/10 hover:text-white active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none"
                      :disabled="roundsDraft >= 20"
                      aria-label="Increase rounds"
                      @click="stepRounds(1)"
                    >
                      <svg
                        class="h-2.5 w-2.5"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="2 7.5 6 3.5 10 7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="flex h-4 w-6 items-center justify-center rounded-b text-stone-400 hover:bg-white/10 hover:text-white active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none"
                      :disabled="roundsDraft <= 1"
                      aria-label="Decrease rounds"
                      @click="stepRounds(-1)"
                    >
                      <svg
                        class="h-2.5 w-2.5"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="2 4.5 6 8.5 10 4.5" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  class="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-300 active:scale-95 transition-all shadow-sm"
                  @click="saveRounds"
                >
                  Save
                </button>
              </div>
              <p class="mt-2 text-xs text-stone-500">
                Lowering this does not delete already-recorded rounds; it only changes when entry is
                blocked.
              </p>
            </div>
          </div>
        </section>

        <!-- Section: Timed Game -->
        <section
          class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
        >
          <h2
            class="mb-4 text-xs font-semibold tracking-wider text-stone-400 uppercase select-none"
          >
            Timed game
          </h2>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-stone-300"
                >Time leaderboard title</label
              >
              <div class="flex gap-2">
                <input
                  v-model="timedTitleDraft"
                  type="text"
                  class="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  @keyup.enter="saveTimedTitle"
                />
                <button
                  type="button"
                  class="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-300 active:scale-95 transition-all shadow-sm"
                  @click="saveTimedTitle"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-stone-300"
                >Attempts per player</label
              >
              <div class="flex items-center gap-2">
                <input
                  v-model.number="attemptsDraft"
                  type="number"
                  min="1"
                  max="20"
                  class="w-20 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm font-semibold tabular-nums text-stone-100 focus:outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  @keyup.enter="saveAttempts"
                />
                <button
                  type="button"
                  class="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-300 active:scale-95 transition-all shadow-sm"
                  @click="saveAttempts"
                >
                  Save
                </button>
              </div>
              <p class="mt-2 text-xs text-stone-500">
                Players are ranked by their fastest finished attempt; with more than one attempt,
                ties go to the faster second attempt. A DNF counts as a used attempt.
              </p>
            </div>
          </div>
        </section>

        <!-- Section: Data Management -->
        <section
          class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
        >
          <h2
            class="mb-4 text-xs font-semibold tracking-wider text-stone-400 uppercase select-none"
          >
            Data
          </h2>
          <div class="flex flex-wrap gap-2.5">
            <button
              type="button"
              class="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs sm:text-sm font-semibold text-stone-200 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all shadow-sm"
              @click="exportJson"
            >
              Export JSON
            </button>
            <button
              type="button"
              class="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs sm:text-sm font-semibold text-stone-200 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all shadow-sm"
              @click="exportCsv"
            >
              Export Leaderboard CSV
            </button>
            <button
              type="button"
              class="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs sm:text-sm font-semibold text-stone-200 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all shadow-sm"
              @click="exportTimesCsv"
            >
              Export Time Leaderboard CSV
            </button>
            <button
              type="button"
              class="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs sm:text-sm font-semibold text-stone-200 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all shadow-sm"
              @click="triggerImport"
            >
              Import JSON
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="application/json"
              class="hidden"
              @change="onFileSelected"
            />
          </div>
          <p
            v-if="importError"
            class="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
          >
            {{ importError }}
          </p>
          <p
            v-if="importSuccess"
            class="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300"
          >
            {{ importSuccess }}
          </p>
        </section>

        <!-- Section: Danger Zone -->
        <section
          class="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 sm:p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
        >
          <h2 class="mb-2 text-xs font-semibold tracking-wider text-red-400 uppercase select-none">
            Danger Zone
          </h2>
          <p class="mb-4 text-xs text-stone-400">
            Permanently clear all saved tournament state, player rosters, historical rounds, and
            timed attempts.
          </p>
          <button
            type="button"
            class="rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs sm:text-sm font-semibold text-red-200 hover:bg-red-500/25 hover:text-red-100 active:scale-95 transition-all shadow-sm"
            @click="showResetConfirm = true"
          >
            Reset all data
          </button>
        </section>
      </div>
    </div>

    <ConfirmDialog
      :open="showResetConfirm"
      title="Reset all data?"
      message="This permanently deletes every player, round, attempt, and setting. This cannot be undone."
      confirm-label="Reset"
      danger
      @confirm="confirmReset"
      @cancel="showResetConfirm = false"
    />
  </div>
</template>
