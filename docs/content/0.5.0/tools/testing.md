---
title: "Test applications and controls"
description: "Test models, bindings, controls, and platforms at the right layer with deterministic examples."
sidebar:
  order: 2
---

Use several layers of tests, each with a concrete purpose. Model and view-model tests exercise business behavior without a window. Headless tests exercise properties, layout, binding, and input. Rendering tests catch visual regressions. Platform tests cover integration with a real operating system or browser.


## Test time-dependent behavior without sleeping

With `ferroui-reactive-testing` as a development dependency, this example exercises an observable in virtual time:

```rust
use ferroui_reactive_testing::{assert_messages, ReactiveTest as RT, TestScheduler};

#[test]
fn records_values_after_subscription() {
    let scheduler = TestScheduler::new();
    let source = scheduler.create_hot_observable(vec![
        RT::on_next(150, 1),
        RT::on_next(210, 2),
        RT::on_completed(250),
    ]);
    let observed = source.as_observable();
    let result = scheduler.start(move || observed.clone());
    assert_messages!(result.messages(), RT::on_next(210, 2), RT::on_completed::<i32>(250));
}
```

The standard `start` schedule subscribes at virtual time 200, so the earlier value is absent. This makes the expectation deterministic. Use the same approach to test a search debounce just before and after its boundary, rather than waiting for wall-clock time.

For a complete application test suite:

```sh
cargo test -p reactive-demo
```

Read its [view-model tests](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ReactiveDemo/tests) to see substitute services and observable assertions together.

## Test declarative views

Keep the logic of a declarative view in plain Rust beside it, as the 7GUIs samples keep theirs in a model crate without user interface, and test that directly. Then drive the mounted view with the scenario of a user: what is typed and clicked, and what must be shown.

```sh
cargo test -p seven-guis-tests
cargo test -p todo-mvc
cargo test -p reactive-demo-components
```

`seven-guis-tests` runs one scenario per task on each of the builder, macro, and hook versions. The [TodoMVC tests](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/TodoMvc/tests.rs) start the test application of `ferroui-controls` (`UnitTestApplication::start`), create a root `Owner`, mount the application component with a list and a route given as parameters (`app().todos(..).path(..)`, then `element.mount()`), find controls by `Name`, and raise input on them as a user would. Name the controls a test reads (`name: "NewTodo"`), and keep signals the test needs to inspect by creating them under the same owner. `mounted_trees()` and `view_stats()` describe the mounted components and count the work a run did, for tests that check what was kept or patched.

## Test the state model

Construct the view model directly. Change inputs, execute commands, advance a virtual scheduler where relevant, and assert observable state. Test failure and cancellation as well as successful completion.

## Test controls

Use the headless platform for deterministic control behavior. Install the expected theme and fonts when layout depends on them. Do not depend on timing sleeps when you can wait for dispatcher or rendering completion.

## Test rendering

Keep rendering fixtures small and intentional. A screenshot comparison should protect a behavior that matters, such as clipping, alignment, text rendering, or visual state. Account for renderer and platform differences explicitly rather than continually replacing baselines.

## Test browsers and native services

Drive browser examples with real pointer and keyboard input, then inspect state after a frame is drawn. Test supported rendering modes and browsers. File pickers, native hosting, input methods, and assistive technologies need platform-level verification.

The documentation build also checks that its example XML is valid, exported source matches displayed source, and links and agent indexes resolve within the selected version.

## Choose the smallest test that proves the behavior

| Behavior | Suitable test |
| --- | --- |
| An invalid name prevents saving | View-model validation and command test |
| A property update reaches the label | Binding test with initialized controls |
| A template clips a long message | Focused rendering fixture |
| A picker opens the operating-system dialog | Native platform test |
| A browser input accepts typing | Browser input test against the real runtime |

## Public APIs and controls

- [`TestScheduler`]({{BASE}}/api/ferroui-reactive-testing/struct-testscheduler/) — deterministic observable time.
- [`HeadlessUnitTestSession`]({{BASE}}/api/ferroui-headless/struct-headlessunittestsession/) and [`HeadlessWindowExtensions`]({{BASE}}/api/ferroui-headless/trait-headlesswindowextensions/) — public headless testing support.
- [TextBox]({{BASE}}/controls/reference/textbox/) and [Button]({{BASE}}/controls/reference/button/) — input and command behavior worth exercising.
- [Forms]({{BASE}}/guides/forms/) and [async work]({{BASE}}/guides/async/) for concrete cases.
