---
title: "Style controls and choose a theme"
description: "Apply styles and themes, inspect value precedence, and preserve control behavior."
sidebar:
  order: 2
---

A theme supplies the control templates and resources that make controls visible and usable. FerroUI includes Fluent, Simple, WinUI, and additional ecosystem themes. Install a theme before expecting a templated control to have its final appearance.


## Style a class of controls

```xml
<StackPanel xmlns="https://github.com/ferroui" Spacing="12">
  <StackPanel.Styles>
    <Style Selector="Button.primary">
      <Setter Property="FontSize" Value="16" />
      <Setter Property="Padding" Value="16,8" />
    </Style>
  </StackPanel.Styles>
  <Button Classes="primary" Content="Continue" />
</StackPanel>
```

Selectors decide which controls receive setters. Use classes to represent application intent; avoid styling by a transient visual-tree position unless the template contract requires it.

## Check that the selector matches

Run the style example inside an application with a theme installed. The button's padding and font size should change. Remove `Classes="primary"`: it should return to its theme's defaults. Add a second unclassified button to verify that the style affects only the intended controls.

Keep styles at the narrowest useful scope. A view's `Styles` can define a local primary action; application-wide styles should describe shared product conventions. [Button]({{BASE}}/controls/reference/button/) lists the properties you can set, while [`Style`]({{BASE}}/api/ferroui-base/styling/struct-style/) defines the public style contract.

## Property value sources

A style setter is one value source among several. A local value or animation may take precedence. When a setter appears ineffective, inspect the property's resolved value and source. Repeatedly adding more specific selectors cannot override every value source.

## Themes and templates

A control theme packages the styling and template for a control. A template defines the visuals a control creates; replacing it can remove necessary named parts, focus indicators, or visual states. Begin with the current theme's implementation when creating a substantial replacement.

## Light and dark

Use theme resources instead of literal foreground/background pairs for ordinary controls. Test changing the requested theme variant at runtime. A custom brush that looks acceptable on a light background may erase text or focus feedback in dark mode.

For platform materials such as Mica or native blur, consult the platform guide. A browser-rendered preview is not proof of native material behavior.

## Choose the smallest appearance change

| Desired change | Start with |
| --- | --- |
| More space around a button label | A `Padding` setter |
| A shared accent color | A resource used by the relevant setters |
| A complete control visual structure | A control theme/template with required parts preserved |
| A new interaction model | A custom control with explicit behavior |

## Public APIs and next steps

- [`Style`]({{BASE}}/api/ferroui-base/styling/struct-style/), [`Setter`]({{BASE}}/api/ferroui-base/styling/struct-setter/), and [`ThemeVariant`]({{BASE}}/api/ferroui-base/styling/struct-themevariant/) — styles and variants.
- [`FluentTheme`]({{BASE}}/api/ferroui-themes-fluent/struct-fluenttheme/) — Fluent theme setup.
- [Resources]({{BASE}}/xaml/resources/), [custom controls]({{BASE}}/design/custom-controls/), and [accessibility]({{BASE}}/design/accessibility/).

## Check dynamically loaded controls in a trimmed app

Built-in themes can include only the control styles the application needs. Test every dynamically loaded view in the release configuration you intend to ship. If a type fails to load, confirm its XAML namespace and markup registration. If it loads but has no visual template, check that the application includes its theme and roots that control's theme resources.

For library-owned templates, declare the item type for bindings and use resource keys for reusable brushes and converters. See [compiled binding setup]({{BASE}}/xaml/compilation/#migrate-to-compiled-bindings-by-default) and the [theme authoring guide in the FerroUI repository](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/docs/xaml-themes.md).
