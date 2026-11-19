/** Shared native New Session control; callers own its action and availability. */
import clsx from 'clsx'
import { IconNewChatOutlineMedium, IconNewChatOutlineRegular, ShortcutKeys, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ShortcutCatalogEntry } from '@deepseek-ai/dsh-client-shortcuts/client'
import css from './SidebarRoot.module.css'

/** Render the original sidebar action in either a shell or an embedded surface.
 * @param props - Localized labels, geometry, and occurrence-owned action.
 * @returns The native New Session button.
 */
export function NewSessionAction({ onNew, label, text, wide = true, windowsTitlebar = false, captionTooltipSide = 'right', shortcut, disabled, busy }: {
  onNew: () => void
  label: string
  text: string
  wide?: boolean
  windowsTitlebar?: boolean
  captionTooltipSide?: 'bottom' | 'right'
  shortcut?: ShortcutCatalogEntry | undefined
  disabled?: boolean | undefined
  busy?: boolean | undefined
}) {
  return (
    <Tooltip label={label} shortcutKeys={shortcut?.keys} delayMs={500} side={captionTooltipSide} disabled={wide}>
      <button
        type="button"
        className={css.newSession}
        aria-label={label}
        aria-keyshortcuts={shortcut?.aria}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        onClick={() => { onNew() }}
      >
        <span className={css.newSessionLabelMask}><span className={css.newSessionContent}>
          {wide
            ? <IconNewChatOutlineMedium size={14} />
            : <IconNewChatOutlineRegular size={windowsTitlebar ? 16 : 18} />}
          {wide && <span className={clsx(css.newSessionLabel, css.wide)}>{text}</span>}
        </span></span>
        {wide && shortcut !== undefined && shortcut.keys.length > 0 && <span className={css.newSessionShortcut} aria-hidden="true">
          <ShortcutKeys keys={shortcut.keys} />
        </span>}
      </button>
    </Tooltip>
  )
}
