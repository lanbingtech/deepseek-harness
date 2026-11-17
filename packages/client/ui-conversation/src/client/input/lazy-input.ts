/** Delay editor and saved-draft initialization until a consumer reads input or invokes an action. */
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { InputActions, InputState } from '../contract/input.ts'

/** The existing input facade's reactive and action faces. */
interface InputFaces {
  readonly state: ObservableSnapshot<InputState>
  readonly actions: InputActions
}

/**
 * Bind input seats without constructing an editor for transcript-only Session consumers.
 * @param resolve - Return the Session-owned input facade, initializing it once when needed.
 * @returns Stable observable and action delegates for the Session binding.
 */
export function lazyInput(resolve: () => InputFaces): InputFaces {
  return {
    state: {
      getSnapshot: () => resolve().state.getSnapshot(),
      subscribe: listener => resolve().state.subscribe(listener),
    },
    actions: {
      captureInsertion: () => resolve().actions.captureInsertion(),
      insertText: (text, span) => resolve().actions.insertText(text, span),
      setDraft: (text) => { resolve().actions.setDraft(text) },
      persistDraft: () => { resolve().actions.persistDraft() },
      addAttachments: ids => resolve().actions.addAttachments(ids),
      removeAttachment: (id) => { resolve().actions.removeAttachment(id) },
      pruneAttachments: (ids) => { resolve().actions.pruneAttachments(ids) },
      submit: () => { resolve().actions.submit() },
    },
  }
}
