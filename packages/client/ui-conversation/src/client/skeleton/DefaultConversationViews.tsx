import type { ConversationSessionSlotProps } from '../contract/slots.ts'
import { conversationPhase } from '../contract/snapshot.ts'
import { resolveActiveView } from '../view-selection.ts'

/**
 * Renders the selected Session View; the shared content owns layout and draft persistence.
 * @param props - Strict Session input/store, view ledger, and render shares.
 * @returns the selected View, or no content while the Session remains blank.
 */
export function DefaultConversationViews({
  view, useSession, useConversation, useConversationViews, useStore, actions,
  renderSlot, openView, useInspectCall,
}: ConversationSessionSlotProps) {
  const tabs = useConversationViews(value => value)
  const inspectCall = useInspectCall(value => value)
  const selectedId = useStore(s => s.view)
  const active = resolveActiveView(tabs, selectedId)
  const session = useSession(s => s)
  const conversation = useConversation(s => s)
  const viewRequest = useStore(s => s.viewRequest ?? null)

  if (session.blank && conversationPhase(session, conversation) === 'blank') return null
  const viewId = view ?? active?.id
  return (
    <>
      {viewId !== undefined && renderSlot('conversation.view', {
        inspectCall,
        viewRequest,
        openView,
        completeViewRequest: actions.completeViewRequest,
      }, { only: viewId })}
    </>
  )
}
