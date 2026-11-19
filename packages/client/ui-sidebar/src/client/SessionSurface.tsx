/** Native sidebar geometry without global navigation or window chrome. */
import clsx from 'clsx'
import { useSidebarScrollbars } from './useSidebarScrollbars.ts'
import type { FactoryComponentPropsOf } from '@deepseek-ai/dsh-client-ui-slots'
import { NewSessionAction } from './NewSessionAction.tsx'
import css from './SidebarRoot.module.css'

/** Empty content when an embedding owner supplies no browser. */
function EmptyContent() { return null }

/** Render occurrence-owned content with native New Session and sidebar spacing.
 * @param props - Explicit local action and factory-provided content.
 * @returns A native sidebar surface.
 */
export function SessionSurface({ onNew, disabled, busy, t, useFactorySlot }: FactoryComponentPropsOf<'sidebar.session-surface'>) {
  const { column, pointerInside, enter, leave } = useSidebarScrollbars()
  const Content = useFactorySlot('content', EmptyContent)
  return <div ref={column} className={clsx(css.root, !pointerInside && css.quietBars)} onPointerEnter={enter} onPointerLeave={leave}>
    {onNew !== undefined && <NewSessionAction onNew={onNew} disabled={disabled} busy={busy} label={t('session.new.label')} text={t('session.new')} />}
    <div className={css.regionArea}><Content /></div>
  </div>
}
