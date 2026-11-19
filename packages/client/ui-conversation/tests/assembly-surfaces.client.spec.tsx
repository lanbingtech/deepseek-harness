// @vitest-environment jsdom
/** Conversation assembly acceptance independent of Tool presentation. */
import './control-row-dom.ts'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import type { ISession } from '@deepseek-ai/dsh-api-session-controller/client'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import {
  RemoteError, SlotTestRuntime, usePinnedBrowserLanguages, stubConfigForm,
} from '@deepseek-ai/dsh-client-test-runtime'
import type { ConversationHeroProps, ConversationHeroControlsProps } from '../src/client/contract/slots.ts'
import css from '../src/client/skeleton/ConversationRoot.module.css'
import { InputHub } from '../src/client/input/hub.ts'
import { apply, inject, type EmptyWorkspaceOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceId } from '@deepseek-ai/dsh-workspace/types'

// jsdom implements no Range geometry (Lexical's scroll-into-view measures the
// caret with one once the surface is genuinely contenteditable).
Range.prototype.getBoundingClientRect = () => ({
  top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}),
})


usePinnedBrowserLanguages('zh-CN')


declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'conversation.test.embedded': { kind: 'single'; scope: 'session' }
  }
}

const SID = 's1' as SessionId

/** jsdom has no ResizeObserver; the composer seat publishes its height through one. */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

type AppRootProps = PropsRenderSlots<'main'>
function AppRoot({ renderSlot }: AppRootProps) {
  return <>{renderSlot('main', {}, { entryKey: 'conversation' })}</>
}

const LAYOUT_CHILDREN = {
  'main': { kind: 'keyed', scope: 'root' },
} as const

function provideWorkspaceNavigation(runtime: SlotTestRuntime): (id: SessionId) => void {
  let mainReference: ReturnType<typeof runtime.sessions.retain> | undefined
  const openSession = (id: SessionId): void => {
    const next = runtime.sessions.retain(id, { source: 'mainView' })
    mainReference?.release()
    mainReference = next
  }
  runtime.ctx.provide('uiWorkspace', {
    openWorkspace: vi.fn(async (_workspaceId: WorkspaceId, beforeOpen: (id: SessionId) => void) => {
      beforeOpen(SID)
      openSession(SID)
    }),
    openSession,
  } as never)
  return openSession
}

function WorkspaceProbe({ open }: EmptyWorkspaceOwnerProps) {
  const [count, setCount] = useState(0)
  return (
    <button data-testid="workspace-probe" onClick={() => { setCount(value => value + 1) }}>
      {String(open)}:{count}
    </button>
  )
}

function inputShell(runtime: SlotTestRuntime) {
  const input = runtime.ctx.get('conversation')?.input
  if (!(input instanceof InputHub)) throw new Error('Conversation did not install its input hub')
  return input.shell(SID)
}

async function bench(opts?: { blank?: boolean }) {
  const runtime = await SlotTestRuntime.create()
  const openSession = provideWorkspaceNavigation(runtime)
  runtime.ctx.provide('configForms', { developerTools: { enabled: createSnapshotStore(true) }, get: () => stubConfigForm().scope } as never)
  const locale = new LocaleRuntime(runtime.ctx)
  runtime.ctx.provide('locale', locale)
  runtime.slots.installLocale(locale)
  await runtime.sessions.add({
    id: SID,
    summary: { title: 'S', displayTitle: 'S', cwd: '/proj' },
    ...(opts?.blank === true ? { snapshot: { blank: true } } : {}),
    session: {
      loadOlder: vi.fn<ISession['loadOlder']>(),
      prompt: vi.fn<ISession['prompt']>(async () => ({ ok: true, value: { accepted: true } })),
    },
  })
  openSession(SID)
  await runtime.root.declare(LAYOUT_CHILDREN, AppRoot)
  await runtime.mount({ inject: [...inject], apply })
  return runtime
}

describe('resident composer', () => {
  it('renders the locked view state while no session exists at all', async () => {
    const runtime = await SlotTestRuntime.create()
    provideWorkspaceNavigation(runtime)
    runtime.ctx.provide('configForms', { developerTools: { enabled: createSnapshotStore(true) }, get: () => stubConfigForm().scope } as never)
    const locale = new LocaleRuntime(runtime.ctx)
    runtime.ctx.provide('locale', locale)
    runtime.slots.installLocale(locale)
    await runtime.root.declare(LAYOUT_CHILDREN, AppRoot)
    await runtime.mount({ inject: [...inject], apply })
    runtime.slots.register({ name: 'conversation.hero.workspace' }, WorkspaceProbe)
    const view = runtime.renderRoot()
    const textarea = view.container.querySelector<HTMLDivElement>('[data-composer-input]')
    expect(textarea).not.toBeNull()
    expect(textarea!.getAttribute('aria-disabled')).not.toBe('true')
    expect(textarea!.getAttribute('contenteditable')).not.toBe('true')
    expect(textarea!.getAttribute('aria-haspopup')).toBe('menu')
    expect(view.getByTestId('workspace-probe').textContent).toBe('false:0')
    fireEvent.click(textarea!)
    expect(view.getByTestId('workspace-probe').textContent).toBe('true:0')
    expect(textarea!.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(view.getByRole('button', { name: '选择工作区' }))
    fireEvent.keyDown(textarea!, { key: 'Enter' })
    expect(view.getByTestId('workspace-probe').textContent).toBe('true:0')
    expect(view.getByRole('button', { name: '选择工作区' })).toBeTruthy()
    await runtime.dispose()
  })

  it('keeps the complete Hero tree mounted when the first Workspace session appears', async () => {
    const runtime = await SlotTestRuntime.create()
    const openSession = provideWorkspaceNavigation(runtime)
    runtime.ctx.provide('configForms', { developerTools: { enabled: createSnapshotStore(true) }, get: () => stubConfigForm().scope } as never)
    const locale = new LocaleRuntime(runtime.ctx)
    runtime.ctx.provide('locale', locale)
    runtime.slots.installLocale(locale)
    await runtime.workspaces.update((draft) => {
      draft.items = [{ workspaceId: 'w1', title: 'Proj', path: '/proj', sessionIds: [SID] }] as never
    })
    await runtime.root.declare(LAYOUT_CHILDREN, AppRoot)
    await runtime.mount({ inject: [...inject], apply })
    runtime.slots.register({ name: 'conversation.hero.workspace' }, WorkspaceProbe)
    const view = runtime.renderRoot()

    const root = view.container.querySelector('[data-phase="hero"]')!
    const scrollBody = view.container.querySelector('[data-conversation-scroll]')!
    const composerSeat = view.container.querySelector('[data-composer-seat]')!
    const textarea = view.container.querySelector<HTMLDivElement>('[data-composer-input]')!
    const workspaceChip = view.getByRole('button', { name: '选择工作区' })
    const workspaceProbe = view.getByTestId('workspace-probe')
    expect(textarea.getAttribute('aria-disabled')).not.toBe('true')
    expect(textarea.getAttribute('contenteditable')).not.toBe('true')

    fireEvent.click(workspaceChip)
    fireEvent.click(workspaceProbe)
    expect(workspaceProbe.textContent).toBe('true:1')

    await runtime.sessions.add({
      id: SID,
      summary: { title: 'S', displayTitle: 'S', cwd: '/proj', blank: true },
      snapshot: { blank: true },
    })
    openSession(SID)
    await runtime.flush()

    expect(view.container.querySelector('[data-phase="hero"]')).toBe(root)
    expect(view.container.querySelector('[data-conversation-scroll]')).toBe(scrollBody)
    expect(view.container.querySelector('[data-composer-seat]')).toBe(composerSeat)
    expect(view.container.querySelector<HTMLDivElement>('[data-composer-input]')).toBe(textarea)
    expect(view.getByRole('button', { name: '选择工作区' })).toBe(workspaceChip)
    expect(view.getByTestId('workspace-probe')).toBe(workspaceProbe)
    expect(workspaceProbe.textContent).toBe('true:1')
    expect(textarea.getAttribute('aria-disabled')).not.toBe('true')
    expect(textarea.getAttribute('contenteditable')).toBe('true')
    await runtime.dispose()
  })

  it('the textarea survives the blank→active conversion as the same DOM node', async () => {
    const runtime = await bench({ blank: true })
    await runtime.workspaces.update((draft) => {
      draft.items = [{ workspaceId: 'w1', title: 'Proj', path: '/proj', sessionIds: [SID] }] as never
    })
    const view = runtime.renderRoot()
    const hero = view.container.querySelector<HTMLDivElement>('[data-composer-input]')
    expect(hero).not.toBeNull()
    expect(hero!.getAttribute('aria-disabled')).not.toBe('true')

    await runtime.sessions.updateSessionSnapshot(SID, (draft) => {
      draft.blank = false
    })
    expect(view.container.querySelector<HTMLDivElement>('[data-composer-input]')).toBe(hero)
    await runtime.dispose()
  })
})

describe('prompt rejection through the assembled composer', () => {
  it('renders the promptError alert strip and keeps the draft in the machine', async () => {
    const runtime = await SlotTestRuntime.create()
    const openSession = provideWorkspaceNavigation(runtime)
    runtime.ctx.provide('configForms', { developerTools: { enabled: createSnapshotStore(true) }, get: () => stubConfigForm().scope } as never)
    const locale = new LocaleRuntime(runtime.ctx)
    runtime.ctx.provide('locale', locale)
    runtime.slots.installLocale(locale)
    const prompt = vi.fn<ISession['prompt']>(async () => ({
      ok: false,
      error: new RemoteError('session/agent-busy', 'prompt rejected before acceptance', { reason: 'busy' }),
    }))
    await runtime.sessions.add({
      id: SID,
      summary: { title: 'S', displayTitle: 'S', cwd: '/proj' },
      session: { prompt, loadOlder: vi.fn<ISession['loadOlder']>() },
    })
    openSession(SID)
    await runtime.root.declare(LAYOUT_CHILDREN, AppRoot)
    await runtime.mount({ inject: [...inject], apply })
    const view = runtime.renderRoot()

    const composer = view.container.querySelector<HTMLDivElement>('[data-composer-input]')!
    // Write through the assembled input resolver (contenteditable change
    // events carry no value; the resolver is the public draft write path).
    const shell = inputShell(runtime)
    act(() => { shell.setDraft('do not lose this') })
    fireEvent.keyDown(composer, { key: 'Enter' })
    await waitFor(() => { expect(prompt).toHaveBeenCalledOnce() })

    await runtime.sessions.updateSessionSnapshot(SID, (draft) => {
      draft.promptError = {
        op: 'send',
        error: new RemoteError('session/agent-busy', 'prompt rejected before acceptance', { reason: 'busy' }),
      }
    })
    const alert = await view.findByRole('alert')
    expect(alert.textContent).toContain('prompt rejected before acceptance (session/agent-busy)')
    await waitFor(() => {
      expect(shell.snapshot.draft).toBe('do not lose this')
    })
    await runtime.dispose()
  })
})

describe('title projection across assembled surfaces', () => {
  it('one summary update re-labels the current-session crumb', async () => {
    const runtime = await bench()
    const view = runtime.renderRoot()
    const hierarchy = view.getByRole('navigation', { name: '会话层级' })
    expect(within(hierarchy).getByText('S').tagName).toBe('SPAN')

    await runtime.sessions.updateSummary(SID, { displayTitle: '修订标题', title: '修订标题' })
    await waitFor(() => {
      expect(within(hierarchy).getByText('修订标题').tagName).toBe('SPAN')
    })
    expect(within(hierarchy).queryByText('S')).toBeNull()
    await runtime.dispose()
  })
})

function EmbeddedWelcome(_props: ConversationHeroProps) {
  return <h2>Scoped welcome</h2>
}

function EmbeddedControls(_props: ConversationHeroControlsProps) {
  return null
}

function EmbeddedView() {
  return <article data-testid="embedded-transcript">Scoped transcript</article>
}

async function embeddedBench(blank: boolean, savedDraft?: string, withMain = false) {
  const runtime = await SlotTestRuntime.create()
  if (savedDraft !== undefined) localStorage.setItem(`dsh.conversation.${SID}`, savedDraft)
  provideWorkspaceNavigation(runtime)
  runtime.ctx.provide('configForms', { developerTools: { enabled: createSnapshotStore(true) }, get: () => stubConfigForm().scope } as never)
  const locale = new LocaleRuntime(runtime.ctx)
  runtime.ctx.provide('locale', locale)
  runtime.slots.installLocale(locale)
  await runtime.sessions.add({ id: SID, snapshot: { blank } })
  const reference = runtime.sessions.retainFor(runtime.ctx, SID)
  let setMounted: ((mounted: boolean) => void) | undefined
  await runtime.root.declare({ ...LAYOUT_CHILDREN, 'conversation.test.embedded': { kind: 'single', scope: 'session' } }, function EmbeddedRoot(props) {
    const [mounted, updateMounted] = useState(true)
    setMounted = updateMounted
    return <props.SessionProvider session={reference}>
      {withMain && <section data-testid="main-occurrence">
        {props.renderFactorySlot('conversation.content', {
          variant: 'main', phase: blank ? 'hero' : 'active', hero: blank, workspaceRequired: false,
        })}
      </section>}
      {mounted && props.renderFactorySlot('conversation.content', {
        variant: 'embedded', phase: blank ? 'hero' : 'active', hero: blank,
        workspaceRequired: false, placeholder: 'Scoped input',
      }, { slots: { views: EmbeddedView, hero: EmbeddedWelcome, heroControls: EmbeddedControls } })}
    </props.SessionProvider>
  })
  await runtime.mount({ inject: [...inject], apply })
  return { runtime, setMounted: (mounted: boolean) => { act(() => { setMounted?.(mounted) }) } }
}

describe('native Conversation occurrences', () => {
  it('keeps embedded blank input editable with local welcome and controls', async () => {
    const { runtime } = await embeddedBench(true)
    try {
      const view = runtime.renderRoot()
      expect(view.getByRole('heading', { name: 'Scoped welcome' })).toBeTruthy()
      expect(view.queryByRole('button', { name: /workspace/i })).toBeNull()
      expect(view.container.querySelector('[data-composer-input]')?.getAttribute('contenteditable')).toBe('true')
      expect(view.getByRole('textbox', { name: 'Scoped input' })).toBeTruthy()
    } finally {
      await runtime.dispose()
    }
  })

  it('keeps the main draft writer after a second occurrence of its Session unmounts', async () => {
    const { runtime, setMounted } = await embeddedBench(false, undefined, true)
    try {
      const view = runtime.renderRoot()
      expect(view.container.querySelectorAll('[data-conversation-content]')).toHaveLength(2)
      const shell = inputShell(runtime)
      act(() => { shell.setDraft('shared before close') })
      setMounted(false)
      expect(view.container.querySelectorAll('[data-conversation-content]')).toHaveLength(1)
      expect(view.getByTestId('main-occurrence')).toBeTruthy()
      act(() => { shell.setDraft('saved after embedded close') })
      await waitFor(() => {
        const persisted: unknown = JSON.parse(localStorage.getItem(`dsh.conversation.${SID}`) ?? '{}')
        expect(persisted).toMatchObject({ draft: { text: 'saved after embedded close', references: [] } })
      })
    } finally {
      await runtime.dispose()
    }
  })

  it('owns transcript geometry and persists custom-view drafts through unmount and a cold reopen', async () => {
    const { runtime, setMounted } = await embeddedBench(false)
    let saved: string | null = null
    try {
      const view = runtime.renderRoot()
      const transcript = view.getByTestId('embedded-transcript')
      expect(transcript.closest(`.${css.viewArea}`)?.parentElement).toBe(view.container.querySelector('[data-conversation-scroll]'))
      const shell = inputShell(runtime)
      act(() => { shell.setDraft('embedded saved draft') })
      await waitFor(() => {
        const persisted: unknown = JSON.parse(localStorage.getItem(`dsh.conversation.${SID}`) ?? '{}')
        expect(persisted).toMatchObject({ draft: { text: 'embedded saved draft', references: [] } })
      })
      setMounted(false)
      setMounted(true)
      expect(view.container.querySelector('[data-composer-input]')?.textContent).toBe('embedded saved draft')
      saved = localStorage.getItem(`dsh.conversation.${SID}`)
    } finally {
      await runtime.dispose()
    }
    expect(saved).not.toBeNull()
    // The runtime clears storage during disposal; replay the saved browser value into a fresh runtime.
    const reopened = await embeddedBench(false, saved!)
    try {
      const view = reopened.runtime.renderRoot()
      expect(view.container.querySelector('[data-composer-input]')?.textContent).toBe('embedded saved draft')
    } finally {
      await reopened.runtime.dispose()
    }
  })
})
