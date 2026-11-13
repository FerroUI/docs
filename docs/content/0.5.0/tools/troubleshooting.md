---
title: "Find the cause of a UI problem"
description: "Diagnose an empty binding, invisible control, ineffective style, or unbounded list."
sidebar:
  order: 3
---

Start by identifying which layer owns the behavior: application state, binding, the control property system, layout, styling, rendering, or the platform integration. Reproduce the issue with the smallest view that still demonstrates it.

| Symptom | Check first |
|---|---|
| A control is invisible | Theme installation, bounds, visibility, foreground/background, font availability |
| A binding is empty | DataContext, registered names, source type, getter metadata |
| A value does not update | Property-change notification and binding mode |
| A style has no effect | Selector match, resource scope, effective property value source |
| A list realizes too many rows | Viewport constraints and nested scrolling |
| Text looks wrong in the browser | Explicit fonts, fallback fonts, rendering mode |
| Runtime markup cannot find a type | Type registration and XML namespace |
| A popup or dialog differs by platform | Hosting, focus, and backend-specific behavior |

## Inspect before changing

Open developer tools where available and inspect both logical and visual trees. Find the actual control, inspect its resolved values, then look at layout constraints and matched styles. A template part can be visually responsible for a result while the owning control supplies its state.

## Compare against a sample

Use the same framework version, theme, and backend as your application. A working sample on `next` does not establish that an API exists in your stable release. Include an exact commit or package version in an issue report.

## Make a useful report

Provide a minimal project, expected and actual behavior, platform/architecture, renderer, theme, and reproduction steps. Include whether the issue occurs in the ControlCatalog. Remove unrelated services or private data from the reproduction.

## Work through an empty label

Suppose `Text="{Binding DisplayName}"` shows nothing:

1. Temporarily set `Text="Binding check"`. If it stays invisible, inspect layout, visibility, theme, and foreground first.
2. Restore the binding and confirm the inherited `DataContext` is the expected model.
3. Check that markup metadata exposes `DisplayName` with the exact spelling.
4. Set an initial value before showing the view. If it appears once but never changes, inspect notifications.
5. If edits should flow back, verify the setter and `Mode=TwoWay`.

This isolates display, source lookup, and notification failures without rewriting the view. Continue with [binding diagnostics]({{BASE}}/guides/binding/) when the source is the problem.

## Follow the relevant contract

- [TextBlock]({{BASE}}/controls/reference/textblock/) and [TextBox]({{BASE}}/controls/reference/textbox/) — text and editing properties.
- [`Binding`]({{BASE}}/api/ferroui-markup/data/struct-binding/) — source paths and binding options.
- [Grid]({{BASE}}/controls/reference/grid/) and [ScrollViewer]({{BASE}}/controls/reference/scrollviewer/) — sizing and scrolling.
- [`Style`]({{BASE}}/api/ferroui-base/styling/struct-style/) — selector/setter behavior.
- [Developer tools]({{BASE}}/tools/devtools/) — inspect the effective result before changing code.
