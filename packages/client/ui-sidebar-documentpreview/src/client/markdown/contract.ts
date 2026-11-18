/** Domain-owned Markdown presentation over the native reader and Markdown primitive. */
import type { PropsRenderFactories, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Domain presentations may claim known files; other Markdown keeps its native presentation. */
    'document.markdown.presentation': {
      kind: 'chain'
      scope: 'session'
      owner: {
        /** Host path, when resource metadata is available. */
        absolutePath: string | undefined
        /** Accumulated source text, including authored frontmatter. */
        text: string
        /** Whether the complete source has arrived. */
        eof: boolean
      }
    }
  }
  interface SlotFactoryMap {
    /** Native Markdown content shared by default and domain presentations. */
    'document.markdown.content': {
      scope: 'session'
      locale: 'documentMarkdown'
      props: { text: string; eof: boolean; absolutePath: string | undefined }
    }
  }
}

/** Framework-bound owner inputs for a registered domain presentation. */
export type MarkdownPresentationProps = PropsRuntime<'document.markdown.presentation'> & PropsRenderFactories
