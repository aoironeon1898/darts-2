import { describe, expect, it } from 'vitest'
import {
  bestRound,
  bigHits,
  dartScore,
  getScoreTier,
  hasReachedRoundLimit,
  isRoundComplete,
  isValidDart,
  rankPlayers,
  roundScore,
  roundsCompleted,
  total,
} from './scoring'
import type { Dart, Player, Round } from '@/types'

function dart(segment: number, multiplier: 1 | 2 | 3 = 1): Dart {
  return { segment, multiplier }
}

function round(...darts: Dart[]): Round {
  return { darts }
}

function player(rounds: Round[], overrides: Partial<Player> = {}): Player {
  return {
    id: overrides.id ?? 'p1',
    name: overrides.name ?? 'Player',
    rounds,
    attempts: [],
    ...overrides,
  }
}

describe('isValidDart', () => {
  it('accepts a miss', () => {
    expect(isValidDart(dart(0, 1))).toBe(true)
  })

  it('rejects a miss with a multiplier other than 1', () => {
    expect(isValidDart(dart(0, 2))).toBe(false)
    expect(isValidDart(dart(0, 3))).toBe(false)
  })

  it('accepts single and double bull', () => {
    expect(isValidDart(dart(25, 1))).toBe(true)
    expect(isValidDart(dart(25, 2))).toBe(true)
  })

  it('rejects a triple bull', () => {
    expect(isValidDart(dart(25, 3))).toBe(false)
  })

  it('accepts segments 1-20 with any multiplier', () => {
    expect(isValidDart(dart(20, 3))).toBe(true)
    expect(isValidDart(dart(1, 1))).toBe(true)
  })

  it('rejects out-of-range segments', () => {
    expect(isValidDart(dart(21, 1))).toBe(false)
    expect(isValidDart(dart(-1, 1))).toBe(false)
    expect(isValidDart(dart(1.5, 1))).toBe(false)
  })

  it('rejects invalid multipliers', () => {
    expect(isValidDart({ segment: 10, multiplier: 4 as unknown as 1 })).toBe(false)
  })
})

describe('dartScore', () => {
  it('multiplies segment by multiplier', () => {
    expect(dartScore(dart(20, 3))).toBe(60)
    expect(dartScore(dart(5, 2))).toBe(10)
  })

  it('scores double bull as 50 and single bull as 25', () => {
    expect(dartScore(dart(25, 2))).toBe(50)
    expect(dartScore(dart(25, 1))).toBe(25)
  })

  it('scores a miss as 0', () => {
    expect(dartScore(dart(0, 1))).toBe(0)
  })

  it('scores an invalid dart (e.g. triple bull) as 0 instead of throwing', () => {
    expect(dartScore(dart(25, 3))).toBe(0)
  })
})

describe('roundScore', () => {
  it('sums three darts', () => {
    expect(roundScore(round(dart(20, 3), dart(19, 3), dart(25, 2)))).toBe(60 + 57 + 50)
  })

  it('handles a round with fewer than three darts', () => {
    expect(roundScore(round(dart(20, 1)))).toBe(20)
  })

  it('handles an empty round', () => {
    expect(roundScore(round())).toBe(0)
  })
})

describe('total', () => {
  it('sums all rounds', () => {
    const p = player([round(dart(20, 3)), round(dart(5, 1))])
    expect(total(p)).toBe(65)
  })

  it('is 0 for a player with no rounds', () => {
    expect(total(player([]))).toBe(0)
  })
})

describe('bestRound', () => {
  it('returns the highest round score', () => {
    const p = player([round(dart(20, 3)), round(dart(1, 1)), round(dart(20, 1), dart(20, 1))])
    expect(bestRound(p)).toBe(60)
  })

  it('is 0 when there are no rounds', () => {
    expect(bestRound(player([]))).toBe(0)
  })
})

describe('bigHits', () => {
  it('counts doubles and triples only', () => {
    const p = player([round(dart(20, 3), dart(5, 1), dart(25, 2)), round(dart(10, 2))])
    expect(bigHits(p)).toBe(3)
  })

  it('does not count misses', () => {
    const p = player([round(dart(0, 1), dart(20, 1))])
    expect(bigHits(p)).toBe(0)
  })
})

describe('roundsCompleted / isRoundComplete / hasReachedRoundLimit', () => {
  it('counts thrown rounds', () => {
    expect(roundsCompleted(player([round(dart(1)), round(dart(2))]))).toBe(2)
  })

  it('flags a full round at 3 darts', () => {
    expect(isRoundComplete(round(dart(1), dart(2), dart(3)))).toBe(true)
    expect(isRoundComplete(round(dart(1), dart(2)))).toBe(false)
  })

  it('flags the round limit', () => {
    const p = player([round(dart(1)), round(dart(2)), round(dart(3))])
    expect(hasReachedRoundLimit(p, 3)).toBe(true)
    expect(hasReachedRoundLimit(p, 4)).toBe(false)
  })
})

describe('rankPlayers', () => {
  it('ranks higher totals first', () => {
    const a = player([round(dart(20, 3))], { id: 'a', name: 'Alice' })
    const b = player([round(dart(5, 1))], { id: 'b', name: 'Bob' })
    const [first, second] = rankPlayers([b, a])
    expect(first?.id).toBe('a')
    expect(first?.rank).toBe(1)
    expect(second?.id).toBe('b')
    expect(second?.rank).toBe(2)
  })

  it('breaks a total tie using the higher best round', () => {
    // Alice: 40 + 20 = 60, best round 40. Bob: 30 + 30 = 60, best round 30.
    const alice = player([round(dart(20, 2)), round(dart(20, 1))], { id: 'alice', name: 'Alice' })
    const bob = player([round(dart(10, 3)), round(dart(10, 3))], { id: 'bob', name: 'Bob' })
    const ranked = rankPlayers([bob, alice])
    expect(ranked.find((p) => p.id === 'alice')?.rank).toBe(1)
    expect(ranked.find((p) => p.id === 'bob')?.rank).toBe(2)
  })

  it('breaks a total and best-round tie using the count of doubles/triples', () => {
    // Both total 120 with a best round of 60, but Alice hits more doubles/triples overall.
    const alice = player(
      [round(dart(20, 3)), round(dart(10, 2), dart(10, 2), dart(10, 2))],
      { id: 'alice', name: 'Alice' },
    )
    const bob = player([round(dart(20, 3)), round(dart(20, 1), dart(20, 1), dart(20, 1))], {
      id: 'bob',
      name: 'Bob',
    })
    const ranked = rankPlayers([bob, alice])
    expect(ranked.find((p) => p.id === 'alice')?.rank).toBe(1)
    expect(ranked.find((p) => p.id === 'bob')?.rank).toBe(2)
  })

  it('assigns a shared rank when every tie-break criterion matches (competition ranking)', () => {
    const alice = player([round(dart(20, 1))], { id: 'alice', name: 'Alice' })
    const bob = player([round(dart(20, 1))], { id: 'bob', name: 'Bob' })
    const carol = player([round(dart(19, 1))], { id: 'carol', name: 'Carol' })
    const dave = player([round(dart(1, 1))], { id: 'dave', name: 'Dave' })
    const ranked = rankPlayers([carol, dave, bob, alice])
    const byId = Object.fromEntries(ranked.map((p) => [p.id, p.rank]))
    expect(byId.alice).toBe(1)
    expect(byId.bob).toBe(1)
    expect(byId.carol).toBe(3)
    expect(byId.dave).toBe(4)
  })

  it('returns an empty list for no players', () => {
    expect(rankPlayers([])).toEqual([])
  })
})

describe('getScoreTier', () => {
  it('returns null below the lowest threshold', () => {
    expect(getScoreTier(0)).toBeNull()
    expect(getScoreTier(39)).toBeNull()
  })

  it('returns C, B, A, S at their respective boundaries', () => {
    expect(getScoreTier(40)).toBe('C')
    expect(getScoreTier(79)).toBe('C')
    expect(getScoreTier(80)).toBe('B')
    expect(getScoreTier(119)).toBe('B')
    expect(getScoreTier(120)).toBe('A')
    expect(getScoreTier(159)).toBe('A')
    expect(getScoreTier(160)).toBe('S')
    expect(getScoreTier(180)).toBe('S')
  })
})
