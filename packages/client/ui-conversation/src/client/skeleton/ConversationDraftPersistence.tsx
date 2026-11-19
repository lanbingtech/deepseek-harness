/** Keeps draft persistence attached independently of the rendered Conversation View. */
import { useEffect } from 'react'
import type { ConversationDraftPersistenceProps } from '../contract/slots.ts'

/**
 * Attach the Session draft writer for this mounted Conversation occurrence.
 * @param props - Framework-bound Session input and shared persistence store.
 * @returns no visible content.
 */
export function ConversationDraftPersistence({
  inputActions, actions, bindDraftPersistence,
}: ConversationDraftPersistenceProps) {
  useEffect(() => {
    const unbind = bindDraftPersistence(actions.setDraft)
    inputActions.persistDraft()
    return unbind
  }, [inputActions, actions, bindDraftPersistence])
  return null
}
