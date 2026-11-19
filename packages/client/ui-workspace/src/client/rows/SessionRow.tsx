/** The native Session row, reusable without changing the main workspace selection. */
import type { ComponentProps } from 'react'
import type { FactoryComponentPropsOf, PropsRenderFactories } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionNode } from '../tree.ts'
import type { menuOpenStateFactory, WorkspaceBrowserInjected } from '../contract/slots.ts'
import { sessionNode } from '../tree.ts'
import { SessionNodeItem } from './Rows.tsx'

/** Owner data for one native row; callbacks belong to this rendered occurrence. */
export interface NativeSessionRowOwnerProps {
  sessionId: SessionId
  selectedSessionId: SessionId | null | undefined
  onSelect: (sessionId: SessionId) => void
  /** Override branching for an embedded pane. Omission uses native main-view branching. */
  onFork?: ((sessionId: SessionId) => void) | undefined
  /** False omits ambient decorations while retaining the Session's genuine status. */
  showDecorations?: boolean | undefined
  now: number
  onReveal?: (() => void) | undefined
  drag?: ComponentProps<typeof SessionNodeItem>['drag']
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotFactoryMap {
    /** Exact workspace Session row with caller-owned navigation. */
    'workspace.session-row': {
      scope: 'root'
      props: NativeSessionRowOwnerProps
      locale: 'workspace'
      inject: NativeSessionRowInjected
      children: {
        'sidebar.workspaces.session.menu.item': {
          kind: 'list'
          scope: 'root'
          inject: { hooks: { menuOpenState: typeof menuOpenStateFactory; shortcuts: WorkspaceBrowserInjected['hooks']['shortcuts'] } }
        }
        'sidebar.workspaces.session.row.action': { kind: 'list'; scope: 'root' }
        'sidebar.session.row.leading': { kind: 'list'; scope: 'root' }
        'sidebar.session.row.hover': { kind: 'list'; scope: 'root' }
      }
    }
  }
}

/** Injected rename action keeps the shipped native dialog. */
export type NativeSessionRowInjected = {
  requestSessionRename: (sessionId: SessionId, title: string) => void
  notifyArchivedNotOpenable: () => void
}

/**
 * Resolve genuine Session, interaction, subagent, pin and archive state through native hooks.
 * @param props - occurrence navigation and framework-bound state.
 * @returns the same row used by the main sidebar, or nothing after removal.
 */
export function NativeSessionRow(props: FactoryComponentPropsOf<'workspace.session-row'>) {
  const list = props.useSessions(value => value)
  const statuses = props.useSessionStatus(value => value)
  const workspaces = props.useWorkspaces(value => value)
  const summary = list.byId[props.sessionId]
  if (summary === undefined) return null
  const node: SessionNode = sessionNode(
    summary, list, statuses, new Set(workspaces.pinnedSessionIds), new Set(workspaces.archivedSessionIds),
  )
  return <SessionNodeItem node={node} currentId={props.selectedSessionId ?? undefined} now={props.now}
    onOpen={(id) => { if (node.archived) props.notifyArchivedNotOpenable(); else props.onSelect(id) }}
    onRenameRequest={props.requestSessionRename} renderSlot={props.renderSlot}
    onFork={props.onFork} showDecorations={props.showDecorations}
    onReveal={props.onReveal} drag={props.drag} t={props.t} />
}

/**
 * Preserve the browser's row call sites while routing their rendering through the factory.
 * @param props - native browser row data and factory renderer.
 * @returns one native factory occurrence.
 */
export function SessionRowOutlet({ node, currentId, onOpen, now, onReveal, drag, renderFactorySlot }: Omit<ComponentProps<typeof SessionNodeItem>, 'renderSlot'> & PropsRenderFactories) {
  return renderFactorySlot('workspace.session-row', { sessionId: node.id, selectedSessionId: node.id === currentId ? node.id : undefined, onSelect: onOpen, now, onReveal, drag })
}
