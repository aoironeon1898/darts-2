/** A single dart throw. */
export interface Dart {
  /** Segment hit: 0 (miss), 1-20, or 25 (bull). */
  segment: number
  /** Multiplier applied to the segment: 1 (single), 2 (double), 3 (triple). */
  multiplier: 1 | 2 | 3
}

/** One round of up to three darts. */
export interface Round {
  darts: Dart[]
}

/** One attempt in the timed game. */
export interface TimedAttempt {
  /** Elapsed time in milliseconds, or `null` for a DNF (did not finish). */
  ms: number | null
}

/** Which game the leaderboard and operator panel are showing. */
export type GameKind = 'darts' | 'timed'

/** A competitor in the competition. */
export interface Player {
  id: string
  name: string
  className?: string
  rounds: Round[]
  /** Attempts in the timed game. Older saved data may not have this; stores fill it with `[]`. */
  attempts: TimedAttempt[]
}

/** Competition-wide configuration, persisted alongside player data. */
export interface Settings {
  roundsPerPlayer: number
  competitionTitle: string
  attemptsPerPlayer: number
  timedGameTitle: string
  activeGame: GameKind
}

/** A player enriched with computed standings data, used for display. */
export interface RankedPlayer extends Player {
  total: number
  bestRound: number
  roundsCompleted: number
  /** Count of double/triple hits, used as a tie-breaker. */
  bigHits: number
  rank: number
}

/** A player enriched with computed timed-game standings, used for display. */
export interface RankedTimedPlayer extends Player {
  /** Fastest finished attempt in milliseconds, or `null` if none finished yet. */
  bestTime: number | null
  attemptsCompleted: number
  dnfCount: number
  rank: number
}

/**
 * Shape of the JSON blob produced by "Export JSON" / consumed by "Import JSON".
 * Version 2 added timed-game attempts and settings; version 1 files still import.
 */
export interface ExportedData {
  version: 1 | 2
  players: Player[]
  settings: Settings
}

/** Celebration tiers awarded for an exceptionally high round score. */
export type ScoreTier = 'S' | 'A' | 'B' | 'C'
