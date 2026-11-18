---
title: "Understand the application model"
description: "Learn where application code, views, state, and platform hosting belong."
sidebar:
  order: 1
---

A FerroUI application connects **a view**, **application state**, and **a platform host**. Start by understanding these three pieces; they determine where your code belongs.

| Piece | Responsibility | Typical choice |
| --- | --- | --- |
| Application | Configure services and themes once, then create the initial UI | `launch` or `launch_themed` from `ferroui-view`, or an `Application` subclass |
| View | Arrange controls and display state | Declarative Rust (components, builders, `rsx!`) or compiled XAML; a component or a `UserControl` for reusable content |
| State and actions | Hold data, notify views of changes, and perform application work | Signals and hooks in components; Rust models and services; a view model when using MVVM |
| Host | Display the view on a particular platform | A desktop `Window`, or a browser/mobile view lifetime |

## Where should my code go?

Keep business rules and data access in ordinary Rust types. Put layout and presentation in the view. In declarative Rust, a component holds view state in signals and hooks and calls services from its handlers and futures. When using MVVM, expose state and commands through a view model and connect them to controls with bindings.

For example, a search screen might contain a `TextBox`, a search `Button`, and a list of results. As a component, the query is a signal bound two-way to the text box, the results are a `use_future` of the query, and the list follows them. As a view model, the model owns the query and results; its search command calls a service, then updates state, and bindings update the controls.

- [Write a component with hooks]({{BASE}}/declarative/components/).
- [Bind a control to state]({{BASE}}/guides/binding/).
- [Connect buttons to commands]({{BASE}}/guides/commands/).
- [Build a view model with ReactiveUI]({{BASE}}/guides/mvvm/).

## How an application starts

1. Configure the application builder for your target platform.
2. Initialize application-wide services, resources, and themes.
3. Create the main view when framework initialization completes.
4. Give that view to the platform's application lifetime.

`ferroui_view::launch(|| ..)` performs these steps for a desktop application whose main window is an element: it configures platform detection, installs the Fluent theme (`launch_themed` takes another), mounts the element, and starts the desktop lifetime. An application that needs its own `Application` class, services, or XAML resources writes the steps itself, as the XAML samples do.

A desktop lifetime manages windows. Browser and mobile lifetimes host a view or top-level control. Keep shared content in a `UserControl` so each platform can provide the appropriate host.

For a complete entry point, follow [Your first application]({{BASE}}/start/first-application/). For platform setup, see [Desktop]({{BASE}}/platforms/desktop/), [Browser]({{BASE}}/platforms/browser/), or [Mobile]({{BASE}}/platforms/mobile/).

## Framework objects and ordinary Rust objects

Controls participate in FerroUI's class and property system and use `Ref<T>` handles. Ordinary services and data structures use normal Rust ownership. A view model can be an `Rc`-owned Rust object; it does not need to be a control.

In declarative Rust, an `Element` is a description of controls, not a control. Mounting an element creates the controls; the signals, effects, and hooks made for it belong to an owner that ends with the mounted tree. Keep durable application data outside that view state.

Use the framework class model when implementing a control or another object that needs framework properties and lifecycle behavior. See [Custom controls]({{BASE}}/design/custom-controls/).

## Why a property's value can change

A control's effective property value can come from a local assignment, a binding, a style, an animation, or inheritance. A getter returns that effective value. Changing a style therefore does not guarantee that the displayed value will change if another source takes precedence.

When a value is unexpected, check its binding, local assignments, and matching styles. [Developer tools]({{BASE}}/tools/devtools/) help inspect the control and its value sources. Read [Styles and themes]({{BASE}}/design/themes/) for presentation rules.

## Which tree should I inspect?

The **logical tree** describes application content and resource relationships. The **visual tree** includes the elements created to display that content, including template parts.

An items control may hold data items while generating visual containers for them. A new control template changes those visuals without changing the underlying data model.

Inspect the logical relationships when tracing inherited data contexts and resources. Inspect the visual tree when diagnosing template parts, layout, or pointer interaction.

## What belongs on the UI thread?

Controls and their properties belong to the UI thread. Perform slow work asynchronously, then deliver control updates through the framework's UI-thread mechanisms. [Async work and UI updates]({{BASE}}/guides/async/) explains this pattern.

Layout happens in two stages: a parent measures how much space a child needs, then arranges it in the available space. If a control is clipped, stretched, or unexpectedly small, start with [Layout and sizing]({{BASE}}/design/layout/).

## Continue with your task

- **Create a window:** [Your first application]({{BASE}}/start/first-application/).
- **Choose a view approach:** [declarative Rust or XAML]({{BASE}}/start/choose-ui/).
- **Connect data:** [Data binding]({{BASE}}/guides/binding/).
- **Find a component:** [Control gallery]({{BASE}}/controls/).

## Public APIs and controls

- [`Element`]({{BASE}}/api/ferroui-view/element/enum-element/) and [`Owner`]({{BASE}}/api/ferroui-view/reactive/struct-owner/) — declarative views and their lifetimes.
- [`Application`]({{BASE}}/api/ferroui-controls/struct-application/) and [`AppBuilder`]({{BASE}}/api/ferroui-controls/struct-appbuilder/) — initialization and application services.
- [Window]({{BASE}}/controls/reference/window/) and [UserControl]({{BASE}}/controls/reference/usercontrol/) — platform hosting and reusable views.
- [`FerroObject`]({{BASE}}/api/ferroui-base/struct-ferroobject/) — effective property values.
- [`Dispatcher`]({{BASE}}/api/ferroui-base/threading/struct-dispatcher/) — UI-thread work.
