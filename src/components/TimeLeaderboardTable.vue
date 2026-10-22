<script setup lang="ts">
import type { RankedTimedPlayer } from '@/types'
import { motion } from 'motion-v'
import { formatTime } from '@/domain/timing'

defineProps<{
  players: RankedTimedPlayer[]
  attemptsPerPlayer: number
  highlightedId?: string | null
  /** Shared-layout id for the current-player marker; must differ between tables on one screen. */
  indicatorLayoutId?: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

function rowClass(player: RankedTimedPlayer, isHighlighted: boolean): string {
  if (isHighlighted) {
    return 'bg-amber-400/[0.14] hover:bg-amber-400/[0.18]'
  }
  if (player.bestTime === null) return 'hover:bg-white/[0.04]'
  if (player.rank === 1) return 'bg-amber-400/[0.04] hover:bg-white/[0.05]'
  if (player.rank === 2) return 'bg-slate-300/[0.03] hover:bg-white/[0.05]'
  if (player.rank === 3) return 'bg-amber-700/[0.03] hover:bg-white/[0.05]'
  return 'hover:bg-white/[0.04]'
}

/** Podium rank to badge, only for players who actually have a time. */
function podium(player: RankedTimedPlayer): 1 | 2 | 3 | null {
  if (player.bestTime === null) return null
  return player.rank === 1 || player.rank === 2 || player.rank === 3 ? player.rank : null
}
</script>

<template>
  <div
    class="relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
  >
    <div
      class="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-wood-950/60 backdrop-blur-xl"
    />
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <table class="w-full border-collapse text-left">
        <thead class="sticky top-0 z-10 backdrop-blur-xl bg-wood-950/90 border-b border-white/8">
          <tr
            class="text-xs sm:text-sm font-semibold tracking-wider text-stone-400 uppercase select-none"
          >
            <th scope="col" class="w-14 sm:w-18 px-3 py-3 text-center sm:px-4">Rank</th>
            <th scope="col" class="px-3 py-3 sm:px-5">Player</th>
            <th scope="col" class="px-3 py-3 text-center sm:px-4">Class</th>
            <th scope="col" class="px-3 py-3 text-center sm:px-4">Attempts</th>
            <th scope="col" class="px-4 py-3 text-right sm:px-6">Best time</th>
          </tr>
        </thead>
        <TransitionGroup name="row" tag="tbody" class="divide-y divide-white/6">
          <tr
            v-for="player in players"
            :key="player.id"
            class="group relative cursor-pointer border-b border-white/6 last:border-b-0 transition-colors duration-150 focus-visible:outline-none focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-inset"
            :class="rowClass(player, player.id === highlightedId)"
            role="button"
            tabindex="0"
            :aria-pressed="player.id === highlightedId"
            :aria-label="`Select ${player.name} as the current player`"
            @click="emit('select', player.id)"
            @keydown.enter="emit('select', player.id)"
            @keydown.space.prevent="emit('select', player.id)"
          >
            <!-- Rank column -->
            <td class="relative w-14 sm:w-18 px-3 py-2.5 text-center sm:px-4 sm:py-3">
              <motion.div
                v-if="player.id === highlightedId"
                :layout-id="indicatorLayoutId ?? 'active-player-indicator'"
                class="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.7)]"
              />
              <div class="flex items-center justify-center">
                <div
                  v-if="podium(player) === 1"
                  class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 font-black text-stone-950 text-xs sm:text-sm shadow-[0_2px_6px_rgba(245,158,11,0.4)] ring-1 ring-inset ring-white/60"
                  title="Rank 1"
                >
                  1
                </div>
                <div
                  v-else-if="podium(player) === 2"
                  class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 font-black text-stone-900 text-xs sm:text-sm shadow-[0_2px_6px_rgba(203,213,225,0.3)] ring-1 ring-inset ring-white/80"
                  title="Rank 2"
                >
                  2
                </div>
                <div
                  v-else-if="podium(player) === 3"
                  class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 font-black text-amber-50 text-xs sm:text-sm shadow-[0_2px_6px_rgba(180,83,9,0.3)] ring-1 ring-inset ring-amber-300/40"
                  title="Rank 3"
                >
                  3
                </div>
                <span
                  v-else
                  class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/[0.04] text-xs sm:text-sm font-semibold tabular-nums text-stone-400 border border-white/[0.06]"
                >
                  {{ player.bestTime === null ? '—' : player.rank }}
                </span>
              </div>
            </td>

            <!-- Player column -->
            <td class="px-3 py-2.5 sm:px-5 sm:py-3">
              <span
                class="truncate text-base sm:text-lg font-semibold tracking-tight text-stone-100"
              >
                {{ player.name }}
              </span>
            </td>

            <!-- Class column -->
            <td class="px-3 py-2.5 text-center sm:px-4 sm:py-3">
              <span
                v-if="player.className"
                class="inline-flex items-center rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium bg-white/[0.06] text-stone-300 border border-white/[0.08]"
              >
                {{ player.className }}
              </span>
              <span v-else class="text-xs sm:text-sm text-stone-500">—</span>
            </td>

            <!-- Attempts column -->
            <td class="px-3 py-2.5 text-center sm:px-4 sm:py-3">
              <div class="flex items-center justify-center">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs sm:text-sm font-semibold tabular-nums"
                  :class="
                    player.attemptsCompleted >= attemptsPerPlayer
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                      : player.attemptsCompleted > 0
                        ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                        : 'bg-white/4 text-stone-400 border border-white/6'
                  "
                >
                  <span
                    v-if="player.attemptsCompleted >= attemptsPerPlayer"
                    class="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]"
                  />
                  <span
                    v-else-if="player.attemptsCompleted > 0"
                    class="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.6)]"
                  />
                  {{ player.attemptsCompleted }}/{{ attemptsPerPlayer }}
                </span>
              </div>
            </td>

            <!-- Best time column -->
            <td class="px-4 py-2.5 text-right sm:px-6 sm:py-3">
              <span
                v-if="player.bestTime !== null"
                class="font-bold tabular-nums tracking-tight text-lg sm:text-xl text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              >
                {{ formatTime(player.bestTime) }}
              </span>
              <span v-else-if="player.dnfCount > 0" class="text-sm font-semibold text-stone-500">
                DNF
              </span>
              <span v-else class="text-sm text-stone-500">—</span>
            </td>
          </tr>
        </TransitionGroup>
      </table>
    </div>
  </div>
</template>
