/** Navigation and membership owned by one embedded browser. */
import { createContext } from 'react'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceBrowserScopeSnapshot } from './browser-scope.ts'

export interface WorkspaceBrowserOccurrence {
  scope: WorkspaceBrowserScopeSnapshot
  workspaceIds?: readonly WorkspaceId[] | undefined
  selectedSessionId: SessionId | null
  onSelect: (id: SessionId) => void
  onNew?: ((workspaceId?: WorkspaceId) => void) | undefined
  /** Retry occurrence-owned membership resolution. */
  onRetry?: (() => void) | undefined
  onFork: (id: SessionId) => void
}

/** Plain callbacks only; all data subscriptions remain framework hooks. */
export const WorkspaceBrowserOccurrenceContext = createContext<WorkspaceBrowserOccurrence | undefined>(undefined)
