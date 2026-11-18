---
title: "Build accessible interfaces"
description: "Label inputs, preserve keyboard and focus behavior, and verify an accessible user journey."
sidebar:
  order: 3
---

Accessibility includes understandable labels, predictable keyboard operation, visible focus, semantic roles, and a usable reading order. It must be considered while choosing controls and structuring views.


## Give a field a persistent label

A placeholder disappears as soon as the user enters text. Use a visible label and an explicit label relationship:

```xml
<StackPanel xmlns="https://github.com/ferroui"
            xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml" Spacing="8">
  <TextBlock x:Name="NameLabel" Text="Display name" />
  <TextBox AutomationProperties.LabeledBy="{Binding #NameLabel}"
           PlaceholderText="For example, Ada" />
  <Button Content="Save profile" />
</StackPanel>
```

In declarative Rust, attached properties are written with their owner's name, so the accessible name of the field is `AutomationProperties.name` in `rsx!` (`.automation_properties_name(..)` with the builders):

```rust
use ferroui_view::prelude::*;

let field = rsx! {
    StackPanel { spacing: 8.0,
        TextBlock { text: "Display name" }
        TextBox { AutomationProperties.name: "Display name", placeholder_text: "For example, Ada" }
        Button { "Save profile" }
    }
};
```

Tab to the input and check that the platform's screen reader announces “Display name.” The save action should be understandable out of context. For an icon-only action, set `AutomationProperties.Name` to the action, such as “Open settings,” rather than the icon's shape.

## Use the control's behavior

A Button already has activation and focus behavior. Replacing it with a clickable border makes the application responsible for rebuilding those semantics. Prefer the built-in control and customize its template carefully.

Give inputs meaningful labels and actions specific names. Icon-only buttons need an accessible name that explains the action. Do not rely solely on color to communicate selection, validation, or progress.

## Keyboard and focus

Walk through every task using only the keyboard. Check tab order, arrow navigation in selection controls, Enter and Escape behavior, and whether focus remains visible. After closing a dialog or popup, restore focus to a sensible location.

## Layout and text

Allow text to grow and wrap. Test with long localized strings and increased display scaling. Avoid fixed-height containers that clip input text, error messages, or focus outlines.

## Platform verification

FerroUI provides platform accessibility integrations, but actual support and verification vary by backend and platform. Use the relevant screen reader and operating system on your supported targets. Browser canvas rendering alone does not establish accessible semantics; verify the browser accessibility bridge and real assistive-technology behavior.

Automated checks on this documentation site cover its HTML navigation and editor. Application accessibility requires tests against the FerroUI control tree and platform automation peers as well.

## Walk through one complete task

For a profile form, use only the keyboard to reach the name, edit it, submit, correct an error, and submit again. Repeat with a screen reader. Confirm the field's name, error text, focused control, and save result are understandable without seeing color or position.

If a custom template removes the focus indicator, fix the template before shipping. If a browser screen reader sees only a canvas, check that the application's browser accessibility option is enabled and verify the exposed semantics.

## Public APIs and controls

- [`AutomationProperties`]({{BASE}}/api/ferroui-controls/automation/struct-automationproperties/) — names and label relationships.
- [`BrowserAccessibility`]({{BASE}}/api/ferroui-browser/struct-browseraccessibility/) — browser accessibility configuration.
- [TextBox]({{BASE}}/controls/reference/textbox/), [Button]({{BASE}}/controls/reference/button/), and [TextBlock]({{BASE}}/controls/reference/textblock/) — accessible form building blocks.
- [Forms]({{BASE}}/guides/forms/) and [localization]({{BASE}}/ecosystem/localization/).
