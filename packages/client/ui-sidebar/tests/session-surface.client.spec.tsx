// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { FactoryComponentPropsOf } from '@deepseek-ai/dsh-client-ui-slots'
import { SessionSurface } from '../src/client/SessionSurface.tsx'
import { NewSessionAction } from '../src/client/NewSessionAction.tsx'
afterEach(cleanup)
it('keeps creation visible with content and disables it while busy', () => {
  const onNew = vi.fn()
  const view = render(<NewSessionAction onNew={onNew} label="New session" text="New" />)
  fireEvent.click(screen.getByRole('button', { name: 'New session' }))
  expect(onNew).toHaveBeenCalledOnce()
  view.rerender(<NewSessionAction onNew={onNew} label="New session" text="New" busy />)
  expect(screen.getByRole('button', { name: 'New session' }).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'New session' }))
  expect(onNew).toHaveBeenCalledOnce()
})

function ExistingHistory() { return <div role="tree">Existing session history</div> }
it('renders stable supplied history with a visible local action, and hides creation when readonly', () => {
  const onNew = vi.fn()
  const props = {
    onNew,
    t: (key: string) => key,
    useFactorySlot: () => ExistingHistory,
  } as FactoryComponentPropsOf<'sidebar.session-surface'>
  const view = render(<SessionSurface {...props} />)
  expect(screen.getByRole('tree').textContent).toBe('Existing session history')
  fireEvent.click(screen.getByRole('button', { name: 'session.new.label' }))
  expect(onNew).toHaveBeenCalledOnce()
  view.rerender(<SessionSurface {...props} onNew={undefined} />)
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.getByRole('tree')).toBeTruthy()
})

it('renders an empty readonly surface when no content override is supplied', () => {
  const props = {
    t: (key: string) => key,
    useFactorySlot: (_name: string, fallback: () => null) => fallback,
  } as FactoryComponentPropsOf<'sidebar.session-surface'>
  const view = render(<SessionSurface {...props} />)
  expect(view.container.textContent).toBe('')
  expect(screen.queryByRole('button')).toBeNull()
})
