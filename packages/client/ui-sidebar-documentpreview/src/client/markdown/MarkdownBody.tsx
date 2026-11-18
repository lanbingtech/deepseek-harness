/** One retained Markdown renderer over the document owner's accumulated text. */
import { lazy, Suspense, useMemo } from 'react'
import type { ReactNode } from 'react'
import { MarkdownText, type MarkdownLabels, type MarkdownPathImages } from '@deepseek-ai/dsh-client-ui-primitives'
import type { FactoryComponentPropsOf, PropsLocale, PropsRenderFactories, PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from './contract.ts'
import type { DocumentPreviewProps } from '../document/contract.ts'
import { splitFrontmatter } from './frontmatter.ts'
import type { FrontmatterFieldsProps } from './frontmatter-fields.tsx'
import { markdownImageUrl } from './path-images.ts'
import type {} from './locales.ts'
import css from './MarkdownBody.module.css'

/** Show the verbatim frontmatter when the field-list chunk cannot load. */
function FrontmatterFallback({ fallback }: FrontmatterFieldsProps): ReactNode {
  return fallback
}

const FrontmatterFields = lazy(() => import('./frontmatter-fields.tsx').then(
  module => ({ default: module.FrontmatterFields }),
  // The failed chunk only removes the field layout; the body and verbatim metadata stay usable.
  () => ({ default: FrontmatterFallback }),
))

/** Standard document inputs and this implementation's locale. */
export type MarkdownBodyProps = DocumentPreviewProps & PropsLocale<'documentMarkdown'> & PropsRenderFactories & PropsRenderSlots<'document.markdown.presentation'>

/** Native content factory inputs; no file reads or toolbar state are owned here. */
export type MarkdownContentProps = Pick<FactoryComponentPropsOf<'document.markdown.content'>, 'text' | 'eof' | 'absolutePath' | 't'>

/**
 * Render one accumulated document; EOF completes the primitive's full parse.
 * A leading YAML frontmatter block renders as a field list instead of Markdown; its
 * verbatim source stands in while the field-list chunk loads or when it fails.
 * @param props - owner-loaded contents and localized primitive labels.
 * @returns Markdown content, or nothing for a non-text delivery.
 */
export function MarkdownBody({ content, resourceAddress, useResource, renderSlotChain, renderFactorySlot }: MarkdownBodyProps): ReactNode {
  const absolutePath = useResource<'file'>(resourceAddress).value?.absolutePath
  const text = content.kind === 'text' ? content.text : ''
  const split = useMemo(() => splitFrontmatter(text), [text])
  if (content.kind !== 'text') return null
  const eof = content.eof
  return (
    <div className={css.document} data-document-markdown>
      {renderSlotChain('document.markdown.presentation', { absolutePath, text, eof }, { fallback: <>
        {split === undefined ? null : <FrontmatterBox source={split.source} />}
        {renderFactorySlot('document.markdown.content', { text: split?.body ?? text, eof, absolutePath })}
      </> })}
    </div>
  )
}

/**
 * Render shared Markdown with native localization, streaming and local-image resolution.
 * @param props - source text, completion, Host path and native labels.
 * @returns native Markdown content.
 */
export function MarkdownContent({ text, eof, absolutePath, t }: MarkdownContentProps): ReactNode {
  const pathImages = useMemo<MarkdownPathImages>(() => ({
    resolve: value => markdownImageUrl(document.baseURI, absolutePath, value),
  }), [absolutePath])
  const copyLabel = t('code.copy')
  const copiedLabel = t('code.copied')
  const footnotes = t('footnotes')
  const codeLabel = t('codeBlock.title')
  const wrapLabel = t('codeBlock.wrap')
  const unwrapLabel = t('codeBlock.unwrap')
  const labels = useMemo<MarkdownLabels>(() => ({
    code: { copyLabel, copiedLabel, toolbarLabels: { codeLabel, wrapLabel, unwrapLabel } }, footnotes,
  }), [copyLabel, copiedLabel, footnotes, codeLabel, wrapLabel, unwrapLabel])
  return <MarkdownText text={text} streaming={!eof} labels={labels} pathImages={pathImages} />
}

/**
 * Frame one frontmatter block and choose its field list or verbatim source.
 * @param props - YAML between the frontmatter delimiters.
 * @returns the metadata box; it collapses when the document has no content.
 */
function FrontmatterBox({ source }: { source: string }): ReactNode {
  const verbatim = <pre className={css.frontmatterSource}>{source}</pre>
  return (
    <div className={css.frontmatter} data-document-frontmatter>
      <Suspense fallback={verbatim}><FrontmatterFields source={source} fallback={verbatim} /></Suspense>
    </div>
  )
}
