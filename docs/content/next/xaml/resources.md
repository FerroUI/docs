---
title: "Share resources"
description: "Share brushes and other keyed values, choose static or dynamic lookup, and trace resource scope."
sidebar:
  order: 3
---

Resources give reusable values a key: brushes, styles, templates, dimensions, and other objects can be declared once and referenced from several controls.

```xml
<StackPanel xmlns="https://github.com/ferroui" Spacing="12">
  <StackPanel.Resources>
    <SolidColorBrush xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
                     x:Key="AccentBrush" Color="#2459E0" />
  </StackPanel.Resources>
  <TextBlock Foreground="{StaticResource AccentBrush}" Text="Shared color" />
</StackPanel>
```

Use static lookup when the resource is stable. Use dynamic lookup when the value is expected to change through theme or resource updates. Keep an application's theme resources at a scope shared by the controls that consume them.

Resources are part of the property system, not of XAML alone. A declarative component reads a resource as the control it is mounted in finds it, and follows changes, with `use_resource(key)` or `use_resource_as::<T>(key)`; see [styles, themes & motion]({{BASE}}/declarative/styling/).

## Scope and precedence

Resource lookup follows framework resource-provider relationships, not arbitrary Rust module relationships. A resource declared inside one view is not automatically visible to an unrelated window. Check the logical ancestry and application resources when a key resolves in one location but not another.

A local property value can override a style that uses a resource. If a resource change appears to have no effect, inspect the property's effective value source before changing the resource dictionary.

## Template resources

Control templates introduce their own visual structure. Use the appropriate template binding to forward an owning control's property instead of hard-coding a value inside its template. Keep resource keys stable when an application is intended to let consumers replace them.

Test resource lookup in both light and dark variants, and after changing the active theme while the application is running.

## Try a resource that can change

Change the example label to `Foreground="{DynamicResource AccentBrush}"` when the brush may be replaced while the view is open. Replace the resource at the scope that owns `AccentBrush`; the dynamic consumer should update. A static lookup is appropriate when that value will remain fixed for the view's lifetime.

For an application with two windows, place a shared accent at application scope, and put a view-specific spacing value in that view's resources. Do not copy the accent dictionary into each window unless independent values are intentional.

If a key is missing, first inspect the consumer's resource scope. If the key resolves but the color is wrong, inspect the effective property value and competing assignments. These are different failures.

## Public APIs and controls

- [`ResourceDictionary`]({{BASE}}/api/ferroui-base/controls/struct-resourcedictionary/) — keyed resource storage.
- [`SolidColorBrush`]({{BASE}}/api/ferroui-base/media/struct-solidcolorbrush/) — the shared brush in the example.
- [TextBlock]({{BASE}}/controls/reference/textblock/) and [StackPanel]({{BASE}}/controls/reference/stackpanel/) — the consumer and local scope.
- [Styles and themes]({{BASE}}/design/themes/) for theme-aware presentation; [developer tools]({{BASE}}/tools/devtools/) for value inspection.

## Split a resource dictionary across files

Use a merge include for shared resource units. For example, a dictionary can load a palette file relative to its own document:

```xml
<ResourceDictionary xmlns="https://github.com/ferroui">
  <ResourceDictionary.MergedDictionaries>
    <MergeResourceInclude Source="Palette.xaml" />
  </ResourceDictionary.MergedDictionaries>
</ResourceDictionary>
```

Put `Palette.xaml` alongside the including file and register both as application XAML assets. For a runtime document group, supply an absolute document URL and ensure the asset loader can resolve the nested includes. This also applies to dictionaries declared inline. An isolated string loaded without a base URL cannot resolve a relative file merely because it exists next to your Rust source.

See [runtime loading]({{BASE}}/xaml/compilation/) and [themes]({{BASE}}/design/themes/).

## Use the right URL type in Rust

Use an absolute `url::Url` for a document's loading context. Use [`UriRef`]({{BASE}}/api/ferroui-base/utilities/enum-uriref/) for a value that may be relative, such as a hyperlink target. For example, in an initialized view:

```rust
use ferroui_base::utilities::UriRef;
use ferroui_controls::HyperlinkButton;

let link = HyperlinkButton::new();
link.set_navigate_uri(Some(UriRef::parse("https://example.com/help")?));
```

The fragment belongs in a function that handles URL parse errors. A relative value needs a base before a platform service can open it. For storage, a provider may expose a virtual item without a local filesystem path; use the provider's stream API when a path is unavailable.
