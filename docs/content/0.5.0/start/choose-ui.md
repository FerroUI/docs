---
title: "Choose declarative Rust or XAML"
description: "Compare components with hooks, run-once components with signals, the builders, and compiled XAML using one representative screen."
sidebar:
  order: 3
---

FerroUI offers two equal ways to write a view, and both construct the same control tree. Declarative Rust (`ferroui-view`) is the primary one: builders for every control, an `rsx!` macro, fine-grained signals, and React-like components with hooks. XAML compiled to Rust is the second. Choose by how your team organizes UI behavior and visual design; the controls, layout, themes, styles, and bindings are shared.

| Approach | Best fit | State and behavior |
|---|---|---|
| Components that run again (`#[component(rerender)]`) | Component-oriented applications, teams that know React | `use_signal`, `use_memo`, `use_effect`, context, `use_future`; a reconciler patches the controls |
| Components that run once (`#[component]`) and builders | Screens with a stable structure whose values change often | Signals, memos, and effects that properties follow directly |
| XAML, compiled or loaded at run time | Resource-driven applications, reusable styles and templates, designers working on markup, MVVM | View models, compiled bindings, commands |
| Imperative controls | Infrastructure, custom controls, integration code | Explicit object ownership and event subscriptions |

The two declarative models mix in one tree: a component that runs again can pass a signal straight to a property (`text: count`) so that the property updates without running the component. See [components and hooks]({{BASE}}/declarative/components/).

XAML works with build-time compilation and runtime loading. Build-time compilation writes Rust code as part of your crate's build, with compiled bindings by default; runtime loading is convenient for interactive editing. Both depend on the framework's markup metadata. See [compile or load XAML]({{BASE}}/xaml/compilation/).

Declarative Rust can host XAML and XAML can host components. Keep a clear owner for each subtree; replacing a mounted component's controls behind the reconciler's back makes lifecycle behavior difficult to reason about. See [components with XAML]({{BASE}}/declarative/xaml-interop/).

## Decide with one representative screen

For a settings form, choose declarative Rust when the team wants layout beside typed component state and handlers, with property names and values checked by the compiler. Choose XAML when most work is arranging controls and sharing theme resources, or when the screen is edited in a visual designer. Try one field, a validation message, and a Save action before committing a large screen to either approach.

The same heading as a builder:

```rust
use ferroui_view::prelude::*;
let heading: Element = text_block().text("Settings").font_size(24.0).into();
```

In `rsx!`:

```rust
use ferroui_view::prelude::*;
let heading = rsx! { TextBlock { text: "Settings", font_size: 24.0 } };
```

In XAML:

```xml
<TextBlock xmlns="https://github.com/ferroui" Text="Settings" FontSize="24" />
```

All three produce a [TextBlock]({{BASE}}/controls/reference/textblock/). Its layout and accessibility behavior are shared. The choice determines how you author and update the view, not a separate set of controls.

## How state reaches the controls

| | Declarative Rust | XAML |
|---|---|---|
| A value set once | `text: "Welcome"` | `Text="Welcome"` |
| A value that follows state | `text: count` (a signal), `text: move \|\| ..` (a closure) | `Text="{Binding Count}"` on a notifying view model |
| An edit written back | `text: draft.two_way()` | `Text="{Binding Draft, Mode=TwoWay}"` |
| An action | `on_click: move \|_\| ..` | `Command="{Binding SaveCommand}"` or an event handler |
| A list | `for` in `rsx!` with `key`, or `for_each` | `ItemsSource` with a `DataTemplate` |

A view model with bindings also works under a component: `use_data_context` reads the `DataContext` of the control the component is mounted in, and `.bind(property, binding)` sets a binding of the property system on any element.

## Public APIs and next steps

- [`rsx`]({{BASE}}/api/ferroui-view-macros/proc_macro-rsx/), [`component`]({{BASE}}/api/ferroui-view-macros/proc_macro-component/), and [`Element`]({{BASE}}/api/ferroui-view/element/enum-element/) — declarative views.
- [`FerroRuntimeXamlLoader`]({{BASE}}/api/ferroui-markup-xaml-loader/struct-ferroruntimexamlloader/) — runtime XAML loading.
- [Build a first application]({{BASE}}/start/first-application/), then follow [declarative Rust]({{BASE}}/declarative/overview/), [XAML]({{BASE}}/xaml/overview/), or [MVVM]({{BASE}}/guides/mvvm/).
