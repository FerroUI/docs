---
title: "Build views with declarative Rust"
description: "Compose controls with builders or rsx!, hold state in signals, memos, and effects, and choose a component model."
---

`ferroui-view` writes FerroUI user interfaces in plain Rust. It is the primary way to build a FerroUI view: builders generated for every control, an `rsx!` macro for the tree, fine-grained signals, memos, and effects for state, and function components with hooks and a reconciler. The controls, layout, themes, styles, and bindings are the same ones XAML uses, so the two can be mixed in one application.

Start with a [working Rust application]({{BASE}}/start/first-application/) and add `ferroui-view` at the same version as your other FerroUI dependencies. Enable its `desktop` feature for `launch`; `xaml`, `treedatagrid`, `color-picker`, `dialogs`, `reactiveui`, and `hot-reload` enable the corresponding integrations. Import `ferroui_view::prelude::*` for the builders, the control names used by `rsx!`, signals, and hooks.

## Build a working counter

With the `desktop` feature enabled, this is a complete entry point:

```rust
use ferroui_view::prelude::*;

fn counter() -> Element {
    let count = signal(0);
    stack_panel()
        .spacing(8.0)
        .child(text_box().text(count).is_read_only(true).width(80.0))
        .child(button().content("Count").on_click(move |_| count.update(|c| *c += 1)))
        .into()
}

fn main() {
    ferroui_view::launch(|| {
        window().title("Counter").width(320.0).height(160.0)
            .child(counter()).into()
    });
}
```

Click **Count**. The signal changes and the text property follows it; you do not need to find the text box and set it manually. `Element` describes the view, while the host creates and owns the actual controls.

## Builders

For every control class there is a function that starts its element (`button()`, `stack_panel()`, `list_box()`), a setter per registered property (`.spacing(8.0)`), and a handler per routed event (`.on_click(..)`). Attached properties have setters named after their owner (`.grid_row(1)`, `.dock_panel_dock(..)`). The element also has its own methods:

| Method | What it does |
| --- | --- |
| `key(..)`, `name(..)`, `class("a b")` | The key among siblings, the `Name`, style classes |
| `child(..)`, `children((a, b, c))` | Children: elements, builders, text, vectors, arrays, tuples |
| `set(property, value)` | Any property, including one of another crate |
| `bind(property, binding)` | A binding of the property system on the data context |
| `on(event, handler)`, `on_changed(property, handler)` | Any routed event; the new value of a property whenever it changes |
| `with(\|control\| ..)`, `node_ref(r)` | The control once it is made; keep it in a `NodeRef` |
| `row_definitions("Auto,*")`, `column_definitions(..)` | Grid rows and columns, written as XAML writes them |

Setters convert their argument: numbers to `f64` and to text, `f64` and tuples to `Thickness` (`margin: (0.0, 8.0, 0.0, 0.0)`), `f64` to `CornerRadius`, and a `Color`, a color name, or `#rgb` text to a brush. A property that holds an object (`content`, `header`) also takes an element. The builders are generated from the controls' sources, so they cover the whole control set, and the TreeDataGrid, the color picker, the dialogs, and the ReactiveUI controls behind features.

## Pick a property update pattern

| Pass to a setter | What happens | Example |
| --- | --- | --- |
| A value | Set the property once | `.text("Welcome")` |
| A signal or a memo | Follow its current value | `.text(count)` |
| A closure reading signals | Recalculate when those signals change | `.text(move \|\| format!("Count: {}", count.get()))` |
| A two-way signal | Also write edits back into state | `.text(draft.two_way())` |
| `Bind(binding)` | Bind through the property system | a view-model path on the data context |

For an editable field, create `let draft = signal(String::new());` inside the mounted view's lifetime, then pass `draft.two_way()` to `text_box().text(...)`.

## Use rsx for nested views

The counter can also be a component written with `rsx!`:

```rust
use ferroui_view::prelude::*;

#[component]
pub fn Counter() -> Element {
    let count = signal(0);
    rsx! {
        StackPanel { spacing: 8.0,
            TextBox { text: count, is_read_only: true, width: 80.0 }
            Button { on_click: move |_| count.update(|c| *c += 1), "Count" }
        }
    }
}
```

`Name { .. }` is an element of a control or a component in scope; `name: value` calls the setter of the same name; `Owner.name: value` sets an attached property (`Grid.row: 1`, `DockPanel.dock: ..`); `"text"`, `{expr}`, and nested elements are children; `if` and `for` choose or repeat children when the tree is built. Use `class: "primary"` for a style class and `key: item_id` for an item's stable identity. An attribute a control has no setter for is a compile error that points at the attribute.

A component's Rust parameters become its properties. A parameter is required unless it has `#[prop(default)]`, `#[prop(default = expr)]`, or an `Option` type; a parameter `children: Element` takes the element's children. The macro also declares a builder in snake case, so `Counter {}` in `rsx!` and `counter()` with the builders are the same component.

## Signals, memos, and effects

`signal(value)` holds state; `get`, `set`, `update`, and `with` read and change it. Handles are `Copy`, so a `move` closure takes them without cloning. Inside a view function:

```rust
use ferroui_view::prelude::*;

let first = signal(String::from("Ada"));
let last = signal(String::from("Lovelace"));
let full = memo(move |_| format!("{} {}", first.get(), last.get()));
effect(move || println!("Now showing {}", full.get()));
```

A memo is a value computed from the signals it reads and read like a signal; its closure receives the previous value. An effect records the signals and memos it reads and runs again when one of them changes. `batch(|| ..)` runs the effects once after several writes; `untrack(|| ..)` reads without subscribing.

Every signal, memo, and effect belongs to the `Owner` that was current when it was made, and is disposed with it: a mounted tree has an owner, which ends when its window closes, and each item of a dynamic list has its own. Register cleanup with `on_cleanup` (a timer stopped, a subscription disposed); using a handle after its owner ended panics.

## Children that follow state

| Function | Children |
| --- | --- |
| `for_each(each, key, view)` | One per item, kept by key: an item whose key and value stay keeps its control |
| `show(when, then)`, `show_else(when, then, otherwise)` | The branch's children, made again only when the condition changes |
| `dynamic(render)` | Whatever the closure returns, made again when what it read changes |

They are elements that a parent mounts in place among its other children. An ordinary Rust `if` or `for` is evaluated only when its surrounding function runs, so use these in a view that runs once.

## Choose whether the function runs again

`#[component]` runs once; properties and children follow signals directly, and a change touches only what follows it. `#[component(rerender)]` runs again when it reads changing signals, and a reconciler patches the controls it made, as React does. In a rerendering component, create state with `use_signal` so it survives later runs, and keep hooks in the same order on every run. Both models produce the same elements, so either can be a child of the other. See [components and hooks]({{BASE}}/declarative/components/).

## Keep ownership clear

Keep application records and durable services outside transient view state. When embedding existing XAML or controls, let one owner manage each subtree. Use the optional XAML integration rather than independently replacing children in a mounted component.

## Continue with your task

- [Components and hooks]({{BASE}}/declarative/components/): state across runs, effects, context, the reconciler.
- [Lists, async data, and routing]({{BASE}}/declarative/patterns/): keyed lists, `use_future`, error boundaries, the router.
- [Styles, themes, and motion]({{BASE}}/declarative/styling/), and [components with XAML]({{BASE}}/declarative/xaml-interop/).
- [Arrange controls]({{BASE}}/design/layout/) and [load data without blocking]({{BASE}}/guides/async/).
- Explore [SevenGuis](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/SevenGuis) for equivalent builder, macro, and hook implementations of the seven 7GUIs tasks.

## Public APIs and controls

- [`Element`]({{BASE}}/api/ferroui-view/element/enum-element/), [`signal`]({{BASE}}/api/ferroui-view/reactive/function-signal/), [`memo`]({{BASE}}/api/ferroui-view/reactive/function-memo/), and [`effect`]({{BASE}}/api/ferroui-view/reactive/function-effect/) — view descriptions and state.
- [`rsx`]({{BASE}}/api/ferroui-view-macros/proc_macro-rsx/) and [`component`]({{BASE}}/api/ferroui-view-macros/proc_macro-component/) — markup and component syntax.
- [`for_each`]({{BASE}}/api/ferroui-view/prelude/function-for_each/), [`show`]({{BASE}}/api/ferroui-view/prelude/function-show/), and [`dynamic`]({{BASE}}/api/ferroui-view/prelude/function-dynamic/) — children that follow state.
- [`on_cleanup`]({{BASE}}/api/ferroui-view/reactive/function-on_cleanup/), [`batch`]({{BASE}}/api/ferroui-view/reactive/function-batch/), and [`Owner`]({{BASE}}/api/ferroui-view/reactive/struct-owner/) — lifetimes and updates.
- [StackPanel]({{BASE}}/controls/reference/stackpanel/), [TextBox]({{BASE}}/controls/reference/textbox/), and [Button]({{BASE}}/controls/reference/button/) — controls used above.
