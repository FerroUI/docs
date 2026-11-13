---
title: "Build a docking workspace"
description: "Start from the docking sample, separate tools from documents, and preserve useful workspace state."
---

Use a docking workspace for applications where users arrange several tools and documents, such as an editor. For a small application with a fixed set of destinations, [tabs or navigation]({{BASE}}/guides/navigation/) are a simpler starting point.

## Run a complete workspace

From the matching source checkout:

```sh
cargo run --locked -p ferrodock-reactiveui-sample --bin ferrodock-reactiveui-sample
```

The [sample](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/Dock/FerroDockReactiveUISample) connects the native docking controls, layout model, theme resources, views, and persistence. Start from its application setup instead of copying an isolated docking element without its model.

## Decide what belongs in each region

For a text editor, organize the workspace like this:

| Region | Example | State to keep |
| --- | --- | --- |
| Document | An open file | Stable document ID, edits, selection |
| Tool | Search results or project explorer | Tool identity, current query or selection |
| Workspace layout | Split positions and active document | Placement, proportions, active IDs |
| Application service | File storage | Persisted document contents |

Closing a document may require a save decision. Hiding a tool should not delete the search service or project model. Separate those lifetimes before adding drag-and-drop or floating windows.

## Try the interactions before adapting the sample

1. Open several documents and change the active document.
2. Move a tool to another region and resize the split.
3. Close and reopen a tool; check which state is restored.
4. Save and reload the workspace layout.
5. Repeat with a document ID that no longer resolves and provide a useful fallback.

The sample's [layout persistence service](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/Dock/FerroDockReactiveUISample/services/layout_persistence.rs) demonstrates the application boundary. Persist stable IDs and layout data; reopen document contents through your own services.

## Check platform behavior

Floating windows, focus restoration, dragging across displays, and scaling need native testing. Keep a keyboard-accessible way to activate and close documents. Test restoring an old layout when a monitor is missing or a previously registered tool no longer exists.

The compact browser playground does not include this native docking host. Use the sample to evaluate the behavior. The docking crates are not published to crates.io in 0.5.0, so this documentation has no generated Dock API reference; use them from a source checkout, and note that the sample links stay pinned to this build's framework revision.

## Related public controls and guides

- [TabControl]({{BASE}}/controls/reference/tabcontrol/) — a simpler document switcher for a fixed layout.
- [Grid]({{BASE}}/controls/reference/grid/) and [GridSplitter]({{BASE}}/controls/reference/gridsplitter/) — fixed resizable application regions.
- [MVVM]({{BASE}}/guides/mvvm/), [navigation]({{BASE}}/guides/navigation/), and [desktop packaging]({{BASE}}/platforms/desktop/).
