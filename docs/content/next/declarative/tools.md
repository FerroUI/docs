---
title: "Hot reload, diagnostics, and the component inspector"
description: "Edit rsx! literals while the application runs, catch missing keys and runaway components, and inspect mounted components."
---

`ferroui-view` has three development tools of its own: hot reload of the literals of `rsx!`, diagnostics for mistakes the framework can detect, and an inspector of the mounted component trees. They complement the framework's [developer tools]({{BASE}}/tools/devtools/), which inspect controls, properties, styles, and layout.

## Hot reload rsx! literals

Enable the `hot-reload` feature of `ferroui-view`. While the application runs, you can then edit:

- the text of a child (`"Count"`);
- a number, a text, or a character given to an attribute (`width: 80.0`, `background: "#0063B1"`, `class: "accent"`).

```sh
cargo run -p view-gallery --features hot-reload
```

Edit a button label or a color in the sample's source and save. `launch` watches the source files; the components that read a changed literal run again and the reconciler patches their controls, so state, focus, and scroll positions stay. The console reports how many literals differ from the build.

The limits are deliberate:

- Only components that run again, and children that follow state, run again. A component that runs once keeps what it built.
- Adding an attribute or moving an element changes the shape of the `rsx!` invocation; it is reported as needing a rebuild, while the literals of other invocations still apply.
- Literals inside expressions (`{if dark { "a" } else { "b" }}`) are code and need a rebuild.

Without the feature, the literal pass-through compiles to the value itself and costs nothing.

## Read diagnostics

Debug builds check for mistakes the framework can see and report each distinct one once to standard error:

| Diagnostic | When |
| --- | --- |
| `MissingKeys` | A list (`for` in `rsx!`, a `Vec` of elements) has two or more controls or components without keys |
| `DuplicateKey` | Two siblings have the same key |
| `RunawayComponent` | A component runs more than 100 times in one propagation of changes, usually because its function writes a signal it reads |
| `NeedsRebuild`, `HotReloaded` | Hot reload changed more than literals, or applied literals |
| `ErrorCaught` | A component below an [error boundary]({{BASE}}/declarative/patterns/) panicked and the boundary shows its fallback; reported in every build |

`set_diagnostics_handler(|diagnostic| ..)` sends them elsewhere, such as a test or a log; `clear_diagnostics_handler` restores the default.

## Inspect mounted components

`launch` attaches the component inspector to the main window: press **Shift+F12** in a debug build. F12 stays with the framework's developer tools. The inspector lists the live mounted trees of the thread, indented by depth:

- components, with their keys, runs, and hooks;
- controls, with their class, `Name`, style classes, and properties: the current value and where the element's value comes from (a value, following state, two-way, an element, or a binding);
- text, and lists that follow state with their items and keys.

With the `desktop` feature, `open_inspector()` opens it in a window of its own; `inspector()` is the same view as an element you can place yourself, and `mounted_trees()` returns the description as data for tools and tests.

## Check work in tests

`view_stats()` counts what mounting and the reconciler did on the thread: operations on host children, handlers attached, and reactive values started. The framework's own tests use it to check that a run patched only what changed. Application tests can drive a mounted view the way the 7GUIs scenario tests do: `cargo test -p seven-guis-tests` runs one scenario per task on each of the builder, macro, and hook versions. See [testing]({{BASE}}/tools/testing/).

## Hot reload of XAML and Rust functions

Separately from `rsx!` literals, the repository has an experimental development reload engine for runtime XAML and explicitly registered Rust functions. Its supported edits and limits are recorded in the FerroUI repository's [hot reload document](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/docs/development/hot-reload.md).

## Public APIs

- [`hot`]({{BASE}}/api/ferroui-view/hot/) — hot reload of `rsx!` literals, including `apply_source` for tools that hold the source.
- [`Diagnostic`]({{BASE}}/api/ferroui-view/diagnostics/enum-diagnostic/) and [`set_diagnostics_handler`]({{BASE}}/api/ferroui-view/diagnostics/function-set_diagnostics_handler/) — diagnostics.
- [`inspector`]({{BASE}}/api/ferroui-view/inspect/function-inspector/), [`mounted_trees`]({{BASE}}/api/ferroui-view/inspect/function-mounted_trees/), and [`InstanceNode`]({{BASE}}/api/ferroui-view/inspect/struct-instancenode/) — the inspector.
- [`view_stats`]({{BASE}}/api/ferroui-view/function-view_stats/) — counters of mounting and reconciliation.
