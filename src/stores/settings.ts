import { defineStore } from 'pinia'
import {
  DEFAULT_ATTEMPTS_PER_PLAYER,
  DEFAULT_COMPETITION_TITLE,
  DEFAULT_ROUNDS_PER_PLAYER,
  DEFAULT_TIMED_GAME_TITLE,
} from '@/config'
import type { GameKind, LeaderboardView, Settings } from '@/types'

export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    roundsPerPlayer: DEFAULT_ROUNDS_PER_PLAYER,
    competitionTitle: DEFAULT_COMPETITION_TITLE,
    attemptsPerPlayer: DEFAULT_ATTEMPTS_PER_PLAYER,
    timedGameTitle: DEFAULT_TIMED_GAME_TITLE,
    activeGame: 'darts',
    leaderboardView: 'both',
  }),
  actions: {
    setCompetitionTitle(title: string) {
      const trimmed = title.trim()
      this.competitionTitle = trimmed.length > 0 ? trimmed : DEFAULT_COMPETITION_TITLE
    },
    setRoundsPerPlayer(rounds: number) {
      if (!Number.isInteger(rounds) || rounds < 1) return
      this.roundsPerPlayer = rounds
    },
    setTimedGameTitle(title: string) {
      const trimmed = title.trim()
      this.timedGameTitle = trimmed.length > 0 ? trimmed : DEFAULT_TIMED_GAME_TITLE
    },
    setAttemptsPerPlayer(attempts: number) {
      if (!Number.isInteger(attempts) || attempts < 1) return
      this.attemptsPerPlayer = attempts
    },
    setActiveGame(game: GameKind) {
      this.activeGame = game
    },
    setLeaderboardView(view: LeaderboardView) {
      this.leaderboardView = view
    },
    /** Replaces the whole settings object, e.g. from an import or sync message. Validates shape defensively. */
    replaceAll(settings: Partial<Settings>) {
      if (typeof settings.competitionTitle === 'string' && settings.competitionTitle.trim()) {
        this.competitionTitle = settings.competitionTitle.trim()
      }
      if (typeof settings.roundsPerPlayer === 'number' && settings.roundsPerPlayer >= 1) {
        this.roundsPerPlayer = Math.floor(settings.roundsPerPlayer)
      }
      if (typeof settings.timedGameTitle === 'string' && settings.timedGameTitle.trim()) {
        this.timedGameTitle = settings.timedGameTitle.trim()
      }
      if (typeof settings.attemptsPerPlayer === 'number' && settings.attemptsPerPlayer >= 1) {
        this.attemptsPerPlayer = Math.floor(settings.attemptsPerPlayer)
      }
      if (settings.activeGame === 'darts' || settings.activeGame === 'timed') {
        this.activeGame = settings.activeGame
      }
      if (
        settings.leaderboardView === 'darts' ||
        settings.leaderboardView === 'timed' ||
        settings.leaderboardView === 'both'
      ) {
        this.leaderboardView = settings.leaderboardView
      }
    },
    resetToDefaults() {
      this.roundsPerPlayer = DEFAULT_ROUNDS_PER_PLAYER
      this.competitionTitle = DEFAULT_COMPETITION_TITLE
      this.attemptsPerPlayer = DEFAULT_ATTEMPTS_PER_PLAYER
      this.timedGameTitle = DEFAULT_TIMED_GAME_TITLE
      this.activeGame = 'darts'
      this.leaderboardView = 'both'
    },
  },
})
