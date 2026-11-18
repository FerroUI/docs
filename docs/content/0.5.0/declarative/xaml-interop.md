---
title: "Combine components and XAML"
description: "Show a component inside XAML or any control tree, load XAML inside a component, and read a view model from a component."
---

Declarative Rust and XAML are two ways to create the same controls, so they can host each other. A XAML view can show a component, a component can show a XAML document (compiled or loaded at run time), and a component inside an MVVM view can read the view model. Use this to adopt components in an existing XAML application, or to reuse XAML documents from a component-based one.

## Show a component in another tree

`ComponentHost` is a control (a `Decorator`) that shows an element:

```rust
use ferroui_view::prelude::*;

let host = ComponentHost::with_view(|| rsx! { Counter {} });
some_panel.children().add(host);
```

The element is mounted when the host is given it, under the owner that was current then, so contexts reach it. It is disposed, with its effects, hooks, and handlers, when the host leaves the visual tree, and mounted again when the host is attached again.

## Show a component in XAML

Register the types of `ferroui-view` for markup and register the component by name, then name it in the `Component` property of a `ComponentHost`:

```rust
ferroui_view::register_types();
ferroui_view::register_component("Counter", || rsx! { Counter {} });
```

```xml
<UserControl xmlns="https://github.com/ferroui" xmlns:view="using:FerroUI.View">
  <view:ComponentHost Component="Counter" />
</UserControl>
```

`register_types` registers the namespace `FerroUI.View`, so both `using:FerroUI.View` and `clr-namespace:FerroUI.View;assembly=FerroUI.View` resolve. The [HelloWorld.ComponentHost sample](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/HelloWorld.ComponentHost) is a compiled XAML window whose content is a registered `rsx!` component: `cargo run -p hello-world-component-host`.

## Read the view model from a component

| Hook | Gives |
| --- | --- |
| `use_data_context::<T>()` | The `DataContext` of the control the component is mounted in, when it is a `T`; the component runs again when it changes |
| `use_data_context_value()` | The same, untyped |
| `use_parent_control()` | The control the component is mounted in; `None` at the root of a tree |

```rust
use ferroui_view::prelude::*;

#[derive(Clone, PartialEq, Debug)]
pub struct Person {
    pub id: u32,
    pub name: String,
}

fn register_badge() {
    ferroui_view::register_component("Badge", || {
        rerender(|| {
            let text = match use_data_context::<Person>() {
                Some(person) => format!("Person {}: {}", person.id, person.name),
                None => String::from("No person"),
            };
            rsx! { TextBlock { text } }
        })
    });
}
```

A host placed in an MVVM view therefore shows its view model, and a data template whose items are components reads each item the same way. An element can also bind a property through the property system with `.bind(property, binding)`, for paths on the data context.

## Load XAML inside a component

With the `xaml` feature of `ferroui-view`:

| Function | Does |
| --- | --- |
| `load_xaml(text)` | Loads XAML text whose root is a control; find its named controls with `find_control` or `get_control` of the root |
| `load_xaml_uri("ferres://assembly/path.xaml")` | Loads a document: its compiled markup when the assembly registered it, the run-time loader otherwise |
| `xaml(text)` | An element of the loaded control, for a component that runs once |
| `use_xaml(text_or_uri)` | A hook: the control is loaded on the first run and kept on later runs |

From the ViewInterop sample, a component that runs again keeps a compiled XAML document and fills its named controls when the selection changes:

```rust
let details: Ref<Control> = use_xaml("ferres://ViewInterop/Details.xaml");
use_effect_with(person.clone(), {
    let details = details.clone();
    move |person| {
        if let Some(person) = person {
            details.get_control::<TextBlock>("Title").set_text(Some(person.name.as_str()));
        }
    }
});
rsx! { Border { {Element::Existing(details)} } }
```

`Element::Existing` places a control that already exists, such as a XAML user control or a control the application keeps, in the element tree. To compile a document that a component loads by URI, the crate compiles its markup in its build script and registers the compiled loader table; the sample's [`register_types.rs`](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/ViewInterop/register_types.rs) shows the registration, and the generated code creates `ComponentHost` directly. See [compile or load XAML]({{BASE}}/xaml/compilation/).

## Keep one owner per subtree

The reconciler owns the controls it mounted. Do not add or remove children of those controls from XAML code or other Rust code; place foreign content through `Element::Existing`, `use_xaml`, or a `ComponentHost`. Inside a XAML document, the component under a `ComponentHost` belongs to the host, and its lifetime follows the host's attachment.

## Run the sample

```sh
cargo run -p view-interop
```

[ViewInterop](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ViewInterop) shows a directory of 10,000 people in a virtualized `ListBox` whose item template is a component, the details of the selected person as compiled XAML loaded with `use_xaml`, and, inside that XAML, a `ComponentHost` with the registered component `Badge` reading the person from its data context.

## Public APIs

- [`ComponentHost`]({{BASE}}/api/ferroui-view/prelude/struct-componenthost/), [`register_component`]({{BASE}}/api/ferroui-view/function-register_component/), and [`register_types`]({{BASE}}/api/ferroui-view/function-register_types/) — components in other trees and in XAML.
- [`use_data_context`]({{BASE}}/api/ferroui-view/hooks/function-use_data_context/) and [`use_parent_control`]({{BASE}}/api/ferroui-view/hooks/function-use_parent_control/) — the hosting control and its data.
- [`use_xaml`]({{BASE}}/api/ferroui-view/xaml/function-use_xaml/), [`load_xaml`]({{BASE}}/api/ferroui-view/xaml/function-load_xaml/), [`load_xaml_uri`]({{BASE}}/api/ferroui-view/xaml/function-load_xaml_uri/), and [`xaml`]({{BASE}}/api/ferroui-view/xaml/function-xaml/) — XAML in a component.
- [MVVM]({{BASE}}/guides/mvvm/) and [XAML]({{BASE}}/xaml/overview/) for the other side.
