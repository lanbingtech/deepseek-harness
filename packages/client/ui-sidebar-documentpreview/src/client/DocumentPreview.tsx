/** File preview occurrences independent from the conversation Sidebar's selection. */
import { useEffect, useId, useMemo, useState } from 'react'
import type { FactoryComponentPropsOf, PropsRenderFactories } from '@deepseek-ai/dsh-client-ui-slots'
import type { SidebarRightTabInfo, UseSidebarRightTabInfo } from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { PaneId, TabId } from '@deepseek-ai/dsh-client-ui-dockkit'
import { sessionFileAddress } from '@deepseek-ai/dsh-util-workspace-path'
import { TextPreview } from './TextPreview.tsx'
import { hostFileOf } from './rpc.ts'

/** A caller-owned file address and optional existing Sidebar navigation context. */
export interface DocumentPreviewInput {
  readonly path: string
  readonly line?: number | undefined
  /** Existing framework-bound Sidebar reader; standalone callers omit it. */
  readonly hookContext?: UseSidebarRightTabInfo | undefined
  readonly onClose?: (() => void) | undefined
}

/**
 * Reuse the native document renderers with a view-owned read lifetime.
 * @param props - framework-injected readers, stores, and the requested file.
 * @returns the native document body; closing aborts all outstanding reads.
 */
export function DocumentPreview(props: FactoryComponentPropsOf<'document.preview'>) {
  return props.hookContext === undefined
    ? <StandaloneDocumentPreview {...props} />
    : <TextPreview {...props} useTabInfo={props.hookContext} />
}

function StandaloneDocumentPreview(props: FactoryComponentPropsOf<'document.preview'>) {
  const id = useId()
  const [lifetime, setLifetime] = useState<AbortController>()
  const requestedAddress = sessionFileAddress(props.sessionId, props.path)
  const [address, setAddress] = useState(requestedAddress)
  const [navigationRevision, setNavigationRevision] = useState(0)
  useEffect(() => { setAddress(requestedAddress) }, [requestedAddress])
  useEffect(() => { setNavigationRevision(previous => previous + 1) }, [address, props.line])
  useEffect(() => {
    const controller = new AbortController()
    setLifetime(controller)
    return () => { controller.abort() }
  }, [address])
  const info = useMemo<SidebarRightTabInfo | undefined>(() => lifetime === undefined ? undefined : ({
    sidebar: { expanded: true, fullscreen: false },
    panel: { id: id as PaneId },
    tab: {
      id: `${id}:${address}` as TabId, kind: 'text', contentId: address, title: address,
      visible: true, signal: lifetime.signal,
      navigation: { address, revision: navigationRevision, params: props.line === undefined ? undefined : { line: props.line } },
      actions: {
        // The document toolbar calls reload directly; there is no global command target in this view.
        bindCommands: () => () => {},
        openResource: (next) => { setAddress(next) },
        openTab: () => { throw new Error('Standalone document previews do not own page tabs') },
        close: () => { props.onClose?.() },
      },
    },
  }), [lifetime, id, address, navigationRevision, props.line, props.onClose])
  const useTabInfo = useMemo(() => () => {
    if (info === undefined) throw new Error('Document preview lifetime is not mounted')
    return info
  }, [info])
  return info === undefined ? null : <TextPreview {...props} useTabInfo={useTabInfo} />
}

/**
 * Adapt an existing Sidebar tab without changing its navigation or command lifetime.
 * @param props - the Sidebar's bound reader and the native Factory renderer.
 * @returns the same document preview used by standalone readers.
 */
export function SidebarDocumentPreview({ useTabInfo, renderFactorySlot }: PropsRenderFactories & { useTabInfo: UseSidebarRightTabInfo }) {
  const { tab } = useTabInfo()
  return renderFactorySlot('document.preview', { path: hostFileOf(tab.contentId).path, hookContext: useTabInfo })
}
