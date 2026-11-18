---
title: "Understand the release guarantees"
description: "Know which APIs, defaults, and dependency versions a FerroUI release promises to preserve."
---

Use an official release when you need a fixed framework version. `next` documents development and may include packages or features that have not been published.

## Keep the release set together

FerroUI crates in a release use the same version and exact internal dependency requirements. Pin your direct framework dependencies to that same version; do not mix a core crate from one release with a controls or theme crate from another.

For the published 0.5.0 release:

```toml
[dependencies]
ferroui-base = "=0.5.0"
ferroui-controls = "=0.5.0"
ferroui-view = { version = "=0.5.0", features = ["desktop"] }
ferroui-themes-fluent = "=0.5.0"
```

This is a dependency-alignment example, not a complete application manifest. Follow [installation]({{BASE}}/start/installation/) for platform requirements and [XAML compilation]({{BASE}}/xaml/compilation/) for direct build dependencies.

## What stays compatible within a minor release

The framework's policy is that the public API of published crates only grows within a minor series: `0.5.x` adds members and types without changing or removing existing ones. Property defaults and default binding modes also stay unchanged. A required breaking change belongs to the next minor series.

Check migration guidance when moving between minor versions. Prereleases are explicitly named versions and should be evaluated as their own snapshots. A package's existence on the main branch does not mean it belongs to a published release.

## What the documentation snapshot contains

The version selector chooses guides, public API reference, control metadata, search, examples, and source links for one framework revision. Each API page records the targets from which it was extracted; that is availability evidence, not a promise that every native interaction was tested on every device.

A documentation correction can improve instructions without changing the framework commit. Its provenance records the new documentation revision separately. It must not introduce an unreleased API into an older reference.

## Upgrade with a representative task

For a profile editor, align the dependencies, rebuild, then exercise text entry, validation, save, keyboard focus, and theme switching. For custom controls, also check templates and inherited defaults. A successful compile is the first check; the user task verifies the behavior you depend on.

Continue with [versions and migration]({{BASE}}/releases/versions/) and [what's new in 0.5]({{BASE}}/releases/whats-new/).
