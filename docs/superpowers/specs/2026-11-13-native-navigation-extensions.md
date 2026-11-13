# Native sidebar extension foundation

Status: local implementation, root spec/code/visual review, isolated Desktop acceptance and daily Profile integration completed on 2026-11-13. Source remains uncommitted and unpushed. Full GUI suite retains documented unrelated failures; targeted native tests pass. User authorized this direction and the organization fork on 2026-11-13 after rejecting the previous replacement browser.

## Baseline and ownership

- Organization fork: https://github.com/lanbingtech/deepseek-harness
- Local source: D:/Git/lanbingtech/deepseek-harness
- Official release: dsh-v0.2.1-rc.2 / 687f282e8625c6b8d11ff58211a90524be2e4317
- Target: installed DSH Desktop 2.0.18, Harness 0.2.1-rc.2.
- Feature repositories remain D:/Git/lanbingtech/dsh-workbench and D:/Git/lanbingtech/dsh-agent-sessions.

The fork adds generic extension seams. Workbench and Agent business logic remain external plugins. Native WorkspaceBrowser, Rows, Menu/Tooltip/Modal primitives, CSS, animation, directory flow and existing row/hover action slots remain the production conversation UI.

## Required behavior

1. Without extension contributions, native snapshots and visible behavior match the official baseline. No empty control gaps or default-view changes.
2. Sidebar declares standard `sidebar.header.control` list and keyed `sidebar.navigation.view`. Typed sidebarNavigation service selects only live slot keys; missing view falls back to native conversation.
3. Workbench switch and Agent selector are independent header entries, order 10 and 20, below the native brand and above native New/global panels. Agent selector appears only in conversation view.
4. Alternative navigation preserves the mounted native WorkspaceBrowser tree and its transient state, using hidden/inert composition at its owner boundary. Native branding, geometry and footer remain native.
5. Generic workspaceBrowserScope service accepts effect-owned observable membership, lower numeric priority winning. Undefined scope is unrestricted; ready empty scope is empty; loading and error never expose unrelated rows.
6. Scope affects native displayed groups, counts, quotas and search before bounds. Complete source snapshots and persistent ordering ledgers remain intact; drag merges visible movement while preserving hidden members and native constraints.
7. Native content search accepts optional serializable sessionIds; active scope always supplies its range. Host search and provider range filtering occur before result caps. Cancel obsolete requests and ignore stale responses on scope changes/disposal.
8. Native old menu/row/hover/directory slots remain owned/rendered by their original registration. Existing third-party contributors use their original contract.
9. New/default preset semantics, Other classification, multi-pin ordering, Profile selected/last history, per-session native drafts and passive multi-client non-navigation remain feature requirements.
10. Workbench business menus/pages are standard Slots/Factories and support cross-plugin two-level contribution. No demo centers ship in production.

## Delivery and acceptance

Use versioned enhanced native packages through the standard Desktop Profile resolver; never overwrite resources/app or its node_modules. Session controller and Remote assembly artifacts must be rebuilt together when their generated search contract changes. Retain original dependency/runtime identities and a rollback composition.

Unmodified baseline: 19 native test files / 515 tests passed. Standard loader proof passed using two native probe packages with unchanged installed code plus nonexecuting source attribution comments; actual Desktop served both Profile-resolved bundles and rendered one native sidebar/browser. This proves the loading mechanism, not acceptance of modified source.

Final acceptance requires compiled fork without feature plugins compared against stock UI, then independent/combined extensions, both install/uninstall orders, original third-party row contribution, real preset/history/draft/pin/search/new/state scenarios and root visual review at equal theme/window/data. Existing 2026-11-12 UI-fidelity acceptance is withdrawn. No source commit/push or daily replacement is implied by a passing unit suite.

## Tracking

The two original parent specs are reopened for native-extension migration. Previous completion records are historical functional checks, not proof of native fidelity. Root owns final spec compliance and actual Desktop UI acceptance; implementation/review agents use gpt-6.1-sol.
