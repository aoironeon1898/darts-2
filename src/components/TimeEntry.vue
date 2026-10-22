<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { formatTime, parseTime } from '@/domain/timing'

const props = withDefaults(
  defineProps<{
    /** Time to prefill when correcting a past attempt (`null` = DNF, `undefined` = blank). */
    initialMs?: number | null
    submitLabel?: string
    disabled?: boolean
    editing?: boolean
  }>(),
  { initialMs: undefined, submitLabel: 'Record time', disabled: false, editing: false },
)

const emit = defineEmits<{
  submit: [ms: number | null]
  cancel: []
}>()

const text = ref('')
const parsed = computed(() => parseTime(text.value))
const showInvalid = computed(() => text.value.trim().length > 0 && parsed.value === null)
const canSubmit = computed(() => !props.disabled && parsed.value !== null)

// ── Stopwatch ───────────────────────────────────────────────────────
const running = ref(false)
const elapsedMs = ref(0)
let startedAt = 0
let frame: number | null = null

function tick() {
  elapsedMs.value = Math.floor(performance.now() - startedAt)
  frame = requestAnimationFrame(tick)
}

function startStopwatch() {
  if (running.value) return
  startedAt = performance.now() - elapsedMs.value
  running.value = true
  frame = requestAnimationFrame(tick)
}

function stopStopwatch() {
  if (!running.value) return
  if (frame !== null) cancelAnimationFrame(frame)
  frame = null
  elapsedMs.value = Math.floor(performance.now() - startedAt)
  running.value = false
  text.value = formatTime(elapsedMs.value)
}

function resetStopwatch() {
  if (frame !== null) cancelAnimationFrame(frame)
  frame = null
  running.value = false
  elapsedMs.value = 0
}

function toggleStopwatch() {
  if (running.value) stopStopwatch()
  else startStopwatch()
}

onBeforeUnmount(() => {
  if (frame !== null) cancelAnimationFrame(frame)
})

// ── Draft handling ──────────────────────────────────────────────────
// The prefilled text shows hundredths only, so remember it: saving it
// unchanged must keep the original milliseconds rather than truncating them.
let prefilledText = ''

function resetDraft() {
  prefilledText =
    props.initialMs === undefined || props.initialMs === null ? '' : formatTime(props.initialMs)
  text.value = prefilledText
  resetStopwatch()
}

watch(() => [props.initialMs, props.editing], resetDraft, { immediate: true })

function submit() {
  if (!canSubmit.value || parsed.value === null) return
  const unchanged = prefilledText !== '' && text.value.trim() === prefilledText
  emit('submit', unchanged && typeof props.initialMs === 'number' ? props.initialMs : parsed.value)
}

function submitDnf() {
  if (props.disabled) return
  emit('submit', null)
}
</script>

<template>
  <div
    class="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
    :class="{ 'pointer-events-none opacity-40': disabled }"
  >
    <!-- Stopwatch -->
    <h3 class="mb-2 text-xs font-semibold tracking-wider text-stone-400 uppercase select-none">
      Stopwatch
    </h3>
    <div class="mb-4 flex items-center gap-2">
      <span
        class="flex-1 text-3xl font-black tabular-nums text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      >
        {{ formatTime(elapsedMs) }}
      </span>
      <button
        type="button"
        class="rounded-xl px-4 py-2.5 text-sm font-bold active:scale-95 transition-all shadow-sm"
        :class="
          running
            ? 'border border-red-500/40 bg-red-500/20 text-red-100 hover:bg-red-500/30'
            : 'border border-emerald-500/40 bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800/60'
        "
        :disabled="disabled"
        @click="toggleStopwatch"
      >
        {{ running ? 'Stop' : elapsedMs > 0 ? 'Resume' : 'Start' }}
      </button>
      <button
        type="button"
        class="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-stone-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all disabled:opacity-40"
        :disabled="running || elapsedMs === 0"
        @click="resetStopwatch"
      >
        Reset
      </button>
    </div>

    <!-- Manual / stopped time -->
    <label
      for="time-entry-input"
      class="mb-1.5 block text-xs font-semibold tracking-wider text-stone-400 uppercase select-none"
    >
      Time
    </label>
    <input
      id="time-entry-input"
      v-model="text"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      :disabled="disabled"
      placeholder="e.g. 1:23.45 or 42.5"
      class="mb-1 w-full rounded-xl border bg-white/[0.05] px-3.5 py-2.5 text-lg font-bold tabular-nums text-stone-100 placeholder:text-sm placeholder:font-normal placeholder:text-stone-500 focus:outline-none focus:ring-2 transition-all"
      :class="
        showInvalid
          ? 'border-red-500/50 focus:border-red-400/80 focus:ring-red-400/20'
          : 'border-white/10 focus:border-amber-400/80 focus:ring-amber-400/20'
      "
      @keydown.enter.prevent="submit"
    />
    <p class="mb-4 h-4 text-xs" :class="showInvalid ? 'text-red-300' : 'text-stone-500'">
      {{ showInvalid ? 'Use seconds (42.5) or minutes:seconds (1:23.45).' : '' }}
    </p>

    <div class="flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-xl bg-amber-400 py-3 text-sm sm:text-base font-bold text-stone-950 transition-all hover:bg-amber-300 active:scale-95 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!canSubmit"
        @click="submit"
      >
        {{ submitLabel }}
      </button>
      <button
        type="button"
        class="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-stone-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
        title="Record this attempt as did not finish"
        @click="submitDnf"
      >
        DNF
      </button>
      <button
        v-if="editing"
        type="button"
        class="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-stone-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
