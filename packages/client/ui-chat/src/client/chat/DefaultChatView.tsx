/** Default Conversation entry delegates to the reusable native Chat body. */
import { useMemo } from 'react'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { InjectFace, PropsRenderFactories, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'

import type { ChatContentInput, ChatStore, ChatViewInjected } from '../contract/slots.ts'

/**
 * Preserve the default Chat view, Session scroll restoration, and tool-inspector navigation.
 * @param props - Native Conversation navigation and legacy scroll memory.
 * @returns The native Chat content Factory with interactive defaults.
 */
export function DefaultChatView({ renderFactorySlot, inspectCall, chatScroll, useStore, actions }: ConvViewProps & PropsRenderFactories
  & PropsStore<ChatStore>
  & InjectFace<Pick<ChatViewInjected, 'chatScroll'>>) {
  const hookContext = useMemo<ChatContentInput['hookContext']>(() => ({ useStore, actions }), [useStore, actions])
  return renderFactorySlot('conversation.chat.content', { inspectCall, scrollMemory: chatScroll, hookContext })
}
