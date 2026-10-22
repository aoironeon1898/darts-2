/**
 * Game configuration constants.
 * Centralised here so the rules can be tuned without touching game logic.
 */
import type { ScoreTier } from './types'

/** Default number of rounds each player throws. */
export const DEFAULT_ROUNDS_PER_PLAYER = 3

/** Number of darts thrown per round. */
export const DARTS_PER_ROUND = 3

/** Default competition title shown on the leaderboard. */
export const DEFAULT_COMPETITION_TITLE = 'School Darts Championship'

/** Default number of attempts each player gets in the timed game. */
export const DEFAULT_ATTEMPTS_PER_PLAYER = 3

/** Default title shown on the timed-game leaderboard. */
export const DEFAULT_TIMED_GAME_TITLE = 'Time Attack'

/** Upper bound for a recorded time (just under 100 minutes), to reject typos. */
export const MAX_TIME_MS = 100 * 60 * 1000 - 1

/** Valid dart segments: 1-20, 25 (bull), 0 (miss). */
export const VALID_SEGMENTS = [0, 25, ...Array.from({ length: 20 }, (_, i) => i + 1)]

/** Valid multipliers. */
export const VALID_MULTIPLIERS = [1, 2, 3] as const

/** The bull segment value. */
export const BULL_SEGMENT = 25

/** The miss segment value. */
export const MISS_SEGMENT = 0

/** localStorage key used to persist the players store. */
export const STORAGE_KEY_PLAYERS = 'darts-scoreboard:players'

/** localStorage key used to persist the settings store. */
export const STORAGE_KEY_SETTINGS = 'darts-scoreboard:settings'

/** BroadcastChannel name used to sync operator and leaderboard tabs. */
export const SYNC_CHANNEL_NAME = 'darts-scoreboard:sync'

/** Auto-scroll step interval in milliseconds, used once the leaderboard overflows its container. */
export const AUTO_SCROLL_INTERVAL_MS = 50

/**
 * Celebration tier thresholds, keyed by the minimum single-round score (out
 * of a theoretical max of 180 = three triple-20s) required to earn that
 * rank. Checked highest-first.
 */
export const SCORE_TIER_THRESHOLDS: { tier: ScoreTier; minScore: number }[] = [
  { tier: 'S', minScore: 160 },
  { tier: 'A', minScore: 120 },
  { tier: 'B', minScore: 80 },
  { tier: 'C', minScore: 40 },
]

/**
 * Video file played for each celebration tier. These files are not bundled
 * yet; drop matching files under `public/videos/` (see the README there) and
 * the celebration overlay will start playing them automatically.
 */
export const CELEBRATION_VIDEOS: Record<ScoreTier, string> = {
  S: '/videos/celebration-s.mp4',
  A: '/videos/celebration-a.mp4',
  B: '/videos/celebration-b.mp4',
  C: '/videos/celebration-c.mp4',
}

/** BroadcastChannel name used to trigger the celebration overlay across tabs. */
export const CELEBRATION_CHANNEL_NAME = 'darts-scoreboard:celebration'

/** Safety-net auto-close delay in case the celebration video never loads or plays. */
export const CELEBRATION_FALLBACK_TIMEOUT_MS = 8000

/** Max-width class applied to the leaderboard column (header and table share this width). */
export const LEADERBOARD_MAX_WIDTH_CLASS = 'max-w-6xl'

/** Width of the sliding operator/players control panel on wide screens. */
export const CONTROL_PANEL_WIDTH_CLASS = 'sm:w-[440px]'

/** Max number of matches shown in the player search dropdown. */
export const PLAYER_SEARCH_RESULT_LIMIT = 8
