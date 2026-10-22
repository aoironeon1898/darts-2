import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePlayersStore } from './players'

describe('players store: timed attempts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function storeWithPlayer() {
    const store = usePlayersStore()
    store.addPlayer('Alice')
    return { store, id: store.players[0]!.id }
  }

  it('starts new players with no attempts', () => {
    const { store } = storeWithPlayer()
    expect(store.players[0]?.attempts).toEqual([])
  })

  it('records attempts and DNFs up to the limit', () => {
    const { store, id } = storeWithPlayer()
    expect(store.submitAttempt(id, 12_340, 2).ok).toBe(true)
    expect(store.submitAttempt(id, null, 2).ok).toBe(true)
    expect(store.submitAttempt(id, 10_000, 2).ok).toBe(false)
    expect(store.players[0]?.attempts).toEqual([{ ms: 12_340 }, { ms: null }])
  })

  it('rejects invalid times', () => {
    const { store, id } = storeWithPlayer()
    expect(store.submitAttempt(id, -5, 3).ok).toBe(false)
    expect(store.players[0]?.attempts).toEqual([])
  })

  it('corrects and undoes attempts', () => {
    const { store, id } = storeWithPlayer()
    store.submitAttempt(id, 12_340, 3)
    store.submitAttempt(id, 15_000, 3)
    expect(store.updateAttempt(id, 0, 11_000).ok).toBe(true)
    expect(store.undoLastAttempt(id).ok).toBe(true)
    expect(store.players[0]?.attempts).toEqual([{ ms: 11_000 }])
    expect(store.updateAttempt(id, 5, 1_000).ok).toBe(false)
  })

  it('loads data saved before attempts existed', () => {
    const store = usePlayersStore()
    store.replaceAll([{ id: 'p1', name: 'Old', rounds: [] }])
    expect(store.players[0]?.attempts).toEqual([])
  })

  it('drops malformed attempts when loading', () => {
    const store = usePlayersStore()
    store.replaceAll([
      {
        id: 'p1',
        name: 'Mixed',
        rounds: [],
        attempts: [{ ms: 1_000 }, { ms: null }, { ms: 'fast' }, null, { ms: -1 }],
      },
    ])
    expect(store.players[0]?.attempts).toEqual([{ ms: 1_000 }, { ms: null }])
  })
})
