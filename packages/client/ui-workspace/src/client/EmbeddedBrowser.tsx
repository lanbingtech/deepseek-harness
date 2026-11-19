/** Reuse the complete native browser with occurrence-owned navigation. */
import type { FactoryComponentPropsOf } from '@deepseek-ai/dsh-client-ui-slots'
import type { WorkspaceBrowserInjected } from './contract/slots.ts'
import { createWorkspaceViewStore } from './stores.ts'
import { WorkspaceBrowser } from './rows/WorkspaceBrowser.tsx'
import { WorkspaceBrowserOccurrenceContext, type WorkspaceBrowserOccurrence } from './occurrence.ts'
export type { WorkspaceBrowserOccurrence } from './occurrence.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotFactoryMap {
    'workspace.browser': {
      scope: 'root'
      props: WorkspaceBrowserOccurrence
      store: () => ReturnType<typeof createWorkspaceViewStore>
      inject: WorkspaceBrowserInjected
      locale: 'workspace'
    }
  }
}

/** The store is fresh per occurrence; no main-sidebar preferences are changed. */
export function EmbeddedWorkspaceBrowser(props: FactoryComponentPropsOf<'workspace.browser'>) {
  return <WorkspaceBrowserOccurrenceContext.Provider value={props}>
    <WorkspaceBrowser {...props} wide={true} expandSidebar={() => {}} />
  </WorkspaceBrowserOccurrenceContext.Provider>
}
