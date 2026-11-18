---
title: "Choose ecosystem libraries"
description: "Choose an application library by the feature you need and find its working sample."
sidebar:
  order: 1
---

FerroUI's ecosystem includes reusable packages as well as the core UI framework. The core includes the control set, the five themes, XAML, and the declarative Rust layer (`ferroui-view`), whose features add builders for the TreeDataGrid, the color picker, the dialogs, and the ReactiveUI controls. Use the crate index to check which packages and features are part of your selected release.

| Library family | Use it for | Source example |
|---|---|---|
| ReactiveUI and Rx | View models, commands, observable workflows, activation | ReactiveDemo, ReactiveUIExample |
| DynamicData | Observable collection transformations and change sets | ReactiveUIExample |
| Dependency injection | Service registration and resolution | Dependency-injection crate tests |
| TreeDataGrid | Hierarchical or flat tabular data with explicit columns | TreeDataGridDemo, ViewGallery |
| Dock | Dockable tool/document workspaces | Dock/FerroDockReactiveUISample |
| Behaviors and interactions | Attachable XAML interactions and actions | BehaviorsGallery |
| Charts and LiveCharts | Data visualization | ChartsDemo, LiveChartsDemo |
| ProTranslate | Localization catalogs, formats, build integration, studio tooling | ProTranslateDemo |
| StaticViewLocator | Build-time view location and registration | StaticViewLocatorDemo |
| Designer Studio | XAML authoring and reusable design engines | DesignerStudio |

Unpublished packages belong to `next` and must not be represented as installable stable dependencies. Individual ecosystem packages may have narrower platform support than the controls at the center of FerroUI.

Start from the matching sample, keep dependency versions aligned, and consult the [API crate index]({{BASE}}/api/) for exact signatures and features.

## Follow a feature to its guide

| Your next task | Guide |
| --- | --- |
| Bind state and actions | [MVVM]({{BASE}}/guides/mvvm/) |
| Share a service across view models | [Dependency injection]({{BASE}}/ecosystem/dependency-injection/) |
| Show editable records in columns | [TreeDataGrid]({{BASE}}/ecosystem/treedatagrid/) |
| Plot changing measurements | [Charts]({{BASE}}/ecosystem/charts/) |
| Add reusable view interactions | [Behaviors]({{BASE}}/ecosystem/behaviors/) |
| Translate labels and formatted values | [Localization]({{BASE}}/ecosystem/localization/) |
| Arrange documents and tools | [Docking]({{BASE}}/ecosystem/dock/) |
| Measure or flow text yourself | [Prepared text]({{BASE}}/ecosystem/prepared-text/) |

For example, a searchable record browser can start with core [TextBox]({{BASE}}/controls/reference/textbox/) and [ListBox]({{BASE}}/controls/reference/listbox/) controls plus a view model. Add DynamicData when filtering and sorting become a changing pipeline, or [TreeDataGrid]({{BASE}}/controls/reference/treedatagrid/) when records need editable columns. Add packages to solve a concrete requirement rather than starting with every integration enabled.

For video playback, camera preview, and QR scanning, see [media controls]({{BASE}}/ecosystem/media/).
