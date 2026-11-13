---
title: "Versions and release guarantees"
description: "Choose the right documentation snapshot, align dependencies, and verify a version upgrade."
sidebar:
  order: 1
---

The version picker selects a complete documentation snapshot: guides, API, search, examples, and source links all refer to the same framework revision.

## Stable, preview, and next

**Stable** identifies an official release. **Preview** identifies an explicitly published prerelease. **Next** follows development on the FerroUI main branch and can contain APIs that are not on crates.io yet.

The workspace version alone does not establish publication. The release pipeline promotes a documentation snapshot only after the official release succeeds. The 0.5.0 snapshot is pinned to the commit of the published release.

## Dependency alignment

FerroUI crates are released together and use exact internal version requirements. Keep all framework dependencies aligned. A facade feature does not necessarily make the same individual crate name available to build-generated Rust code.

## Corrections

A documentation correction can improve prose or examples for an existing release, but it keeps the same framework source identity. Build provenance records the framework commit, documentation revision, compiler configuration, and API digest.

## Moving between versions

The picker retains the current page when the destination contains it. If a page is unavailable, the version landing page explains the missing destination rather than redirecting silently to another version's API.

Consult the release notes and migration guidance before changing minor versions. Current compatibility guarantees are stated by the framework's release policy; do not infer compatibility from a similar-looking signature alone.

## Example: migrate a search screen to 0.5

1. Select the 0.5.0 documentation snapshot.
2. Align every direct FerroUI dependency to `=0.5.0`.
3. Rebuild. Where compiled markup reports a binding without type information, add `x:DataType` for the view model and for each item template, or use `{ReflectionBinding}` for a source whose type is known only at run time.
4. Replace deprecated names that the compiler reports, and store each returned `Subscription` guard with the view that owns it.
5. Type a query, clear it, select a result, and leave the screen while a search is running, using both keyboard and pointer.

Check [what's new in 0.5]({{BASE}}/releases/whats-new/) for related features, and [release guarantees]({{BASE}}/releases/policy/) for what remains compatible within a minor series.
