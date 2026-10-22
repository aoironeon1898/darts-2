import { MAX_TIME_MS } from '@/config'
import type { Player, RankedTimedPlayer, TimedAttempt } from '@/types'

/** Whether a recorded attempt is usable: a DNF, or a whole number of ms in range. */
export function isValidAttempt(attempt: TimedAttempt): boolean {
  const { ms } = attempt
  if (ms === null) return true
  return Number.isInteger(ms) && ms >= 0 && ms <= MAX_TIME_MS
}

/**
 * Parses a typed time into milliseconds. Accepts "SS", "SS.f" (up to 3
 * decimals) and "M:SS" / "M:SS.f". Returns `null` for anything else,
 * including seconds of 60 or more when minutes are given.
 */
export function parseTime(input: string): number | null {
  const match = /^(?:(\d{1,2}):)?(\d{1,4})(?:\.(\d{1,3}))?$/.exec(input.trim())
  if (!match) return null
  const [, minutesPart, secondsPart, fractionPart] = match
  const minutes = minutesPart === undefined ? 0 : Number(minutesPart)
  const seconds = Number(secondsPart)
  if (minutesPart !== undefined && (seconds >= 60 || secondsPart!.length !== 2)) return null
  const fractionMs = fractionPart === undefined ? 0 : Number(fractionPart.padEnd(3, '0'))
  const ms = (minutes * 60 + seconds) * 1000 + fractionMs
  return ms <= MAX_TIME_MS ? ms : null
}

/**
 * Formats milliseconds as "S.cc" under a minute and "M:SS.cc" above it.
 * Hundredths are truncated, not rounded, as stopwatches do.
 */
export function formatTime(ms: number): string {
  const centis = Math.floor(ms / 10)
  const minutes = Math.floor(centis / 6000)
  const seconds = Math.floor((centis % 6000) / 100)
  const hundredths = String(centis % 100).padStart(2, '0')
  if (minutes === 0) return `${seconds}.${hundredths}`
  return `${minutes}:${String(seconds).padStart(2, '0')}.${hundredths}`
}

/** Display label for an attempt: its formatted time, or "DNF". */
export function attemptLabel(attempt: TimedAttempt): string {
  return attempt.ms === null ? 'DNF' : formatTime(attempt.ms)
}

/** A player's finished times, fastest first. Invalid attempts are ignored. */
function finishedTimes(player: Pick<Player, 'attempts'>): number[] {
  return player.attempts
    .filter((a): a is { ms: number } => a.ms !== null && isValidAttempt(a))
    .map((a) => a.ms)
    .sort((a, b) => a - b)
}

/** The fastest finished attempt, or `null` if the player has none. */
export function bestTime(player: Pick<Player, 'attempts'>): number | null {
  return finishedTimes(player)[0] ?? null
}

/** Number of attempts a player has used (finished or DNF). */
export function attemptsCompleted(player: Pick<Player, 'attempts'>): number {
  return player.attempts.length
}

/** Whether a player has used every attempt allowed. */
export function hasReachedAttemptLimit(
  player: Pick<Player, 'attempts'>,
  attemptsPerPlayer: number,
): boolean {
  return player.attempts.length >= attemptsPerPlayer
}

/**
 * Compares two players' sorted finished times: the faster best time wins,
 * then the faster second-best, and so on. Having a time beats having none.
 */
function compareTimes(a: number[], b: number[]): number {
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i++) {
    const ta = a[i] ?? Infinity
    const tb = b[i] ?? Infinity
    if (ta !== tb) return ta < tb ? -1 : 1
  }
  return 0
}

/**
 * Ranks players for the timed game using "competition ranking" (1, 2, 2, 4).
 *
 * Tie-break order: (1) faster best time, (2) faster second-best time, and so
 * on through every finished attempt, (3) shared rank if still tied. Players
 * with no finished attempt sort last and share the last rank.
 */
export function rankTimedPlayers(players: Player[]): RankedTimedPlayer[] {
  const withStats = players.map((player) => ({
    player,
    times: finishedTimes(player),
  }))

  withStats.sort((a, b) => {
    const cmp = compareTimes(a.times, b.times)
    if (cmp !== 0) return cmp
    return a.player.name.localeCompare(b.player.name)
  })

  const ranked: RankedTimedPlayer[] = []
  withStats.forEach((entry, index) => {
    const previous = withStats[index - 1]
    const tiedWithPrevious =
      previous !== undefined && compareTimes(previous.times, entry.times) === 0
    const rank = tiedWithPrevious ? (ranked[index - 1]?.rank ?? index + 1) : index + 1
    ranked.push({
      ...entry.player,
      bestTime: entry.times[0] ?? null,
      attemptsCompleted: attemptsCompleted(entry.player),
      dnfCount: entry.player.attempts.filter((a) => a.ms === null).length,
      rank,
    })
  })

  return ranked
}
