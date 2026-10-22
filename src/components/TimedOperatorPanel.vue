<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TimeEntry from '@/components/TimeEntry.vue'
import PlayerSelect from '@/components/PlayerSelect.vue'
import PlayerSearch from '@/components/PlayerSearch.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePlayersStore } from '@/stores/players'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { attemptLabel, bestTime, hasReachedAttemptLimit } from '@/domain/timing'

const playersStore = usePlayersStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()

const currentPlayer = computed(() => playersStore.currentPlayer)
const attemptsPerPlayer = computed(() => settingsStore.attemptsPerPlayer)

const editingAttemptIndex = ref<number | null>(null)
const errorMessage = ref<string | null>(null)
const showUndoConfirm = ref(false)

const isEditing = computed(() => editingAttemptIndex.value !== null)
const atAttemptLimit = computed(
  () =>
    !!currentPlayer.value && hasReachedAttemptLimit(currentPlayer.value, attemptsPerPlayer.value),
)
const entryBlocked = computed(() => atAttemptLimit.value && !isEditing.value)
const currentBest = computed(() => (currentPlayer.value ? bestTime(currentPlayer.value) : null))

const editingInitialMs = computed(() => {
  if (editingAttemptIndex.value === null) return undefined
  return currentPlayer.value?.attempts[editingAttemptIndex.value]?.ms
})

// Remounts the entry form (clearing its draft and stopwatch) after each
// recorded attempt, and when switching player or the attempt being corrected.
const entryKey = computed(
  () =>
    `${playersStore.currentPlayerId}:${editingAttemptIndex.value ?? 'new'}:${currentPlayer.value?.attempts.length ?? 0}`,
)

function resetDraft() {
  editingAttemptIndex.value = null
  errorMessage.value = null
}

function submit(ms: number | null) {
  const player = currentPlayer.value
  if (!player) return
  const result = isEditing.value
    ? playersStore.updateAttempt(player.id, editingAttemptIndex.value as number, ms)
    : playersStore.submitAttempt(player.id, ms, attemptsPerPlayer.value)
  if (result.ok) {
    resetDraft()
  } else {
    errorMessage.value = result.error ?? 'Could not record attempt.'
  }
}

function editAttempt(index: number) {
  if (!currentPlayer.value?.attempts[index]) return
  editingAttemptIndex.value = index
  errorMessage.value = null
}

function confirmUndo() {
  const player = currentPlayer.value
  if (!player) return
  const result = playersStore.undoLastAttempt(player.id)
  if (
    result.ok &&
    editingAttemptIndex.value !== null &&
    editingAttemptIndex.value >= player.attempts.length
  ) {
    resetDraft()
  } else if (!result.ok) {
    errorMessage.value = result.error ?? 'Nothing to undo.'
  }
  showUndoConfirm.value = false
}

function selectPlayer(id: string) {
  playersStore.selectPlayer(id)
  resetDraft()
}

watch(
  () => playersStore.currentPlayerId,
  () => resetDraft(),
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Empty State -->
    <div
      v-if="playersStore.players.length === 0"
      class="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
    >
      <p class="mb-4 text-base text-stone-300">No players yet.</p>
      <button
        type="button"
        class="rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-stone-950 hover:bg-amber-300 active:scale-95 transition-all shadow-sm"
        @click="uiStore.setTab('players')"
      >
        Add players
      </button>
    </div>

    <template v-else>
      <!-- Player Selection Section -->
      <section
        class="relative z-30 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
      >
        <label
          class="mb-2 block text-xs font-semibold tracking-wider text-stone-400 uppercase select-none"
        >
          Find player
        </label>
        <PlayerSearch :players="playersStore.players" @select="selectPlayer" />

        <label
          class="mt-4 mb-2 block text-xs font-semibold tracking-wider text-stone-400 uppercase select-none"
        >
          Current player
        </label>
        <div class="flex-1 min-w-0 h-11">
          <PlayerSelect
            :players="playersStore.players"
            :model-value="playersStore.currentPlayerId"
            @update:model-value="selectPlayer"
          />
        </div>
      </section>

      <!-- Time Entry Section -->
      <section v-if="currentPlayer" class="flex flex-col gap-4">
        <TimeEntry
          :key="entryKey"
          :initial-ms="editingInitialMs"
          :editing="isEditing"
          :disabled="entryBlocked"
          :submit-label="isEditing ? 'Save correction' : 'Record time'"
          @submit="submit"
          @cancel="resetDraft"
        />

        <p
          v-if="errorMessage"
          class="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs sm:text-sm text-red-300"
        >
          {{ errorMessage }}
        </p>
        <p
          v-if="entryBlocked"
          class="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs sm:text-sm text-amber-300"
        >
          All {{ attemptsPerPlayer }} attempts have been used. Click an attempt below to correct it.
        </p>

        <button
          type="button"
          class="rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-xs sm:text-sm font-semibold text-stone-300 hover:bg-white/[0.1] hover:text-white active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPlayer.attempts.length === 0"
          @click="showUndoConfirm = true"
        >
          ↶ Undo last attempt
        </button>
      </section>

      <!-- Attempts History Section -->
      <section
        v-if="currentPlayer"
        class="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
      >
        <h2 class="mb-3 text-xs font-semibold tracking-wider text-stone-400 uppercase select-none">
          Attempts so far (click to correct)
        </h2>
        <p
          v-if="currentPlayer.attempts.length === 0"
          class="py-2 text-center text-xs text-stone-500"
        >
          No attempts recorded yet.
        </p>
        <ul v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <li v-for="(attempt, index) in currentPlayer.attempts" :key="index">
            <button
              type="button"
              class="w-full rounded-xl border p-2.5 text-left transition-all duration-150 active:scale-95"
              :class="
                editingAttemptIndex === index
                  ? 'border-amber-400/80 bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/50 shadow-sm'
                  : 'border-white/10 bg-white/[0.04] text-stone-300 hover:border-white/20 hover:bg-white/[0.08]'
              "
              @click="editAttempt(index)"
            >
              <span class="block text-[11px] font-medium text-stone-400">
                Attempt {{ index + 1 }}
                <span
                  v-if="attempt.ms !== null && attempt.ms === currentBest"
                  class="text-amber-300"
                  >★ best</span
                >
              </span>
              <span class="text-base sm:text-lg font-bold tabular-nums">{{
                attemptLabel(attempt)
              }}</span>
            </button>
          </li>
        </ul>
      </section>
    </template>

    <ConfirmDialog
      :open="showUndoConfirm"
      title="Undo last attempt?"
      message="This removes the most recently recorded attempt for this player. This cannot be undone."
      confirm-label="Undo"
      danger
      @confirm="confirmUndo"
      @cancel="showUndoConfirm = false"
    />
  </div>
</template>
