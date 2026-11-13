---
title: "Build views with declarative Rust"
description: "Compose controls with builders or rsx, connect signals, and choose a component lifecycle."
---

Use `ferroui-view` to construct FerroUI controls in Rust with builders or `rsx!`. It uses the same controls, layout, themes, and public properties as XAML.

Start with a [working Rust application]({{BASE}}/start/first-application/) and add `ferroui-view` at the same version as your other FerroUI dependencies. Enable its `desktop` feature for `launch`; `xaml`, `treedatagrid`, `color-picker`, `dialogs`, and `reactiveui` enable the corresponding integrations.

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

## Pick a property update pattern

| Pass to a builder | What happens | Example |
| --- | --- | --- |
| A value | Set the property once | `.text("Welcome")` |
| A signal | Follow its current value | `.text(count)` |
| A closure reading signals | Recalculate when those signals change | `.text(move || format!("Count: {}", count.get()))` |
| A two-way signal | Also write edits back into state | `.text(draft.two_way())` |

For an editable field, create `let draft = signal(String::new());` inside the mounted view's lifetime, then pass `draft.two_way()` to `text_box().text(...)`.

## Use rsx for nested views

The counter can also be a component:

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

A component's Rust parameters become its properties. Use `Grid.row: 1` for an attached property, `class: "primary"` for a style class, and `key: item_id` for an item's stable identity.

## Choose whether the function runs again

`#[component]` runs once; properties follow signals directly. `#[component(rerender)]` runs again when it reads changing signals. In a rerendering component, create state with `use_signal` so it survives later runs. Keep hooks in the same order on every run. See [Coming from React]({{BASE}}/declarative/react/) for a complete example.

For changing child collections, use `for_each` with a stable key. For conditional content, use `show`, `show_else`, or `dynamic` in a view that runs once. An ordinary Rust `if` is evaluated only when its surrounding function runs.

## Clean up when a view ends

Signals and effects belong to an owner. Register resource cleanup with `on_cleanup`; do not retain a signal handle after its owner is disposed. Use `batch` when several writes should produce one group of updates.

Keep application records and durable services outside transient view state. When embedding existing XAML or controls, let one owner manage each subtree. Use the optional XAML integration rather than independently replacing children in a mounted component.

## Continue with your task

- [Arrange controls]({{BASE}}/design/layout/) and [style them]({{BASE}}/design/themes/).
- [Load data without blocking]({{BASE}}/guides/async/).
- Explore [SevenGuis](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/SevenGuis) for equivalent builder, macro, and hook implementations.

## Public APIs and controls

- [`Element`]({{BASE}}/api/ferroui-view/element/enum-element/), [`signal`]({{BASE}}/api/ferroui-view/reactive/function-signal/), and [`use_signal`]({{BASE}}/api/ferroui-view/hooks/function-use_signal/) — view descriptions and state.
- [`rsx`]({{BASE}}/api/ferroui-view-macros/proc_macro-rsx/) and [`component`]({{BASE}}/api/ferroui-view-macros/proc_macro-component/) — markup and component syntax.
- [`on_cleanup`]({{BASE}}/api/ferroui-view/reactive/function-on_cleanup/) — owned resource cleanup.
- [StackPanel]({{BASE}}/controls/reference/stackpanel/), [TextBox]({{BASE}}/controls/reference/textbox/), and [Button]({{BASE}}/controls/reference/button/) — controls used above.
