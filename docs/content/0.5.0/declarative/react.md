---
title: "Bring React experience to FerroUI"
description: "Map React components, state, effects, keys, and layout to FerroUI controls."
---

If you know React, start with a rerendering `ferroui-view` component. Its function describes the UI from state, and FerroUI updates the existing controls when that state changes. The output is a FerroUI control tree, including in the browser.

First [set up declarative Rust]({{BASE}}/declarative/overview/). Import its prelude for controls, properties, and hooks.

## Write a component with persistent state

```rust
use ferroui_view::prelude::*;

#[component(rerender)]
pub fn Counter() -> Element {
    let count = use_signal(|| 0);
    rsx! {
        StackPanel { spacing: 8.0,
            TextBlock { text: format!("Count: {}", count.get()) }
            Button { on_click: move |_| count.update(|c| *c += 1), "Add one" }
        }
    }
}
```

`use_signal` keeps state between runs. Reading `count.get()` makes the component depend on the count. The handler changes it, and the displayed text updates.

## Find the equivalent operation

| In React | In FerroUI | Detail |
| --- | --- | --- |
| JSX | `rsx!` or Rust builders | Properties and handlers are Rust methods |
| `useState` | `use_signal` | Read with `get`, replace with `set`, edit with `update` |
| A controlled text input | `TextBox { text: draft.two_way() }` | Edits update the signal |
| `useMemo` | `use_memo` | Tracks the signals it reads |
| `useEffect` with dependencies | `use_effect_with` | Explicit dependencies compare by value |
| Effect cleanup | `on_cleanup` | Register cleanup inside the effect |
| A list key | `key: item.id` | Preserve item identity through reordering |
| A DOM ref | `NodeRef` | Refers to a FerroUI control |
| CSS layout | `Grid`, `StackPanel`, and other panels | Use control properties and themes |

Hooks must run in the same order on every component invocation. Do not put `use_signal` behind a changing conditional or create a fresh `signal` every time a rerendering component executes.

## Choose direct signal updates when useful

A plain `#[component]` runs once. With that form, pass a signal or reactive closure to a property so it continues updating. Passing `count.get().to_string()` evaluates once and leaves a fixed string.

Use rerendering when the tree naturally follows ordinary Rust branching. Use direct signal properties for a stable tree whose values change frequently. Both compose into the same application.

## Adapt layout and async expectations

A `Button` is a framework control, so CSS selectors and DOM event APIs do not apply. Use [styles]({{BASE}}/design/themes/) and [layout panels]({{BASE}}/design/layout/). Hooks and effects run synchronously with reactive updates; they are not React concurrent rendering or a worker pool.

Keep expensive work out of component bodies. Use a component's async resource APIs or an application service, and show loading, empty, error, and success states. [Async work]({{BASE}}/guides/async/) explains thread ownership and stale results.

## Try a larger example

Compare the [SevenGuis Hooks examples](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/SevenGuis/Hooks) with their Builders and Macros counterparts. In a list, edit an item and reorder the rows: a stable record key should keep state with the record. An array index is unsuitable when positions can change.

## Public APIs and controls

- [`use_signal`]({{BASE}}/api/ferroui-view/hooks/function-use_signal/), [`use_memo`]({{BASE}}/api/ferroui-view/hooks/function-use_memo/), and [`use_effect_with`]({{BASE}}/api/ferroui-view/hooks/function-use_effect_with/) — persistent state and effects.
- [`NodeRef`]({{BASE}}/api/ferroui-view/prelude/struct-noderef/) and [`on_cleanup`]({{BASE}}/api/ferroui-view/reactive/function-on_cleanup/) — control access and cleanup.
- [Grid]({{BASE}}/controls/reference/grid/), [StackPanel]({{BASE}}/controls/reference/stackpanel/), [TextBox]({{BASE}}/controls/reference/textbox/), and [Button]({{BASE}}/controls/reference/button/) — common host controls.
