# Native navigation extensions implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Work in the three local repositories without git add, commit or push. The user already authorized implementation. Keep the daily Desktop installation unchanged until isolated native compatibility acceptance passes.

**Goal:** Restore the actual native sidebar and WorkspaceBrowser as the sole conversation navigation UI; add generic extension seams and migrate Workbench / Agent Sessions to them.

**Architecture:** This fork tracks official tag `dsh-v0.2.1-rc.2`, commit `687f282e8625c6b8d11ff58211a90524be2e4317`, matching installed Desktop 2.0.18. The fork owns generic native UI/service contracts only. Workbench contributes custom navigation and standard menu factories. Agent Sessions contributes a picker and a browsing scope; it never registers a replacement `sidebar.workspaces` component. Existing native child-slot ownership, row actions, overlays, directory flow, styling, locale and animations stay with the native browser.

**Tech Stack:** Cordis, standard DSH Slots/Factories, TypeScript, React, official native UI primitives, Vitest, actual Electron Desktop acceptance with isolated DSH_HOME and userData.

## Non-negotiable acceptance

- Native packages without extensions retain original DOM/visual behavior (apart from declared nonvisual extension seams); use original component tests/snapshots and a real Desktop comparison.
- No handwritten replacement session rows, menus, tooltips, directory picker, search result UI, status indicators or parallel view-preference store.
- Top view switch and agent picker remain independent standard header-control contributions (order 10 and 20), immediately below the brand and above unchanged native New/global panel rows. The header owner passes activeView so the Agent picker is absent in alternate navigation. No DOM injection, MutationObserver anchors, CSS hiding original rows, private host API or React Fiber.
- Sidebar supports generic alternative navigation views with lifecycle fallback to its native conversation view. Native browser state is preserved across view changes. Native conversation New / global panel rows belong to conversation mode; alternate navigation owns its own menus. Native branding, geometry and footer remain native.
- Scope applies before display grouping/count/overflow/search bounding. Keep the complete source and complete durable sort ledger. Scope drag writes merge visible movement into the full order without losing hidden members. Clear default scope is exactly original behavior.
- Scope readiness/error must be explicit; unknown attribution must not be classified into Other before metadata is resolved. Search scope is enforced before the Host result bound, not after a globally truncated result.
- Existing native row/menu/hover/directory slots remain declared and rendered by the same original owner; third-party contributions continue through them.
- Existing approved behavior remains: actual native preset defaults, Other read-only classification, Profile current selection/pins/last history, independent native drafts, passive multi-client updates never replacing body.
- Workbench menu contributions remain standard Slots/Factories; application-management order is reserved but no business centers/test menus ship in production.

## Task 0 — baseline and install

- [x] Fork upstream to https://github.com/lanbingtech/deepseek-harness.
- [x] Clone under D:/Git/lanbingtech and configure upstream remote.
- [x] Select exact official release baseline in local feature branch.
- [x] Install the checked-in workspace dependencies; retain the lockfile (frozen filtered install, no scripts).
- [x] Run native sidebar/workspace baseline tests before edits: 19 files, 515 tests passed, Vitest 4.1.11, 2026-11-13.
- [x] Verify Desktop can load the packaged native fork through a Profile composition without overwriting installed resources.

## Task 1 — generic sidebar seams + Workbench migration

Ownership: packages/client/ui-sidebar/** and D:/Git/lanbingtech/dsh-workbench/src/**, its relevant tests/build/type declarations. Coordinate any shared generated exports with root.

- [x] Add standard root-scoped header-control and keyed navigation-view slots to native sidebar, declared by its existing sidebar entry.
- [x] Add a typed injected Cordis sidebar-navigation service for selecting/querying the view and notifying lifecycle fallback; use the standard slot ledger as the only available-view registry.
- [x] Preserve unchanged native default rendering, collapse/rail/window-chrome/footer and original styling. No UI feature business names in native implementation.
- [x] Native conversation browser stays the original slot occupant; alternate view changes visibility at the native composition boundary, preserving native browser state.
- [x] Migrate Workbench switch to native header slot using native UI primitives; migrate its menus to a standard keyed navigation view. Remove active DOM adapter / priority takeover paths.
- [x] Retain Profile restoration, dynamic menu reconciliation, cross-plugin two-level menu contracts, isolated uninstall fallback.
- [x] Test original native behavior and extension load/select/remove/reload; test Workbench standalone and with native Agent scope.

## Task 2 — generic browser scope + Agent Sessions migration

Ownership: packages/client/ui-workspace/**; packages/api/session-controller/** and directly necessary search-contract consumers; D:/Git/lanbingtech/dsh-agent-sessions/src/** and relevant tests/build/type declarations. Coordinate API signatures with root and Task 1.

- [x] Use the independent native sidebar header-control slot for the Agent picker. Any additional browser-local header seam must have a concrete generic use and retain default DOM parity.
- [x] Add a typed Cordis browser-scope seam exposing a bare observable and effect-owned contribution. Render data via framework-bound hook; no arbitrary component callback/private global registry.
- [x] Scope is readonly projection over original session data. Apply it to native derived groups/flat rows/search and quotas; keep full ordering accounting and native global preference persistence.
- [x] Extend native session search with an optional serializable range; it is required whenever an active scope is present. Undefined is unrestricted; an empty range is empty. Enforce on Host before bounded results. No business-specific logic in generic native scope seam.
- [x] Migrate Agent Sessions to original browser header + scope service; retain reviewed selection/pin/navigation logic only where it still satisfies native contracts.
- [x] Use native primitives for picker/menu/tooltips and typed locale. Remove the replacement browser/action/search/directory factories from active production imports and registration.
- [x] Cover cold metadata, Other, scope switches, native new actions, drafts, reorder, search and original third-party slots with original rows.

## Task 3 — source build, packaging and tracking (root)

- [x] Package enhanced native modules with explicit source attribution and standard Profile composition; verify only selected native Loader entries change.
- [x] Preserve native module identities and avoid duplicate Cordis/UI runtime instances. Use the official build/loader contracts; do not write bundled node_modules.
- [x] Update both specs/READMEs and reopen their parent tracking issues: supersede the previous priority-replacement architecture and withdraw prior UI-fidelity acceptance.
- [x] Record the native-extension issue and migration tickets on GitHub, without committing/pushing source unless separately instructed.
- [x] Run native upstream tests, targeted contract tests, TypeScript/build checks and existing relevant extension tests. Require independent code and TS review of all changed code.

## Task 4 — root-owned real Desktop acceptance

- [x] Fresh isolated native fork without feature plugins: compare to stock installed native browser at identical data/theme/window size, including collapse/rail, menu, hover and directory operations.
- [x] Workbench only, Agent scope only, combined, both install orders, reload and uninstall directions; original row-slot test contributor works unchanged.
- [x] Actual preset/history/draft/pin/search/new/multi-client behavior on native UI, with no backend mocks (a deterministic local model may drive real host status lifecycle).
- [x] Do not accept functionality-only checks as visual equivalence. Root personally reviews native-versus-enhanced screenshots and full spec compliance before daily replacement.

## Working agreement

Workers are not alone; do not revert another agent's changes. Use gpt-6.1-sol as requested. No desktop app launch outside root coordination, no daily-profile mutation, no external test environment access. Keep architecture failures explicit; do not silently fall back to a replacement browser.
