---
title: "Create a reusable control"
description: "Choose reusable composition or a templated control and define its public behavior."
sidebar:
  order: 4
---

First decide whether you need a reusable composition or a new behavior contract. A UserControl can package a view. A templated control exposes properties and lets consumers replace its visuals through a template.


## Start with a reusable composition

A labeled settings group usually needs composition, not new input behavior. This view fragment can become the content of a `UserControl`:

```xml
<UserControl xmlns="https://github.com/ferroui">
  <StackPanel Spacing="8">
    <TextBlock Text="Notifications" FontSize="20" />
    <CheckBox Content="Send email updates" />
    <CheckBox Content="Show desktop notifications" />
  </StackPanel>
</UserControl>
```

Move the view into your application's normal XAML registration/build flow. Bind the options to model properties once the layout works. Keep its inherited data context usable by consumers instead of unconditionally replacing it inside the control.

If consumers need to restyle the entire visual structure, define a templated control instead. Write down its properties, events, default values, keyboard behavior, and required template parts before adding rendering code. The [HamburgerMenu sample](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/SampleControls/HamburgerMenu/hamburger_menu.rs) shows a complete application control declaration.

## Define the public contract

Choose the base class, content model, styled/direct properties, events, and required template parts. Register markup metadata if consumers should construct the control from XAML. Provide defaults that work before the first property assignment.

A Rust method alone does not establish a styled property. Use the framework's property registration and class declaration patterns so binding, inheritance, styling, and diagnostics can all see the value.

## Respect the lifecycle

Release template-part subscriptions when a template is replaced. Avoid retaining a detached visual tree through a closure. A control can attach, detach, or receive a new template more than once during its lifetime.

Call the relevant base implementation when overriding framework behavior unless the contract explicitly requires replacement. Keep UI-thread restrictions consistent with the rest of the control system.

## Test behavior and presentation

Test default properties, notification, input behavior, retemplating, resource changes, and disposal. Use headless tests for deterministic control behavior and rendering tests for visuals that matter to the contract.

Use `samples/SampleControls` and existing framework controls as implementation references, then consult the generated API for the exact traits and registration signatures of your documented version.

## Public APIs and controls

- [UserControl]({{BASE}}/controls/reference/usercontrol/) — reusable view composition.
- [`TemplatedControl`]({{BASE}}/api/ferroui-controls/primitives/struct-templatedcontrol/) — a replaceable visual template.
- [`StyledProperty`]({{BASE}}/api/ferroui-base/struct-styledproperty/) — a property that participates in styling and binding.
- [CheckBox]({{BASE}}/controls/reference/checkbox/) — reuse its option and keyboard behavior.
- [XAML registration]({{BASE}}/xaml/compilation/), [themes]({{BASE}}/design/themes/), and [testing]({{BASE}}/tools/testing/).
