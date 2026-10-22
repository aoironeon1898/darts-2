import { defineStore } from 'pinia'
import type { Dart, Player, Round, TimedAttempt } from '@/types'
import { hasReachedRoundLimit, isValidDart } from '@/domain/scoring'
import { hasReachedAttemptLimit, isValidAttempt } from '@/domain/timing'

function generateId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

export interface AddPlayerResult {
  ok: boolean
  error?: string
}

export const usePlayersStore = defineStore('players', {
  state: () => ({
    players: [] as Player[],
    /** The player currently selected on the Operator screen. */
    currentPlayerId: null as string | null,
  }),
  getters: {
    currentPlayer(state): Player | null {
      return state.players.find((p) => p.id === state.currentPlayerId) ?? null
    },
    byId(state) {
      return (id: string) => state.players.find((p) => p.id === id) ?? null
    },
  },
  actions: {
    /** Adds a single player. Rejects empty or case-insensitively duplicate names. */
    addPlayer(name: string, className?: string): AddPlayerResult {
      const trimmedName = name.trim()
      if (!trimmedName) return { ok: false, error: 'Name cannot be empty.' }
      const exists = this.players.some((p) => normalize(p.name) === normalize(trimmedName))
      if (exists) return { ok: false, error: `"${trimmedName}" already exists.` }

      const player: Player = {
        id: generateId(),
        name: trimmedName,
        className: className?.trim() || undefined,
        rounds: [],
        attempts: [],
      }
      this.players.push(player)
      if (this.currentPlayerId === null) this.currentPlayerId = player.id
      return { ok: true }
    },

    /**
     * Adds many players at once, one name per line. Optionally "Name, Class".
     * Returns how many were added vs skipped (empty/duplicate).
     */
    bulkAddPlayers(text: string): { added: number; skipped: number } {
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      let added = 0
      let skipped = 0
      for (const line of lines) {
        const [namePart, classPart] = line.split(',').map((s) => s.trim())
        const result = this.addPlayer(namePart ?? '', classPart)
        if (result.ok) added++
        else skipped++
      }
      return { added, skipped }
    },

    renamePlayer(id: string, name: string): AddPlayerResult {
      const trimmedName = name.trim()
      if (!trimmedName) return { ok: false, error: 'Name cannot be empty.' }
      const duplicate = this.players.some(
        (p) => p.id !== id && normalize(p.name) === normalize(trimmedName),
      )
      if (duplicate) return { ok: false, error: `"${trimmedName}" already exists.` }
      const player = this.players.find((p) => p.id === id)
      if (!player) return { ok: false, error: 'Player not found.' }
      player.name = trimmedName
      return { ok: true }
    },

    setClassName(id: string, className: string) {
      const player = this.players.find((p) => p.id === id)
      if (!player) return
      player.className = className.trim() || undefined
    },

    deletePlayer(id: string) {
      this.players = this.players.filter((p) => p.id !== id)
      if (this.currentPlayerId === id) {
        this.currentPlayerId = this.players[0]?.id ?? null
      }
    },

    selectPlayer(id: string) {
      if (this.players.some((p) => p.id === id)) this.currentPlayerId = id
    },

    selectNextPlayer() {
      this.stepCurrentPlayer(1)
    },

    selectPreviousPlayer() {
      this.stepCurrentPlayer(-1)
    },

    stepCurrentPlayer(direction: 1 | -1) {
      if (this.players.length === 0) {
        this.currentPlayerId = null
        return
      }
      const index = this.players.findIndex((p) => p.id === this.currentPlayerId)
      const nextIndex =
        index === -1 ? 0 : (index + direction + this.players.length) % this.players.length
      this.currentPlayerId = this.players[nextIndex]?.id ?? null
    },

    /** Submits a new round for a player, if darts are valid and the round limit hasn't been reached. */
    submitRound(playerId: string, darts: Dart[], roundsPerPlayer: number): AddPlayerResult {
      const player = this.players.find((p) => p.id === playerId)
      if (!player) return { ok: false, error: 'Player not found.' }
      if (hasReachedRoundLimit(player, roundsPerPlayer)) {
        return { ok: false, error: 'This player has already thrown all of their rounds.' }
      }
      if (darts.length === 0) return { ok: false, error: 'Enter at least one dart.' }
      if (!darts.every(isValidDart)) return { ok: false, error: 'One or more darts are invalid.' }
      player.rounds.push({ darts: darts.map((d) => ({ ...d })) })
      return { ok: true }
    },

    /** Replaces an already-submitted round in place (used to correct a past round). */
    updateRound(playerId: string, roundIndex: number, darts: Dart[]): AddPlayerResult {
      const player = this.players.find((p) => p.id === playerId)
      if (!player) return { ok: false, error: 'Player not found.' }
      const round = player.rounds[roundIndex]
      if (!round) return { ok: false, error: 'Round not found.' }
      if (!darts.every(isValidDart)) return { ok: false, error: 'One or more darts are invalid.' }
      round.darts = darts.map((d) => ({ ...d }))
      return { ok: true }
    },

    /** Removes the most recently submitted round for a player. */
    undoLastRound(playerId: string): AddPlayerResult {
      const player = this.players.find((p) => p.id === playerId)
      if (!player) return { ok: false, error: 'Player not found.' }
      if (player.rounds.length === 0) return { ok: false, error: 'No rounds to undo.' }
      player.rounds.pop()
      return { ok: true }
    },

    /** Records a new timed-game attempt (`null` = DNF), if valid and the attempt limit hasn't been reached. */
    submitAttempt(playerId: string, ms: number | null, attemptsPerPlayer: number): AddPlayerResult {
      const player = this.players.find((p) => p.id === playerId)
      if (!player) return { ok: false, error: 'Player not found.' }
      if (hasReachedAttemptLimit(player, attemptsPerPlayer)) {
        return { ok: false, error: 'This player has already used all of their attempts.' }
      }
      if (!isValidAttempt({ ms })) return { ok: false, error: 'That time is not valid.' }
      player.attempts.push({ ms })
      return { ok: true }
    },

    /** Replaces an already-recorded attempt in place (used to correct a past attempt). */
    updateAttempt(playerId: string, attemptIndex: number, ms: number | null): AddPlayerResult {
      const player = this.players.find((p) => p.id === playerId)
      if (!player) return { ok: false, error: 'Player not found.' }
      const attempt = player.attempts[attemptIndex]
      if (!attempt) return { ok: false, error: 'Attempt not found.' }
      if (!isValidAttempt({ ms })) return { ok: false, error: 'That time is not valid.' }
      attempt.ms = ms
      return { ok: true }
    },

    /** Removes the most recently recorded attempt for a player. */
    undoLastAttempt(playerId: string): AddPlayerResult {
      const player = this.players.find((p) => p.id === playerId)
      if (!player) return { ok: false, error: 'Player not found.' }
      if (player.attempts.length === 0) return { ok: false, error: 'No attempts to undo.' }
      player.attempts.pop()
      return { ok: true }
    },

    /** Wholesale replace, used by import and cross-tab sync. Validates defensively. */
    replaceAll(players: unknown) {
      if (!Array.isArray(players)) return
      const sanitized: Player[] = []
      for (const candidate of players) {
        if (
          candidate &&
          typeof candidate === 'object' &&
          typeof (candidate as Player).id === 'string' &&
          typeof (candidate as Player).name === 'string' &&
          Array.isArray((candidate as Player).rounds)
        ) {
          const p = candidate as Player
          const rounds: Round[] = p.rounds
            .filter((r) => r && Array.isArray(r.darts))
            .map((r) => ({
              darts: r.darts.filter(
                (d): d is Dart =>
                  !!d && typeof d.segment === 'number' && typeof d.multiplier === 'number',
              ),
            }))
          // `attempts` is missing from data saved before the timed game existed.
          const attempts: TimedAttempt[] = Array.isArray(p.attempts)
            ? p.attempts
                .filter(
                  (a): a is TimedAttempt =>
                    !!a && (a.ms === null || typeof a.ms === 'number') && isValidAttempt(a),
                )
                .map((a) => ({ ms: a.ms }))
            : []
          sanitized.push({
            id: p.id,
            name: p.name,
            className: typeof p.className === 'string' ? p.className : undefined,
            rounds,
            attempts,
          })
        }
      }
      this.players = sanitized
      if (!this.players.some((p) => p.id === this.currentPlayerId)) {
        this.currentPlayerId = this.players[0]?.id ?? null
      }
    },

    resetAll() {
      this.players = []
      this.currentPlayerId = null
    },
  },
})
