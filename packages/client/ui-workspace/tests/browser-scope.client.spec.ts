import { Context } from '@deepseek-ai/cordis'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { describe, expect, it } from 'vitest'
import { WorkspaceBrowserScopeService, type WorkspaceBrowserScopeSnapshot } from '../src/client/browser-scope.ts'

describe('native browser scope', () => {
  it('arbitrates by ascending priority then registration order and restores the previous source on fiber disposal', async () => {
    const ctx = new Context()
    new WorkspaceBrowserScopeService(ctx)
    const first = createSnapshotStore<WorkspaceBrowserScopeSnapshot>({ id: 'first', revision: 1, status: 'ready', memberSessionIds: [] })
    const second = createSnapshotStore<WorkspaceBrowserScopeSnapshot>({ id: 'second', revision: 1, status: 'loading' })
    const firstFiber = ctx.plugin({ apply(owner: Context) { owner.workspaceBrowserScope.contribute({ source: first }) } })
    await firstFiber.await()
    const secondFiber = ctx.plugin({ apply(owner: Context) { owner.workspaceBrowserScope.contribute({ source: second }) } })
    await secondFiber.await()
    expect(ctx.workspaceBrowserScope.state.getSnapshot()?.id).toBe('first')
    const higher = ctx.plugin({ apply(owner: Context) { owner.workspaceBrowserScope.contribute({ priority: -1, source: second }) } })
    await higher.await()
    expect(ctx.workspaceBrowserScope.state.getSnapshot()?.status).toBe('loading')
    second.set({ id: 'second', revision: 2, status: 'error', message: 'unavailable' })
    expect(ctx.workspaceBrowserScope.state.getSnapshot()?.status).toBe('error')
    await higher.dispose()
    expect(ctx.workspaceBrowserScope.state.getSnapshot()).toEqual(first.getSnapshot())
    await firstFiber.dispose()
    expect(ctx.workspaceBrowserScope.state.getSnapshot()).toEqual(second.getSnapshot())
    await secondFiber.dispose()
    expect(ctx.workspaceBrowserScope.state.getSnapshot()).toBeUndefined()
    second.set({ id: 'second', revision: 3, status: 'ready', memberSessionIds: undefined })
    expect(ctx.workspaceBrowserScope.state.getSnapshot()).toBeUndefined()
    await ctx.fiber.dispose()
  })
})
