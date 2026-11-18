---
title: "What's new in 0.5"
description: "Migrate to compiled bindings by default, own subscriptions and tasks, and try the new media, effects, and WinUI controls."
---

FerroUI 0.5.0 is the current release. The `next` documentation describes FerroUI **{{PACKAGE_VERSION}}** at [framework commit {{COMMIT}}](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}); changes made after 0.5.0 are listed under *Unreleased* in the changelog.

## Highlights

- **Compiled bindings by default.** Application XAML compiles `{Binding}` paths, and compiled `{x:Bind}` is available with one core for FerroUI XAML and WinUI XAML. See [compile or load XAML]({{BASE}}/xaml/compilation/#migrate-to-compiled-bindings-by-default).
- **Custom effects.** Effects defined outside the framework can be set on `Visual.Effect`, as effect graphs or as runtime shaders on Skia and Vello, with a library of effects and page transitions.
- **Portable media.** Video playback, camera capture, and QR analysis crates with media controls. See the [media guide]({{BASE}}/ecosystem/media/).
- **3D scenes.** `Viewport3D` and the Media3D scene model, drawn in Skia and Vello.
- **Idiomatic Rust signatures.** `...Error` types, `Subscription` guards, futures on the dispatcher with `JoinHandle`, `CancellationToken`, `Duration`, `UriRef`, and cultures based on ICU4X. The former names remain as deprecated aliases until the release after 0.5.
- **Smaller executables.** Theme trimming and trimmed type tables are on by default, and the `dist` and `release` profiles no longer unwind on panic.
- **New controls and charts.** WinUI's `PagerControl` and `PersonPicture`, and polar, Sankey, treemap, map, financial, and gauge charts in the LiveCharts library.

The release adds 38 crates, among them the Designer Studio and portable media crates. Two experimental native renderers, `ferroui-quartz` on macOS and `ferroui-direct2d` on Windows, are opt-in; Skia remains the default backend.

## Migrate an existing application

| When you upgrade | What to do |
| --- | --- |
| A compiled view reports missing type information | Declare `x:DataType` on the view and on item templates. Choose `{ReflectionBinding}` deliberately for dynamic sources. See [compile or load XAML]({{BASE}}/xaml/compilation/). |
| An event or property observation no longer fires | Check the return type. A subscription guard needs an owner for as long as you want notifications. See [subscription lifetimes]({{BASE}}/guides/subscriptions/). |
| A view launches asynchronous work | Use dispatcher futures and keep an abort handle for view-owned work. See [async work]({{BASE}}/guides/async/). |
| The compiler reports deprecated names | Replace `...Exception` types with the `...Error` types, `Task` with `JoinHandle` or `Shared`, and `CancellationTokenSource` with `CancellationToken`. The changelog lists each replacement. |
| You author a theme or library with dynamic XAML | Use the public markup registration path for the controls you load dynamically. See [styles and themes]({{BASE}}/design/themes/). |

## Try the new controls

- **Video, camera, and QR:** Add playback or explicitly start a camera and optional QR analysis. [Media guide]({{BASE}}/ecosystem/media/).
- **PersonPicture:** Show a photo, initials, or a placeholder for a person or group. [Catalog example](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/ControlCatalog/Pages/PersonPicturePage.xaml).
- **PagerControl:** Move through pages of results with first, previous, next, and last controls. [Catalog example](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/ControlCatalog/Pages/PagerControlPage.xaml).

## Check behavior after the upgrade

Rebuild compiled markup and open views whose bindings start inside templates or cross a named element. Exercise cancellation, repeated navigation, and command availability. Compare first interaction and scrolling with your actual theme and target platform; renderer and startup changes in this release can affect those measurements.

## Known limitations

Vello is optional and experimental, and so are the native Quartz and Direct2D renderers. Portable media is an initial implementation whose support differs by platform. 3D covers the scene model and drawing in Skia and Vello; later steps are not part of this release.

See the [full changelog](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/CHANGELOG.md) and [versions and migration]({{BASE}}/releases/versions/).
