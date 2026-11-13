import { describe, expect, it } from 'vitest'
import { SidebarNavigation } from '../src/client/navigation.ts'

describe('sidebar navigation', () => {
  it('selects only live keyed slot entries and returns to conversation on removal', () => {
    const keys = new Set(['extension'])
    const navigation = new SidebarNavigation(key => keys.has(key))
    expect(navigation.state.getSnapshot()).toEqual({ view: null })
    navigation.retain()
    expect(() => navigation.select('missing')).toThrow('missing')
    navigation.select('extension')
    expect(navigation.state.getSnapshot()).toEqual({ view: 'extension' })
    const selected = navigation.state.getSnapshot()
    navigation.select('extension')
    navigation.retain()
    expect(navigation.state.getSnapshot()).toBe(selected)
    keys.clear()
    navigation.retain()
    expect(navigation.state.getSnapshot()).toEqual({ view: null })
    navigation.select(null)
  })
})
