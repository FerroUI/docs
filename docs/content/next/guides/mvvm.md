---
title: "Build a view model with ReactiveUI"
description: "Create notifying state, expose it to XAML, connect commands, and manage view lifetimes."
---

Use MVVM when several views display or edit the same application state, or when views are written in XAML. The **model** holds domain data, the **view model** exposes state and actions, and the **view** binds controls to them. You can test a view model without opening a window. FerroUI's ReactiveUI, DynamicData, and Rx libraries are crates of the release; only their integration with the controls depends on the user interface.

MVVM is one way to structure state. A declarative application can instead keep view state in signals and hooks and call services directly ([components and hooks]({{BASE}}/declarative/components/)), and the two meet in the middle: a component can read a view model from its data context. The ReactiveDemo sample exists in both forms, as a view model with XAML views and as components.

This guide builds the state for a search field. Start with a [working application]({{BASE}}/start/first-application/); keep the ReactiveUI dependencies at the same version as the rest of FerroUI.

## 1. Create notifying state

A plain Rust field does not notify bindings. `reactive_properties!` creates getters and setters that raise change notifications; `reactive_object!` implements the reactive notification traits.

```rust
use std::rc::Rc;
use ferroui_reactiveui::{reactive_object, reactive_properties, ReactiveObject};

reactive_properties! {
    #[derive(Default)]
    pub struct SearchViewModel {
        reactive: ReactiveObject,
        #[reactive]
        search_text: String,
    }
}
reactive_object!(SearchViewModel);

let model = Rc::new(SearchViewModel::default());
model.set_search_text("FerroUI".to_owned());
assert_eq!(model.search_text(), "FerroUI");
```

The Rust getter is `search_text`; its notification name is `SearchText`. Keep that name consistent with the property you expose to XAML. The state above is usable from Rust; XAML needs the registration in the next step as well.

## 2. Expose the property to XAML

Application types need markup metadata. The reactive macro supplies notifications, but it does not register a XAML property. For a complete registration example, follow [DynamicDataViewModel](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/ReactiveUIExample/ViewModels/dynamic_data_view_model.rs): its `ferro_markup_type!` declaration exposes `SearchText` with a getter and setter and uses the same notification name.

Register the application's types before loading markup. Give the view the model as its `DataContext`, or use a typed reactive view and its `ViewModel` property as the samples do. Then the view can read and edit the registered property. This fragment explicitly uses reflection; for compiled markup, prefer [a typed binding]({{BASE}}/xaml/compilation/#migrate-to-compiled-bindings-by-default) once the registered type is known:

```xml
<StackPanel xmlns="https://github.com/ferroui" Spacing="8">
  <TextBlock Text="Search packages" />
  <TextBox Text="{ReflectionBinding SearchText, Mode=TwoWay}"
           PlaceholderText="Package name" />
  <TextBlock Text="{ReflectionBinding SearchText}" />
</StackPanel>
```

Typing should change the model and the second label. If it does not, check `DataContext`, the registered getter/setter, and `SearchText` notifications in that order. The [binding guide]({{BASE}}/guides/binding/) includes a runnable named-control example to isolate binding behavior from model registration.

## 3. Initialize ReactiveUI with the application

The desktop builder must install the ReactiveUI integration before views start using its UI scheduler. This fragment belongs in your existing application builder; `App` is your application type.

```rust
use ferroui_controls::AppBuilder;
use ferroui_desktop::AppBuilderDesktopExtensions;
use ferroui_reactiveui::ReactiveUIBuilder;
use ferroui_reactiveui_controls::AppBuilderExtensions;

let builder = AppBuilder::configure::<App>()
    .use_platform_detect()
    .use_reactive_ui(|_: &ReactiveUIBuilder| {});
```

If the markup uses reactive controls, also call `ferroui_reactiveui_controls::register_types()` during type registration. The [ReactiveDemo entry point](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/ReactiveDemo/program.rs) shows the complete startup path.

## 4. Add actions and derived state

| Need | Use | Next guide |
| --- | --- | --- |
| A Save or Search action | `ReactiveCommand`, adapted for a control's `Command` property | [Commands]({{BASE}}/guides/commands/) |
| A value calculated from other properties | `when_any_value` and `to_property` | [Binding]({{BASE}}/guides/binding/) |
| A filtered or sorted list | `SourceCache` and a notifying output collection | [Collections]({{BASE}}/guides/collections/) |
| A request that completes later | A task, loading/error state, and cancellation | [Async work]({{BASE}}/guides/async/) |
| A view chosen from a view-model type | View registration and `ViewModelViewHost` | [Navigation]({{BASE}}/guides/navigation/) |

Keep services such as file access or searching behind ordinary Rust interfaces and pass them into the model. A view model should not need to locate a `TextBox` to learn the query.

## 5. Give subscriptions a lifetime

Create view bindings inside `when_activated` and add their disposables to the activation's collection. Deactivation releases those bindings. Keep long-lived model state separate from view subscriptions so navigating away does not leak handlers or discard persisted data accidentally.

View models and reactive observables use `Rc` and stay on their owning thread. Send plain data to workers, then create or update view models on the UI thread. See [async work]({{BASE}}/guides/async/) before using a background command.

## Use a view model from a component

A component mounted under a view with a data context reads it with `use_data_context::<T>()` and runs again when it changes. For example, a component that receives an `Rc<SearchViewModel>` as its data context can read the model, call its methods from handlers, and show its state. The `reactiveui` feature of `ferroui-view` adds builders for the ReactiveUI controls (`view_model_view_host()`, `routed_view_host()`). See [components with XAML]({{BASE}}/declarative/xaml-interop/).

## Bind a view model from builders

For a view model used from Rust views, `#[derive(ViewModel)]` declares each property once, and `Person::NAME.two_way()` binds it with no path text. See [typed bindings]({{BASE}}/guides/binding/). A ReactiveUI view model keeps its own setters and binds with `ModelProperty::with_raised_name`, whose name the compiler cannot check.

## Run the complete application

From the matching source checkout:

```sh
cargo run -p reactive-demo --no-default-features
cargo test -p reactive-demo
```

The sample searches an in-memory catalog in this configuration. Type a query, wait for the debounce, select a result, and inspect the view-model tests. [ReactiveUIExample](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ReactiveUIExample) adds commands, routing, and changing collections. Compare [ReactiveDemoComponents](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ReactiveDemoComponents) (`cargo run -p reactive-demo-components --no-default-features`), the same crate browser written as components: what the view model computes with `when_any_value` and `to_property` is computed there with hooks and `use_future`.

## Public APIs and controls

- [`ReactiveObject`]({{BASE}}/api/ferroui-reactiveui/reactive_object/struct-reactiveobject/), [`reactive_properties`]({{BASE}}/api/ferroui-reactiveui/macro-reactive_properties/), and [`reactive_object`]({{BASE}}/api/ferroui-reactiveui/macro-reactive_object/) — state and notifications.
- [`AppBuilderExtensions`]({{BASE}}/api/ferroui-reactiveui-controls/trait-appbuilderextensions/) — application integration.
- [`use_data_context`]({{BASE}}/api/ferroui-view/hooks/function-use_data_context/) — a view model read by a component.
- [`ReactiveCommand`]({{BASE}}/api/ferroui-reactiveui/reactive_command/struct-reactivecommand/) and [`ReactiveCommandAdapter`]({{BASE}}/api/ferroui-reactiveui-controls/struct-reactivecommandadapter/) — actions exposed to controls.
- [TextBox]({{BASE}}/controls/reference/textbox/), [TextBlock]({{BASE}}/controls/reference/textblock/), and [Button]({{BASE}}/controls/reference/button/) — input, output, and actions.
