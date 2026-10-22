<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePlayersStore } from '@/stores/players'

const playersStore = usePlayersStore()

const newName = ref('')
const newClass = ref('')
const addError = ref<string | null>(null)

function addPlayer() {
  const result = playersStore.addPlayer(newName.value, newClass.value)
  if (result.ok) {
    newName.value = ''
    newClass.value = ''
    addError.value = null
  } else {
    addError.value = result.error ?? 'Could not add player.'
  }
}

const bulkText = ref('')
const bulkResult = ref<{ added: number; skipped: number } | null>(null)
const showBulk = ref(false)

function bulkAdd() {
  bulkResult.value = playersStore.bulkAddPlayers(bulkText.value)
  bulkText.value = ''
}

const editingId = ref<string | null>(null)
const editName = ref('')
const editClass = ref('')
const editError = ref<string | null>(null)

function startEdit(id: string, name: string, className: string | undefined) {
  editingId.value = id
  editName.value = name
  editClass.value = className ?? ''
  editError.value = null
}

function saveEdit() {
  if (!editingId.value) return
  const result = playersStore.renamePlayer(editingId.value, editName.value)
  if (!result.ok) {
    editError.value = result.error ?? 'Could not rename player.'
    return
  }
  playersStore.setClassName(editingId.value, editClass.value)
  editingId.value = null
  editError.value = null
}

function cancelEdit() {
  editingId.value = null
  editError.value = null
}

const deleteCandidate = computed(
  () => playersStore.players.find((p) => p.id === deleteCandidateId.value) ?? null,
)
const deleteCandidateId = ref<string | null>(null)

function confirmDelete() {
  if (deleteCandidateId.value) playersStore.deletePlayer(deleteCandidateId.value)
  deleteCandidateId.value = null
}

const searchQuery = ref('')
const filteredPlayers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return playersStore.players
  return playersStore.players.filter(
    (p) => p.name.toLowerCase().includes(q) || p.className?.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Add Player Section -->
    <section
      class="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
    >
      <h2 class="mb-3 text-xs font-semibold tracking-wider text-stone-400 uppercase select-none">
        Add a player
      </h2>
      <form class="flex flex-wrap gap-2" @submit.prevent="addPlayer">
        <input
          v-model="newName"
          type="text"
          placeholder="Player name"
          class="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400/80 transition-all"
        />
        <input
          v-model="newClass"
          type="text"
          placeholder="Class (opt.)"
          class="w-28 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400/80 transition-all"
        />
        <button
          type="submit"
          class="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-300 active:scale-95 transition-all shadow-sm"
        >
          Add
        </button>
      </form>
      <p
        v-if="addError"
        class="mt-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
      >
        {{ addError }}
      </p>

      <div class="mt-3">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400/90 hover:text-amber-300 transition-colors"
          @click="showBulk = !showBulk"
        >
          <span>{{ showBulk ? '▾' : '▸' }}</span>
          <span>{{ showBulk ? 'Hide bulk add' : 'Bulk add (paste a list)' }}</span>
        </button>

        <div v-if="showBulk" class="mt-3 flex flex-col gap-2">
          <textarea
            v-model="bulkText"
            rows="4"
            placeholder="One name per line, e.g.&#10;Ada Lovelace, 10A&#10;Alan Turing"
            class="w-full rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400/80 font-mono transition-all"
          ></textarea>
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              class="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-stone-200 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
              @click="bulkAdd"
            >
              Add all
            </button>
            <p v-if="bulkResult" class="text-xs text-stone-400">
              Added {{ bulkResult.added }}, skipped {{ bulkResult.skipped }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Players List Section -->
    <section
      class="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-xs font-semibold tracking-wider text-stone-400 uppercase select-none">
          Players ({{ playersStore.players.length }})
        </h2>
      </div>

      <!-- Apple-style search field -->
      <div v-if="playersStore.players.length > 0" class="relative mb-3">
        <span
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 text-xs"
        >
          🔍
        </span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search by name or class…"
          class="w-full rounded-xl border border-white/10 bg-white/[0.05] pl-8 pr-3 py-2 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400/80 transition-all"
        />
      </div>

      <p v-if="playersStore.players.length === 0" class="py-4 text-center text-xs text-stone-500">
        No players yet. Add one above.
      </p>
      <p v-else-if="filteredPlayers.length === 0" class="py-4 text-center text-xs text-stone-500">
        No players match "{{ searchQuery }}".
      </p>
      <ul
        v-else
        class="divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
      >
        <li
          v-for="player in filteredPlayers"
          :key="player.id"
          class="p-2 sm:p-2.5 transition-colors duration-150"
          :class="
            player.id === playersStore.currentPlayerId
              ? 'bg-amber-400/[0.12]'
              : 'hover:bg-white/[0.04]'
          "
        >
          <!-- Editing state -->
          <div v-if="editingId === player.id" class="flex flex-wrap items-center gap-2">
            <input
              v-model="editName"
              type="text"
              placeholder="Name"
              class="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.08] px-2.5 py-1.5 text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400/80"
              @keyup.enter="saveEdit"
            />
            <input
              v-model="editClass"
              type="text"
              placeholder="Class"
              class="w-24 rounded-lg border border-white/10 bg-white/[0.08] px-2.5 py-1.5 text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400/80"
              @keyup.enter="saveEdit"
            />
            <button
              type="button"
              class="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-300 active:scale-95 transition-all"
              @click="saveEdit"
            >
              Save
            </button>
            <button
              type="button"
              class="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-stone-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
              @click="cancelEdit"
            >
              Cancel
            </button>
            <p v-if="editError" class="basis-full text-xs text-red-300">{{ editError }}</p>
          </div>

          <!-- Viewing state -->
          <div v-else class="flex items-center justify-between gap-2">
            <button
              type="button"
              class="flex flex-1 min-w-0 items-center gap-2 text-left focus:outline-none"
              @click="playersStore.selectPlayer(player.id)"
            >
              <span class="truncate font-semibold text-xs sm:text-sm text-stone-100">
                {{ player.name }}
              </span>
              <span
                v-if="player.className"
                class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-white/[0.06] text-stone-300 border border-white/[0.08]"
              >
                {{ player.className }}
              </span>
              <span class="shrink-0 text-[11px] tabular-nums text-stone-400">
                ({{ player.rounds.length }} rounds, {{ player.attempts.length }} attempts)
              </span>
            </button>

            <!-- Row actions -->
            <div class="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                class="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-stone-300 hover:bg-white/[0.08] hover:text-white active:scale-95 transition-all"
                @click="startEdit(player.id, player.name, player.className)"
              >
                Rename
              </button>
              <button
                type="button"
                class="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 active:scale-95 transition-all"
                @click="deleteCandidateId = player.id"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- Confirm dialog -->
    <ConfirmDialog
      :open="deleteCandidate !== null"
      title="Delete player?"
      :message="`This permanently removes ${deleteCandidate?.name ?? ''} and all of their rounds and attempts.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
      @cancel="deleteCandidateId = null"
    />
  </div>
</template>
