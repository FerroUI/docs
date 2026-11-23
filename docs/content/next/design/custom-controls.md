---
title: "Create a reusable control"
description: "Choose reusable composition or a templated control and define its public behavior."
sidebar:
  order: 4
---

First decide whether you need a reusable composition or a new behavior contract. In declarative Rust, a component packages a view; in XAML, a UserControl does. A templated control exposes properties and lets consumers replace its visuals through a template.

## Start with a reusable composition

A labeled settings group usually needs composition, not new input behavior. As a component, its parameters are its properties:

```rust
use ferroui_view::prelude::*;

#[component]
pub fn NotificationSettings(email: Signal<bool>, desktop: Signal<bool>) -> Element {
    rsx! {
        StackPanel { spacing: 8.0,
            TextBlock { text: "Notifications", font_size: 20.0 }
            CheckBox { is_checked: email.two_way(), "Send email updates" }
            CheckBox { is_checked: desktop.two_way(), "Show desktop notifications" }
        }
    }
}
```

A component is used like a control (`NotificationSettings { email, desktop }` in `rsx!`, or `notification_settings().email(..)` with its builder), and can be shown inside XAML through a `ComponentHost` ([components with XAML]({{BASE}}/declarative/xaml-interop/)).

In XAML, this view fragment can become the content of a `UserControl`:

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

## Write the theme in Rust

A templated control can have its whole theme in Rust, with no XAML. The builders make the same `ControlTheme`, setters, and template parts as compiled XAML:

```rust
use ferroui_base::styling::ControlTheme;
use ferroui_base::Ref;
use ferroui_controls::presenters::ContentPresenter;
use ferroui_controls::primitives::{TemplatedControl, ToggleButton};
use ferroui_controls::{Border, ContentControl};
use ferroui_themes_fluent::keys;
use ferroui_view::prelude::*;

fn chip_theme() -> Ref<ControlTheme> {
    control_theme::<ToggleButton>()
        .set(TemplatedControl::padding_property(), (12.0, 4.0))
        .dynamic_resource(TemplatedControl::background_property(), keys::SystemControlBackgroundAltHighBrush)
        .template(|| {
            border()
                .name("PART_Border")
                .template_bind(Border::background_property(), TemplatedControl::background_property())
                .child(
                    content_presenter()
                        .name("PART_ContentPresenter")
                        .template_bind(ContentPresenter::content_property(), ContentControl::content_property())
                        .template_bind(ContentPresenter::padding_property(), TemplatedControl::padding_property()),
                )
                .into_element()
        })
        .nested(
            style(nesting().checked().template().of::<Border>())
                .dynamic_resource(Border::background_property(), keys::SystemControlHighlightAccentBrush),
        )
        .build()
}
```

Give it to one control with `.theme(chip_theme())`, or to every control of the class with `resource_dictionary().control_theme(chip_theme())`.

- A template body is a plain function, so a closure that captures nothing adds no generic code. Use `control_template_with` for a template that must capture.
- Elements with a name are template parts, found through the name scope in `on_apply_template`.
- Values and bindings in a template have template priority, so a style with a condition overrides them, as in XAML. A signal or closure on a template element stays a local value, which such a style does not override.

Write the theme in XAML when designers edit it or when you want hot reload.

## Test behavior and presentation

Test default properties, notification, input behavior, retemplating, resource changes, and disposal. Use headless tests for deterministic control behavior and rendering tests for visuals that matter to the contract.

Use `samples/SampleControls` and existing framework controls as implementation references, then consult the generated API for the exact traits and registration signatures of your documented version.

## Public APIs and controls

- [`component`]({{BASE}}/api/ferroui-view-macros/proc_macro-component/) — reusable declarative composition.
- [UserControl]({{BASE}}/controls/reference/usercontrol/) — reusable XAML view composition.
- [`TemplatedControl`]({{BASE}}/api/ferroui-controls/primitives/struct-templatedcontrol/) — a replaceable visual template.
- [`StyledProperty`]({{BASE}}/api/ferroui-base/struct-styledproperty/) — a property that participates in styling and binding.
- [CheckBox]({{BASE}}/controls/reference/checkbox/) — reuse its option and keyboard behavior.
- [XAML registration]({{BASE}}/xaml/compilation/), [themes]({{BASE}}/design/themes/), and [testing]({{BASE}}/tools/testing/).
