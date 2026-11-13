# Lanbingtech native navigation extension build

Upstream: https://github.com/deepseek-ai/deepseek-harness
Fork: https://github.com/lanbingtech/deepseek-harness
Baseline: dsh-v0.2.1-rc.2, 687f282e8625c6b8d11ff58211a90524be2e4317
Target: DSH Desktop 2.0.18 / Harness 0.2.1-rc.2
Enhanced package version: 0.2.1-rc.2.lanbingtech.1

Native ui-sidebar adds generic header/navigation seams. Native ui-workspace keeps original rendering and adds readonly browsing scope. Session controller and Remote assembly implement the same generated optional scoped-search contract. Workbench and Agent business behavior remains in their separate plugins.

Built from local uncommitted source through the upstream TypeScript/Typert/tsdown pipeline. This is a local integration artifact, not an upstream release or npm publication. Install through the Desktop Profile package resolver; do not overwrite installation resources. Use with the corresponding four-package overlay; acceptance status is tracked in the fork issue and local spec.