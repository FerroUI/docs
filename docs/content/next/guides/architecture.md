---
title: "Understand the application model"
description: "Learn where application code, views, state, and platform hosting belong."
sidebar:
  order: 1
---

A FerroUI application connects **a view**, **application state**, and **a platform host**. Start by understanding these three pieces; they determine where your code belongs.

| Piece | Responsibility | Typical choice |
| --- | --- | --- |
| Application | Configure services and themes once, then create the initial UI | An `Application` subclass |
| View | Arrange controls and display state | XAML or declarative Rust; a `UserControl` for reusable content |
| State and actions | Hold data, notify views of changes, and perform application work | Rust models and services; a view model when using MVVM |
| Host | Display the view on a particular platform | A desktop `Window`, or a browser/mobile view lifetime |

## Where should my code go?

Keep business rules and data access in ordinary Rust types. Put layout and presentation in the view. When using MVVM, expose state and commands through a view model and connect them to controls with bindings.

For example, a search screen might contain a `TextBox`, a search `Button`, and a list of results. The view model owns the query and results. Its search command calls a service, then updates state; bindings update the controls.

- [Bind a control to state]({{BASE}}/guides/binding/).
- [Connect buttons to commands]({{BASE}}/guides/commands/).
- [Build a view model with ReactiveUI]({{BASE}}/guides/mvvm/).

## How an application starts

1. Configure the application builder for your target platform.
2. Initialize application-wide services, resources, and themes.
3. Create the main view when framework initialization completes.
4. Give that view to the platform's application lifetime.

A desktop lifetime manages windows. Browser and mobile lifetimes host a view or top-level control. Keep shared content in a `UserControl` so each platform can provide the appropriate host.

For a complete entry point, follow [Your first application]({{BASE}}/start/first-application/). For platform setup, see [Desktop]({{BASE}}/platforms/desktop/), [Browser]({{BASE}}/platforms/browser/), or [Mobile]({{BASE}}/platforms/mobile/).

## Framework objects and ordinary Rust objects

Controls participate in FerroUI's class and property system and use `Ref<T>` handles. Ordinary services and data structures use normal Rust ownership. A view model can be an `Rc`-owned Rust object; it does not need to be a control.

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
- **Choose a view approach:** [XAML or declarative Rust]({{BASE}}/start/choose-ui/).
- **Connect data:** [Data binding]({{BASE}}/guides/binding/).
- **Find a component:** [Control gallery]({{BASE}}/controls/).

## Public APIs and controls

- [`Application`]({{BASE}}/api/ferroui-controls/struct-application/) and [`AppBuilder`]({{BASE}}/api/ferroui-controls/struct-appbuilder/) — initialization and application services.
- [Window]({{BASE}}/controls/reference/window/) and [UserControl]({{BASE}}/controls/reference/usercontrol/) — platform hosting and reusable views.
- [`FerroObject`]({{BASE}}/api/ferroui-base/struct-ferroobject/) — effective property values.
- [`Dispatcher`]({{BASE}}/api/ferroui-base/threading/struct-dispatcher/) — UI-thread work.
