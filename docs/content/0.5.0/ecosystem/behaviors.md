---
description: "Attach reusable view interactions and connect lifecycle events to view-model commands."
title: Attach behaviors and actions
---

Behaviors package interaction rules that can be attached to existing controls in XAML. Use them when a rule belongs to a XAML view and should be reusable across several views. In declarative Rust, the same interactions are usually written directly as handlers (`on_click`, `on_key_down`, `on_loaded`), effects, and components, since the view is already code.

## Start with a working gallery

Run `cargo run -p behaviors-gallery` from the matching framework checkout. The [gallery sources](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/BehaviorsGallery) include event triggers, commands, focus, dragging, scrolling, validation, and asynchronous loading.

The `ferroui-xaml-behaviors` bundle registers enabled behavior families in the framework's default XML namespace. Add its dependency and call its `register_types()` before loading markup containing those types. The reactive integration is a separate optional feature; enable it deliberately when using ReactiveUI behaviors.

## Choose the right abstraction

Use a behavior for reusable view interactions, a trigger/action pair for a declarative reaction, and a view-model command for application work. Avoid making a behavior own business state that must survive the view.

Attached behaviors have a lifecycle. Subscribe when attached and release the subscription when detached. A control can be reattached or recycled; repeated attachment must not accumulate event handlers.

## Commands and data context

Bind command actions to the intended source explicitly. A behavior attached inside an item template may see the item's data context rather than the containing page's view model. Inspect the logical context and registered property names when a command binding is empty.

## Verify interaction

Test keyboard and pointer entry points, availability, detachment, and repeated activation. Dragging, clipboard, native windows, and focus behavior should be verified on each supported platform. The compact documentation runtime is intended for the core editable examples; use the full gallery to exercise these interactions.

## Run an action when a view attaches

After registering the behavior bundle, a view can forward lifecycle events to its model:

This fragment uses explicit reflection bindings because it omits your application’s registered source types. See [compiled binding setup]({{BASE}}/xaml/compilation/#migrate-to-compiled-bindings-by-default) for typed XAML.

```xml
<UserControl xmlns="https://github.com/ferroui">
  <Interaction.Behaviors>
    <EventTriggerBehavior EventName="AttachedToVisualTree">
      <InvokeCommandAction Command="{ReflectionBinding LoadedCommand}" />
    </EventTriggerBehavior>
    <EventTriggerBehavior EventName="DetachedFromVisualTree">
      <InvokeCommandAction Command="{ReflectionBinding UnloadedCommand}" />
    </EventTriggerBehavior>
  </Interaction.Behaviors>
  <TextBlock Text="View with lifecycle actions" />
</UserControl>
```

This fragment requires registered `LoadedCommand` and `UnloadedCommand` properties on the data context. Make the load action safe to repeat, and use unload to stop view-scoped work. The [gallery's SampleView](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/BehaviorsGallery/Views/SampleView.xaml) demonstrates the pattern.

For a button that already has `Command`, bind that property directly. Add a behavior when the control's existing API does not express the interaction you need.

## Public APIs and controls

- [`register_types`]({{BASE}}/api/ferroui-xaml-behaviors/function-register_types/) — register enabled behavior families.
- [UserControl]({{BASE}}/controls/reference/usercontrol/) — reusable view lifecycle; [Button]({{BASE}}/controls/reference/button/) for direct command binding.
- [Commands]({{BASE}}/guides/commands/) and [async cleanup]({{BASE}}/guides/async/).
