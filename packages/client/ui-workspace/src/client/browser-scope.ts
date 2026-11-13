/** Readonly membership projection contributed to the native Workspace browser. */
import { Service, type Context } from '@deepseek-ai/cordis'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** A scope never interprets unresolved membership as unrestricted. */
export type WorkspaceBrowserScopeSnapshot = {
  readonly id: string
  readonly revision: string | number
} & (
  | { readonly status: 'ready'; readonly memberSessionIds: readonly SessionId[] | undefined }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
)

/** One effect-owned observable; lower numeric priority wins, with earlier registration breaking ties. */
export interface WorkspaceBrowserScopeContribution {
  readonly priority?: number
  readonly source: HostObservable<WorkspaceBrowserScopeSnapshot>
}

/** Generic projection service; no contribution preserves the native unrestricted browser. */
export interface WorkspaceBrowserScope {
  readonly state: HostObservable<WorkspaceBrowserScopeSnapshot | undefined>
  /** @param contribution - caller-owned observable. @returns effect-owned removal callback. */
  contribute(contribution: WorkspaceBrowserScopeContribution): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Readonly browsing projection, independent of navigation or Session creation. */
    workspaceBrowserScope: WorkspaceBrowserScope
  }
}

/** Cordis owns registrations and unsubscribes them with the contributing fiber. */
export class WorkspaceBrowserScopeService extends Service implements WorkspaceBrowserScope {
  private readonly snapshot = createSnapshotStore<WorkspaceBrowserScopeSnapshot | undefined>(undefined)
  readonly state: WorkspaceBrowserScope['state'] = this.snapshot
  private readonly entries: WorkspaceBrowserScopeContribution[] = []

  /** @param ctx - owner context. */
  constructor(ctx: Context) {
    super(ctx, 'workspaceBrowserScope')
  }

  contribute(contribution: WorkspaceBrowserScopeContribution): () => void {
    return this.ctx.effect(() => {
      this.entries.push(contribution)
      const publish = (): void => {
        const winner = this.entries.reduce<WorkspaceBrowserScopeContribution | undefined>(
          (current, candidate) => current === undefined || (candidate.priority ?? 0) < (current.priority ?? 0)
            ? candidate : current, undefined,
        )
        this.snapshot.set(winner?.source.getSnapshot())
      }
      const stop = contribution.source.subscribe(publish)
      publish()
      return () => {
        stop()
        this.entries.splice(this.entries.indexOf(contribution), 1)
        publish()
      }
    }, 'ui-workspace: browser scope')
  }
}
