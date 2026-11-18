---
title: "Compile or load XAML"
description: "Choose runtime loading or build-time compilation and diagnose registration and resource failures."
sidebar:
  order: 2
---

XAML views are compiled to Rust by the build script of a crate, or loaded at run time; both go through the same language front end. Use build-time compilation for application views whose shape is known at build time: the markup becomes Rust source, bindings are compiled by default, and built-in themes are trimmed to the controls the application uses. Use runtime loading when a document needs to change without rebuilding its Rust owner. A component written in Rust can load a compiled document by its URI with `use_xaml` ([components with XAML]({{BASE}}/declarative/xaml-interop/)).


## Choose a loading path

| Situation | Use | What must exist first |
| --- | --- | --- |
| An application view checked into source | Build-time compilation | Build script, direct dependencies, and application metadata |
| A preview editor changing markup at runtime | Runtime loading | Registered types, resources, and a suitable document URI |
| A new Rust control or event handler | Rebuild the application | Compiled implementation and exposed metadata |

For a minimal runtime load after the application and framework types are registered:

```rust
use ferroui_markup_xaml_loader::FerroRuntimeXamlLoader;

let loaded = FerroRuntimeXamlLoader::load(
    r#"<TextBlock xmlns="https://github.com/ferroui" Text="Hello from XAML" />"#,
    None, None, None, false,
)?;
```

This fragment belongs in a function that handles or returns `XamlLoadError`. It produces a boxed framework object, not an installed view. Check the root type before assigning it to a host; see the [downloadable runtime examples]({{BASE}}/start/playground/) for loading and root conversion. For a file with relative resources, pass its absolute `url::Url` instead of `None`.

## Runtime loading

Register framework types and your application types before loading. `FerroRuntimeXamlLoader::load` accepts markup text and contextual information such as the local assembly, root instance, and document URI. It returns an object or a `XamlLoadError` with diagnostic context.

The returned object must be converted to the expected framework handle. If the document is meant to be a view, verify its root is a `Control` before installing it in a content host. Retain the old view when loading fails.

Runtime loading does not compile arbitrary new Rust code. A markup event handler or custom type must already exist in the application and be exposed through metadata.

## Build-time compilation

Add `ferroui-build` as a build dependency and use the complete `samples/HelloWorld` project as the integration reference. The build script scans the application's type model, compiles its markup, and writes Rust source into the build output.

Generated Rust names the crates it calls directly. Depend on those crates explicitly rather than assuming a facade re-export will satisfy generated absolute paths.

## Resource includes and document identity

A document URI supplies context for relative assets and includes. A document loaded from an anonymous string cannot assume the same resource identity as a compiled application document. Keep assembly names, asset URIs, and namespace registration consistent.

## Common errors

An unknown type usually indicates missing registration or an incorrect namespace. An unknown member can indicate missing property metadata even when a Rust setter exists. A missing compiled document can indicate a build-script integration problem. Inspect the innermost diagnostic rather than treating every failure as an XML syntax error.

## Verify the build integration

Start from [HelloWorld's manifest and build script](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/HelloWorld). Its `sample-build` helper is repository tooling; an external application should use the public `ferroui-build` integration rather than depending on that unpublished helper.

Change a label in XAML and rebuild. Then introduce an unknown member and confirm the build reports the relevant document location. Restore it and confirm the resulting application shows the changed label. This checks that your file is actually part of the build.

## Public APIs and next steps

- [`FerroRuntimeXamlLoader`]({{BASE}}/api/ferroui-markup-xaml-loader/struct-ferroruntimexamlloader/) — runtime loading.
- [`XamlLoadError`]({{BASE}}/api/ferroui-markup-xaml/struct-xamlloaderror/) — load diagnostics.
- [`Build`]({{BASE}}/api/ferroui-build/struct-build/) — application build integration.
- [TextBlock]({{BASE}}/controls/reference/textblock/) — the example root.
- [Resources]({{BASE}}/xaml/resources/) and [binding]({{BASE}}/guides/binding/).

## Migrate to compiled bindings by default

From 0.5.0, application XAML compiles `{Binding}` paths by default. When a path starts from a view model, declare its registered type with `x:DataType`. Give a data template its **item** type separately; its data context is the item, not the enclosing view model.

The [ReactiveUIExample views](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ReactiveUIExample/Views) pair registered Rust types with typed markup. For example, a view with a registered `SearchViewModel` exposing `SearchText` can use:

```xml
<StackPanel xmlns="https://github.com/ferroui"
            xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
            xmlns:vm="using:MyApp.ViewModels"
            x:DataType="vm:SearchViewModel">
  <TextBox Text="{Binding SearchText, Mode=TwoWay}" />
  <TextBlock Text="{Binding SearchText}" />
</StackPanel>
```

Replace the sample namespace with your registered namespace and set the view's data context to an instance of that type. A two-way path still requires a setter and change notifications.

Use `{ReflectionBinding ...}` for an individual source whose type is known only at runtime. During migration, use `x:CompileBindings="False"` on a view or subtree. To opt out for a whole crate, set `compile-bindings = false` under `[package.metadata.ferroui]` in its manifest; that setting takes precedence over `Build::default_compile_bindings(false)`.

For runtime loading of an application's own files, use the assembly-aware configuration, `RuntimeXamlLoaderConfiguration::for_assembly`, so the loader follows the same binding policy. The standalone playground loads isolated fragments and does not supply your application's type metadata.
