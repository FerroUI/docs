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
| `useMemo`, `useCallback` | `use_memo` | Tracks the signals it reads; handlers need no memoizing |
| `useEffect`, `useLayoutEffect` | `use_effect_with(deps, ..)`, `use_effect` | Explicit dependencies compare by value; `use_effect` follows the signals it reads |
| Effect cleanup | `on_cleanup` | Register cleanup inside the effect |
| `useContext` | `provide_context`, `use_context::<T>()` | Found by type |
| `React.memo` | The default for comparable parameters | `#[component(rerender, always)]` opts out |
| A list key | `key: item.id` | Preserve item identity through reordering |
| A DOM ref | `NodeRef` | Refers to a FerroUI control |
| Portals | `Popup` with a child element | Shown above the window, owned by the popup |
| react-window | A virtualized `ListBox` with `item_template: template(..)` | Item components are recycled as the list scrolls |
| Error boundaries | `error_boundary(child, fallback)` | Guards the functions of components below it |
| `Suspense` with data | `use_future` with `suspense` | Follows the state of one future |
| React Router | `router` with `route`, `use_router` | Paths with parameters |
| Fast Refresh, React DevTools | The `hot-reload` feature (literals), the inspector (Shift+F12) | See [hot reload & inspector]({{BASE}}/declarative/tools/) |
| CSS layout | `Grid`, `StackPanel`, and other panels | Use control properties and themes |

Hooks must run in the same order on every component invocation. Do not put `use_signal` behind a changing conditional or create a fresh `signal` every time a rerendering component executes.

## Choose direct signal updates when useful

A plain `#[component]` runs once. With that form, pass a signal or reactive closure to a property so it continues updating. Passing `count.get().to_string()` evaluates once and leaves a fixed string.

Use rerendering when the tree naturally follows ordinary Rust branching. Use direct signal properties for a stable tree whose values change frequently. Both compose into the same application.

## Adapt layout and async expectations

A `Button` is a framework control, so CSS selectors and DOM event APIs do not apply. Use [styles]({{BASE}}/design/themes/) and [layout panels]({{BASE}}/design/layout/). Hooks and effects run synchronously with reactive updates; they are not React concurrent rendering or a worker pool.

Keep expensive work out of component bodies. Use `use_future` with `suspense` ([async data]({{BASE}}/declarative/patterns/)) or an application service, and show loading, empty, error, and success states. [Async work]({{BASE}}/guides/async/) explains thread ownership and stale results.

## What has no React counterpart

- A property that follows a signal (`text: count`) updates without running any component, even inside a component that runs again.
- Every property setter, handler, and component parameter is checked by the compiler, including conversions such as `8.0` to a thickness or `"Red"` to a brush.
- Two-way values (`text: name.two_way()`) bind a field to a signal without a change handler.
- Styles, themes, data bindings, attached properties (`Grid.row: 1`), and resources apply to the controls of `rsx!` as they do to controls made by XAML, and XAML and components host each other.

React features that are not part of FerroUI: concurrent rendering and transitions (rendering is synchronous by design), `Suspense` that waits for the data of several components or streams, and server components or server rendering.

## Try a larger example

Compare the [SevenGuis Hooks examples](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/SevenGuis/Hooks) with their Builders and Macros counterparts, then read [TodoMVC](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/TodoMvc) (`cargo run -p todo-mvc`), written as components with hooks and a router. In a list, edit an item and reorder the rows: a stable record key should keep state with the record. An array index is unsuitable when positions can change.

## Public APIs and controls

- [`use_signal`]({{BASE}}/api/ferroui-view/hooks/function-use_signal/), [`use_memo`]({{BASE}}/api/ferroui-view/hooks/function-use_memo/), and [`use_effect_with`]({{BASE}}/api/ferroui-view/hooks/function-use_effect_with/) — persistent state and effects.
- [`NodeRef`]({{BASE}}/api/ferroui-view/prelude/struct-noderef/) and [`on_cleanup`]({{BASE}}/api/ferroui-view/reactive/function-on_cleanup/) — control access and cleanup.
- [Components and hooks]({{BASE}}/declarative/components/) and [lists, async data & routing]({{BASE}}/declarative/patterns/) — the topics behind this table.
- [Grid]({{BASE}}/controls/reference/grid/), [StackPanel]({{BASE}}/controls/reference/stackpanel/), [TextBox]({{BASE}}/controls/reference/textbox/), and [Button]({{BASE}}/controls/reference/button/) — common host controls.
