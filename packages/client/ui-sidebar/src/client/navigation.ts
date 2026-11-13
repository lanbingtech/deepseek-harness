import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'

/** Current navigation view; null selects the original conversation browser. */
export interface SidebarNavigationState { view: string | null }

/** Generic navigation face provided by the native sidebar. */
export interface ISidebarNavigation {
  /** Bare observable bound to selector hooks by the renderer. */
  readonly state: ObservableSnapshot<SidebarNavigationState>
  /** Select a live keyed navigation contribution, or null for conversation.
   * @param view - Key from sidebar.navigation.view, or null.
   */
  select(view: string | null): void
}

declare module '@deepseek-ai/cordis' {
  interface Context { sidebarNavigation: ISidebarNavigation }
}

/** Internal controller; availability belongs exclusively to the slot ledger. */
export class SidebarNavigation implements ISidebarNavigation {
  readonly state = createSnapshotStore<SidebarNavigationState>({ view: null })
  constructor(private readonly available: (view: string) => boolean) {}
  select(view: string | null): void {
    if (view !== null && !this.available(view)) throw new Error(`Unknown sidebar navigation view: ${view}`)
    if (view !== this.state.getSnapshot().view) this.state.set({ view })
  }
  /** Reconcile the selected view after a slot ledger change. */
  retain(): void {
    const { view } = this.state.getSnapshot()
    if (view !== null && !this.available(view)) this.select(null)
  }
}
