import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from './settings'

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('defaults to one timed attempt and both leaderboards', () => {
    const store = useSettingsStore()
    expect(store.attemptsPerPlayer).toBe(1)
    expect(store.leaderboardView).toBe('both')
  })

  it('loads a valid leaderboard view and ignores an unknown one', () => {
    const store = useSettingsStore()
    store.replaceAll({ leaderboardView: 'timed' })
    expect(store.leaderboardView).toBe('timed')
    store.replaceAll({ leaderboardView: 'sideways' as never })
    expect(store.leaderboardView).toBe('timed')
  })

  it('keeps defaults for settings saved before the timed game existed', () => {
    const store = useSettingsStore()
    store.replaceAll({ roundsPerPlayer: 5, competitionTitle: 'Old Cup' })
    expect(store.attemptsPerPlayer).toBe(1)
    expect(store.leaderboardView).toBe('both')
  })
})
