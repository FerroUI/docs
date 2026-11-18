---
title: "Origins and attribution"
description: "Where FerroUI's architecture and libraries come from, which parts are its own, and where attribution and licences are recorded."
---

FerroUI is a cross-platform UI framework for Rust. This page records where its parts come from; the rest of the documentation describes the framework as it is, without assuming knowledge of any other project.

## Heritage

FerroUI started as a port of an established cross-platform .NET UI framework to Rust. Its object model, styling, layout, input, and composition architecture follow that design, and its XAML compiler front end comes from XamlX. Applications, themes, and markup written against that model carry over with their structure, which is why many public names are .NET-shaped while the types and mechanisms beneath them are idiomatic Rust.

Other parts are native ports of their own sources:

| Area | Source |
| --- | --- |
| WinUI 3 controls, theme, and composition API | WinUI 3 |
| Behaviors, triggers, and actions | Xaml.Behaviors |
| Hierarchical and tabular data | TreeDataGrid |
| Charts | LiveCharts2 and WinUI charts |
| Reactive programming and MVVM | Rx.NET, DynamicData, ReactiveUI, and Splat |

## FerroUI's own parts

The declarative Rust layer (`ferroui-view`: builders, `rsx!`, signals, components with hooks, the reconciler, the router, error boundaries, and its tools), compiled `{x:Bind}`, theme trimming, the Material 3 Expressive and macOS 26 themes, the portable media stack, 3D, and the performance work are FerroUI's own.

## Tracking and differences

What follows a source is tracked against it in the FerroUI repository: the state per member, the test suites per project, what is not carried over, and every place where FerroUI differs and why. The [Origins section of the FerroUI README](https://github.com/wieslawsoltes/FerroUI/blob/main/README.md#origins) summarises that tracking and links to each record.

## Licences and attribution

FerroUI is licensed under the MIT License. It is derived from other open source projects, and some files are carried under their original licences. The full attributions and licence texts are in the [NOTICE.md of the FerroUI repository](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/NOTICE.md) and the component-level notices it refers to.

This documentation site is licensed under the MIT License as well. Its [NOTICE.md](https://github.com/FerroUI/docs/blob/main/NOTICE.md) records the material generated from FerroUI and the third-party components used to build the site.

## Continue

- [Install FerroUI]({{BASE}}/start/installation/) and [build a first application]({{BASE}}/start/first-application/).
- [Release policy]({{BASE}}/releases/policy/) for the compatibility guarantees of a release.
