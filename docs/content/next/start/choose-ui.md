---
title: "Choose XAML or declarative Rust"
description: "Compare XAML, Rust builders, and rsx components using one representative screen."
sidebar:
  order: 3
---

FerroUI offers several ways to construct the same control tree. Choose based on how your team organizes UI behavior and visual design.

| Approach | Best fit | State and behavior |
|---|---|---|
| XAML + MVVM | Resource-driven applications, reusable styles, a separation between views and application logic | View models, bindings, commands |
| Rust builders | Typed composition without a markup file | Signals or imperative property changes |
| `rsx!` components | Reusable UI functions and component-oriented applications | Signals, hooks, asynchronous resources |
| Imperative controls | Infrastructure, custom controls, integration code | Explicit object ownership and event subscriptions |

XAML works with runtime loading and build-time compilation. Runtime loading is convenient for interactive editing; build-time compilation writes Rust code as part of your crate's build. Both depend on the framework's markup metadata.

Declarative Rust can host XAML and XAML can host components. Keep a clear owner for each subtree; replacing a mounted component's controls behind the reconciler's back makes lifecycle behavior difficult to reason about.

Begin with [XAML]({{BASE}}/xaml/overview/), [MVVM]({{BASE}}/guides/mvvm/), or [declarative Rust]({{BASE}}/declarative/overview/). A team can choose one default while using the others for specialized views.

## Decide with one representative screen

For a settings form, choose XAML when most work is arranging controls and sharing theme resources. Choose declarative Rust when the team wants layout beside typed component state and handlers. Try one field, a validation message, and a Save action before committing a large screen to either approach.

You can express the same static label in XAML:

```xml
<TextBlock xmlns="https://github.com/ferroui" Text="Settings" FontSize="24" />
```

Or as a Rust builder inside a declarative view:

```rust
use ferroui_view::prelude::*;
let heading: Element = text_block().text("Settings").font_size(24.0).into();
```

Both produce a [TextBlock]({{BASE}}/controls/reference/textblock/). Its layout and accessibility behavior are shared. The choice determines how you author and update the view, not a separate set of controls.

## Public APIs and next steps

- [`Element`]({{BASE}}/api/ferroui-view/element/enum-element/) and [`rsx`]({{BASE}}/api/ferroui-view-macros/proc_macro-rsx/) — declarative views.
- [`FerroRuntimeXamlLoader`]({{BASE}}/api/ferroui-markup-xaml-loader/struct-ferroruntimexamlloader/) — runtime XAML loading.
- [Build a first application]({{BASE}}/start/first-application/) using your chosen approach.
