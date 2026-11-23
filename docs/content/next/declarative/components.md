---
title: "Write components with hooks"
description: "Write function components that run again, keep state and effects in hooks, share values through context, and understand what the reconciler keeps."
---

A component is a Rust function that returns an `Element`. With `#[component(rerender)]` it follows the model of React: the function describes the interface from its state, runs again when that state changes, and a reconciler patches the controls it made into what it returns now. State and effects that outlive one run live in hooks. This page covers that model; [builders, rsx! & signals]({{BASE}}/declarative/overview/) covers the run-once model it combines with.

## Write a component that runs again

```rust
use ferroui_view::prelude::*;

#[component(rerender)]
pub fn Counter() -> Element {
    let count = use_signal(|| 0);
    rsx! {
        StackPanel { spacing: 8.0,
            TextBlock { text: format!("Clicked {} times", count.get()) }
            Button { class: "accent", on_click: move |_| count.update(|c| *c += 1), "Click" }
        }
    }
}
```

Reading `count.get()` in the function subscribes the component to the count. A click writes the signal, the function runs again, and the reconciler changes the text of the existing `TextBlock`; the button keeps its control, focus, and state. There is no `set_state` that schedules a run: a write to a signal the function read is that. Two writes inside `batch(|| ..)` run the component once.

## Pass parameters

Parameters become the component's properties. A component that runs again clones its parameters for each run, so they are `Clone`:

```rust
use ferroui_view::prelude::*;

#[component(rerender)]
fn Labelled(label: String, #[prop(default = 2)] digits: usize, value: f64) -> Element {
    rsx! { TextBlock { text: format!("{label}: {value:.digits$}") } }
}

#[component(rerender)]
fn Summary() -> Element {
    rsx! { Labelled { label: "Sum", value: 12.5 } }
}
```

A parameter is required unless it has `#[prop(default)]`, `#[prop(default = expr)]`, or an `Option` type; a missing one panics with its name when the element is built. A parameter `children: Element` takes the element's children.

| Attribute | The component |
| --- | --- |
| `#[component]` | Runs once; what changes afterwards changes through signals |
| `#[component(rerender)]` | Runs when mounted and again when a signal it read changes or its parent runs again. When all parameters are `PartialEq` and `Clone`, a parent that runs again with equal parameters skips it (memoized by default) |
| `#[component(rerender, memo)]` | As above, and comparable parameters are required: a compile error otherwise |
| `#[component(rerender, always)]` | Runs with its parent every time |

A component with a parameter that cannot be compared, such as a closure or `children: Element`, runs with its parent. With the builders, `rerender(|| ..)` makes a component that runs again from a closure.

## Keep state and effects in hooks

| Hook | What it gives |
| --- | --- |
| `use_signal(\|\| value)` | A signal kept across runs: the state of the component |
| `use_memo(\|\| ..)` | A memo kept across runs; it follows the signals it reads, with no dependency list |
| `use_effect(\|\| ..)` | An effect started once the controls of the first run are in place; it runs again when the signals it read change |
| `use_effect_with(deps, \|deps\| ..)` | A closure run after a run's controls are in place, first and whenever `deps` differ; cleanup registered with `on_cleanup` runs before the next call and when the component is removed |
| `use_hook(\|\| value)` | A value made on the first run and handed back on later ones (a `NodeRef`, a cache, a data template) |
| `use_future(deps, \|deps\| future)` | A future run on the UI thread's dispatcher, restarted when `deps` change; see [async data]({{BASE}}/declarative/patterns/) |
| `provide_context(value)`, `use_context::<T>()` | A value provided to the components below, found by type |

Each hook call has a slot of the component, found by the order of the calls. Call hooks on every run, in the same order: a run that calls a different hook at the same place panics and names the rule. A signal made with `signal(..)` in the function itself belongs to that run and is made again on the next one, so state in a component that runs again is always a hook.

An effect with a cleanup, from the timer of the 7GUIs samples:

```rust
use ferroui_base::threading::{DispatcherPriority, DispatcherTimer};
use ferroui_view::prelude::*;
use std::time::Duration;

#[component(rerender)]
pub fn Ticker() -> Element {
    let ticks = use_signal(|| 0_u64);
    use_effect_with((), move |_| {
        let timer = DispatcherTimer::run(
            move || {
                if ticks.is_alive() {
                    ticks.update(|t| *t += 1);
                }
                ticks.is_alive()
            },
            Duration::from_millis(500),
            DispatcherPriority::NORMAL,
        );
        on_cleanup(move || timer.dispose());
    });
    rsx! { TextBlock { text: format!("{} ticks", ticks.get()) } }
}
```

The closures of `use_effect_with` run right after the reconciler places the controls of a run and before the next frame is laid out and drawn, the timing of React's `useLayoutEffect`. An effect that needs a control's final size waits for its layout events (`LayoutUpdated`, `SizeChanged`).

## Share values with context

```rust
use ferroui_view::prelude::*;

#[derive(Clone)]
struct Accent(&'static str);

#[component(rerender)]
fn App() -> Element {
    provide_context(Accent("#0063B1"));
    rsx! { Toolbar {} }
}

#[component(rerender)]
fn Toolbar() -> Element {
    let accent = use_context::<Accent>().map_or("Gray", |accent| accent.0);
    rsx! { Border { background: accent, height: 4.0 } }
}
```

`use_context` returns `None` when no component above provides the type. A memoized component does not run again because its parent provides a different context value; provide a signal in the context when the value changes, and read the signal below.

## Mix fine-grained values into a component

Reading a signal in the function makes the whole component run again. Passing the signal to a property instead (`text: count`, or `text: move || ..`) changes only that property, and the component does not run. Use the second form for values that change often, such as a progress gauge, while the structure of the screen is written as in React. `for_each`, `show`, and `dynamic` work inside a component that runs again too.

## What the reconciler keeps

| A new element at the same place | Result |
| --- | --- |
| The same control class or component type | Patched: the control or the component's hooks are kept |
| A different class or type | The old subtree is removed and a new one mounted |
| A keyed sibling (`key: item.id`) | Matched by key, wherever it moved; keyed lists are reordered with the fewest moves |
| A sibling without a key | Matched by its place among the siblings without a key |
| A property with an equal plain value | Left alone |
| A property that is gone | Cleared back to its default or style value |
| A handler | When the run attaches the same handlers in the same order, they stay attached and their closures are swapped in place |

Give the items of a list a stable `key`, as in React. In debug builds, missing and duplicate keys are reported as diagnostics; see [hot reload & inspector]({{BASE}}/declarative/tools/). A run is synchronous: it happens when the write that caused it ends, with no scheduler that defers or splits work. Keep expensive computation out of component bodies and in memos, services, or [futures]({{BASE}}/declarative/patterns/).

## Pass typed values

A component parameter takes what a setter takes, so `rgb(0x1E293B)`, `star(1.0)` or `ctrl(KeyCode::S)` work as arguments when the parameter has the matching type. The forms are listed under [patterns]({{BASE}}/declarative/patterns/). Use text for a value that comes from data.

## Try the samples

```sh
cargo run -p hello-world-hooks
cargo run -p seven-guis-crud-hooks
cargo run -p todo-mvc
```

The [hooks versions of the 7GUIs](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/SevenGuis/Hooks) compute derived values in the function and let the reconciler patch: the CRUD's filtered list as a keyed `for`, the flight booker's dates, the circle drawer's undo history. [TodoMVC](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/TodoMvc) keeps its list in a signal that the components below receive as a parameter.

## Public APIs

- [`component`]({{BASE}}/api/ferroui-view-macros/proc_macro-component/) and [`rerender`]({{BASE}}/api/ferroui-view/element/function-rerender/) — components that run again.
- [`use_signal`]({{BASE}}/api/ferroui-view/hooks/function-use_signal/), [`use_memo`]({{BASE}}/api/ferroui-view/hooks/function-use_memo/), [`use_effect`]({{BASE}}/api/ferroui-view/hooks/function-use_effect/), [`use_effect_with`]({{BASE}}/api/ferroui-view/hooks/function-use_effect_with/), and [`use_hook`]({{BASE}}/api/ferroui-view/hooks/function-use_hook/) — hooks.
- [`provide_context`]({{BASE}}/api/ferroui-view/reactive/function-provide_context/) and [`use_context`]({{BASE}}/api/ferroui-view/reactive/function-use_context/) — context.
- [`on_cleanup`]({{BASE}}/api/ferroui-view/reactive/function-on_cleanup/) and [`batch`]({{BASE}}/api/ferroui-view/reactive/function-batch/) — cleanup and grouped writes.
- [Coming from React]({{BASE}}/declarative/react/) maps React's APIs one by one.
