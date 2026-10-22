import { describe, expect, it } from 'vitest'
import {
  attemptLabel,
  bestTime,
  formatTime,
  hasReachedAttemptLimit,
  isValidAttempt,
  parseTime,
  rankTimedPlayers,
} from './timing'
import type { Player, TimedAttempt } from '@/types'

function attempt(ms: number | null): TimedAttempt {
  return { ms }
}

function player(times: (number | null)[], overrides: Partial<Player> = {}): Player {
  return {
    id: overrides.id ?? 'p1',
    name: overrides.name ?? 'Player',
    rounds: [],
    attempts: times.map(attempt),
    ...overrides,
  }
}

describe('isValidAttempt', () => {
  it('accepts a DNF and in-range whole milliseconds', () => {
    expect(isValidAttempt(attempt(null))).toBe(true)
    expect(isValidAttempt(attempt(0))).toBe(true)
    expect(isValidAttempt(attempt(83_450))).toBe(true)
  })

  it('rejects negative, fractional and out-of-range values', () => {
    expect(isValidAttempt(attempt(-1))).toBe(false)
    expect(isValidAttempt(attempt(1.5))).toBe(false)
    expect(isValidAttempt(attempt(100 * 60 * 1000))).toBe(false)
    expect(isValidAttempt(attempt(Number.NaN))).toBe(false)
  })
})

describe('parseTime', () => {
  it('parses plain seconds with optional decimals', () => {
    expect(parseTime('12')).toBe(12_000)
    expect(parseTime('12.3')).toBe(12_300)
    expect(parseTime('12.34')).toBe(12_340)
    expect(parseTime('12.345')).toBe(12_345)
    expect(parseTime('125.5')).toBe(125_500)
  })

  it('parses minutes and seconds', () => {
    expect(parseTime('1:23.45')).toBe(83_450)
    expect(parseTime('0:05')).toBe(5_000)
    expect(parseTime(' 2:00 ')).toBe(120_000)
  })

  it('rejects malformed input', () => {
    expect(parseTime('')).toBeNull()
    expect(parseTime('abc')).toBeNull()
    expect(parseTime('1:60')).toBeNull()
    expect(parseTime('1:5')).toBeNull()
    expect(parseTime('-3')).toBeNull()
    expect(parseTime('1.2345')).toBeNull()
    expect(parseTime('100:00')).toBeNull()
  })
})

describe('formatTime', () => {
  it('formats times under a minute as seconds', () => {
    expect(formatTime(5_000)).toBe('5.00')
    expect(formatTime(12_340)).toBe('12.34')
  })

  it('formats times of a minute or more with minutes', () => {
    expect(formatTime(83_450)).toBe('1:23.45')
    expect(formatTime(60_000)).toBe('1:00.00')
  })

  it('truncates rather than rounds hundredths', () => {
    expect(formatTime(12_349)).toBe('12.34')
  })

  it('round-trips with parseTime', () => {
    expect(parseTime(formatTime(83_450))).toBe(83_450)
  })
})

describe('attemptLabel', () => {
  it('labels DNFs and finished attempts', () => {
    expect(attemptLabel(attempt(null))).toBe('DNF')
    expect(attemptLabel(attempt(12_340))).toBe('12.34')
  })
})

describe('bestTime', () => {
  it('returns the fastest finished attempt, ignoring DNFs', () => {
    expect(bestTime(player([30_000, null, 25_000]))).toBe(25_000)
  })

  it('returns null with no finished attempts', () => {
    expect(bestTime(player([]))).toBeNull()
    expect(bestTime(player([null, null]))).toBeNull()
  })
})

describe('hasReachedAttemptLimit', () => {
  it('counts DNFs as used attempts', () => {
    expect(hasReachedAttemptLimit(player([10_000, null]), 2)).toBe(true)
    expect(hasReachedAttemptLimit(player([10_000]), 2)).toBe(false)
  })
})

describe('rankTimedPlayers', () => {
  it('ranks the fastest best time first', () => {
    const ranked = rankTimedPlayers([
      player([30_000], { id: 'slow', name: 'Slow' }),
      player([20_000], { id: 'fast', name: 'Fast' }),
    ])
    expect(ranked.map((p) => [p.id, p.rank])).toEqual([
      ['fast', 1],
      ['slow', 2],
    ])
    expect(ranked[0]?.bestTime).toBe(20_000)
  })

  it('breaks ties on the second-best time', () => {
    const ranked = rankTimedPlayers([
      player([20_000, 40_000], { id: 'a', name: 'A' }),
      player([20_000, 30_000], { id: 'b', name: 'B' }),
    ])
    expect(ranked.map((p) => p.id)).toEqual(['b', 'a'])
    expect(ranked.map((p) => p.rank)).toEqual([1, 2])
  })

  it('ranks a second finished time above a DNF', () => {
    const ranked = rankTimedPlayers([
      player([20_000, null], { id: 'a', name: 'A' }),
      player([20_000, 50_000], { id: 'b', name: 'B' }),
    ])
    expect(ranked.map((p) => p.id)).toEqual(['b', 'a'])
  })

  it('shares ranks on a full tie and skips the next rank', () => {
    const ranked = rankTimedPlayers([
      player([20_000], { id: 'a', name: 'A' }),
      player([20_000], { id: 'b', name: 'B' }),
      player([25_000], { id: 'c', name: 'C' }),
    ])
    expect(ranked.map((p) => p.rank)).toEqual([1, 1, 3])
  })

  it('puts players without a finished time last, sharing a rank', () => {
    const ranked = rankTimedPlayers([
      player([], { id: 'none', name: 'None' }),
      player([null], { id: 'dnf', name: 'Dnf' }),
      player([40_000], { id: 'done', name: 'Done' }),
    ])
    expect(ranked.map((p) => p.id)).toEqual(['done', 'dnf', 'none'])
    expect(ranked.map((p) => p.rank)).toEqual([1, 2, 2])
    expect(ranked[1]?.dnfCount).toBe(1)
    expect(ranked[1]?.bestTime).toBeNull()
  })
})
