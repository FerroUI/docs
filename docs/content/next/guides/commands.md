---
title: "Handle actions with commands"
description: "Create a command, connect it to a button, and handle availability, progress, and errors."
sidebar:
  order: 4
---

An action needs a trigger, an availability state, and a place for the application work. In declarative Rust, a handler calls the work directly and a property follows the availability. In XAML and MVVM, commands give a view an action and an availability state without putting application logic in a click handler: buttons bind their `Command` and optional `CommandParameter`, and the command's ability to execute can also control whether the button is enabled.

## Handle a click in declarative Rust

```rust
use ferroui_view::prelude::*;

#[component]
pub fn SaveForm() -> Element {
    let name = signal(String::new());
    let saved = signal(0);
    rsx! {
        StackPanel { spacing: 8.0,
            TextBox { text: name.two_way(), placeholder_text: "Display name" }
            Button {
                is_enabled: move || !name.with(|name| name.trim().is_empty()),
                on_click: move |_| {
                    save_profile(&name.get_untracked());
                    saved.update(|count| *count += 1);
                },
                "Save changes"
            }
            TextBlock { text: move || format!("Saved {} times", saved.get()) }
        }
    }
}
```

`save_profile` stands for the application's own function or service call. The button's `IsEnabled` follows the closure, so it is disabled while the name is empty. `get_untracked` reads the name without subscribing the handler. Keep the work itself in an ordinary Rust service that tests can call without a window; keep the handler a thin call into it. For work that completes later, start it from a signal that a `use_future` depends on and show its state with `suspense` ([async data]({{BASE}}/declarative/patterns/)).

## Bind a command in XAML

This fragment uses explicit reflection bindings because it omits your application’s registered source types. See [compiled binding setup]({{BASE}}/xaml/compilation/#migrate-to-compiled-bindings-by-default) for typed XAML.

```xml
<Button xmlns="https://github.com/ferroui"
        Content="Save changes"
        Command="{ReflectionBinding SaveCommand}" />
```

Expose the command through the view model's markup metadata. Construct it once for the view model's lifetime rather than allocating a new command every time a getter runs. ReactiveUI provides reactive commands and observable execution/error state; [the MVVM guide]({{BASE}}/guides/mvvm/) covers their Rust APIs.


## Connect a command to a button

For an existing application initialized with [ReactiveUI]({{BASE}}/guides/mvvm/), this fragment creates a command and assigns its adapter to a button:

```rust
use std::rc::Rc;
use ferroui_controls::Button;
use ferroui_reactiveui::ReactiveCommand;
use ferroui_reactiveui_controls::ReactiveCommandAdapter;

let save = ReactiveCommand::create(|| println!("Save requested"));
let button = Button::new();
button.set_content(Some(Rc::new("Save changes".to_owned())));
button.set_command(Some(ReactiveCommandAdapter::command_of(Rc::new(save))));
```

Add the button to your view to try it. In an MVVM application, keep the command in the model and expose the adapter through its registered `SaveCommand` property, as the XAML above expects. The reactive command trait and the control command trait are different; the adapter connects them.

For a real save operation, replace the printing callback with application work. Make its availability depend on valid input and observe `thrown_exceptions()` so failures become a useful status message. The [command lab](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/ReactiveUIExample/ViewModels/command_lab_view_model.rs) shows gating, running state, errors, and cancellation together.

## Asynchronous actions

An asynchronous command should make its running state visible. Disable conflicting actions, display progress, and surface errors in a form the user can act on. Deliver resulting control updates on the UI thread. Cancellation belongs to the operation's lifetime; leaving a view should not leave obsolete work updating a detached control.

## Events still have a role

In an MVVM view, use a direct event handler for behavior local to the view, such as a focus transition or a temporary pointer interaction, and a command for an action that should be exercised by tests or more than one UI entry point. A component's handlers (`on_click`, `on_key_down`, `on_lost_focus`, and the other routed events) play both roles; put the logic they call where tests can reach it.

## Common failures

If a button is unexpectedly disabled, inspect the command's execution predicate and whether it raises availability notifications. If it remains enabled while an operation is running, check the command's concurrency policy. An unregistered command property can produce an empty binding even when the Rust field exists.

## Public APIs and next steps

- [`signal`]({{BASE}}/api/ferroui-view/reactive/function-signal/) and [`rsx`]({{BASE}}/api/ferroui-view-macros/proc_macro-rsx/) — declarative handlers and availability.
- [`ReactiveCommand`]({{BASE}}/api/ferroui-reactiveui/reactive_command/struct-reactivecommand/) — creation, execution, and observable status.
- [`ReactiveCommandAdapter`]({{BASE}}/api/ferroui-reactiveui-controls/struct-reactivecommandadapter/) — connect to [Button]({{BASE}}/controls/reference/button/).
- [Forms and validation]({{BASE}}/guides/forms/) for Save availability; [async work]({{BASE}}/guides/async/) for long-running operations.
