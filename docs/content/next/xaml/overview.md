---
title: "Understand XAML"
description: "Read and write control trees, properties, content, and markup extensions."
sidebar:
  order: 1
---

XAML is the second way to write a FerroUI view, beside [declarative Rust]({{BASE}}/declarative/overview/). It suits resource-driven applications, shared styles and templates, MVVM views, and views edited in a visual designer. The build compiles markup to Rust, with compiled bindings by default, and the result drives the same controls, themes, and bindings as a component; markup can also be loaded at run time. A XAML view can host a component, and a component can host XAML ([components with XAML]({{BASE}}/declarative/xaml-interop/)).

XAML describes an object graph. Elements identify registered types; attributes set properties; child elements assign content or populate collections. FerroUI compiles or interprets that graph using markup metadata from Rust crates.

```xml
<StackPanel xmlns="https://github.com/ferroui"
            xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
            Spacing="12">
  <TextBlock x:Name="Heading" Text="A real control tree" />
  <Button Content="Continue" />
</StackPanel>
```

The default XML namespace is `https://github.com/ferroui`. The `x` namespace contains language directives such as names and class-related information. Framework types may also be named through registered `using:` namespaces.

## Properties and content

An attribute such as `Spacing="12"` is converted to the property's Rust value type. A type's content property determines where unnamed children go. `StackPanel` adds children to its collection; a content control has one content value.

Use property-element syntax for complex values:

```xml
<Border xmlns="https://github.com/ferroui">
  <Border.Child>
    <TextBlock Text="Inside a border" />
  </Border.Child>
</Border>
```

## Markup extensions

Braces introduce a markup extension. `{Binding Name}` creates a binding instead of assigning a literal string. `{StaticResource Key}` looks up a resource. Escape an initial brace with `{}` when the target should receive text beginning with a brace.

## Register your Rust types

A Rust type being public is not enough to make it available to XAML. Register its framework and markup metadata, and register the relevant assembly/namespace information. The runtime loader and build-time compiler both rely on those declarations.

Continue with [compilation and loading]({{BASE}}/xaml/compilation/) and [resources]({{BASE}}/xaml/resources/).

## Read a view as a control tree

In the first example, the `StackPanel` owns two children. `Spacing` affects the gap between them; `Text` belongs to the label; `Content` belongs to the button. `x:Name` gives the label an identity in its name scope. It does not create an application state property.

The same tree in `rsx!` reads `StackPanel { spacing: 12.0, TextBlock { name: "Heading", text: "A real control tree" } Button { "Continue" } }`: property names become snake case, and attached properties keep their owner (`Grid.Row="1"` is `Grid.row: 1`).

Try changing `Spacing` to `24` and the button's `Content` to “Save.” Use the [playground]({{BASE}}/start/playground/) to see the result. Then add a `TextBox` and follow the [binding guide]({{BASE}}/guides/binding/) to connect input to a value.

## Fix common markup mistakes

| Diagnostic | Check |
| --- | --- |
| Unknown type | The XML namespace and type registration |
| Unknown property | Its markup name in the control reference, including inherited properties |
| Invalid property value | The expected value type and conversion syntax |
| Content cannot be assigned | Whether the parent accepts one child or a collection |
| A literal starting with `{` is interpreted | Prefix the literal with `{}` |

## Public APIs and controls

- [StackPanel]({{BASE}}/controls/reference/stackpanel/), [Border]({{BASE}}/controls/reference/border/), [TextBlock]({{BASE}}/controls/reference/textblock/), and [Button]({{BASE}}/controls/reference/button/) — content and properties used above.
- [`Binding`]({{BASE}}/api/ferroui-markup/data/struct-binding/) — data binding markup.
- [Compile or load XAML]({{BASE}}/xaml/compilation/) for complete application integration.
