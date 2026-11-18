---
title: "Install FerroUI"
description: "Set up the platform toolchain, run a known-working sample, and add FerroUI to an application with declarative Rust or XAML views."
sidebar:
  order: 1
---

FerroUI is a cross-platform UI framework for Rust. An application is an ordinary Rust project: install the platform toolchain, then write views declaratively in Rust with `ferroui-view` (builders, `rsx!`, signals, and components with hooks) or in XAML compiled to Rust. Both use the same controls, property system, bindings, and themes, and can be mixed in one application.

:::note[You are reading next]
These pages track development on the FerroUI main branch. This build uses framework version `{{PACKAGE_VERSION}}`; publication is independent of that manifest value. Use the 0.5.0 release for production, and keep every FerroUI dependency at exactly the same version.
:::

## Requirements

Install Rust with rustup and a native C/C++ toolchain. Desktop requires Rust 1.89 or later; the browser uses the toolchain pinned by the repository's browser setup script.

| Target | Development requirements |
|---|---|
| macOS | Xcode Command Line Tools and macOS 11 or later |
| Windows | MSVC build tools; libclang for the default ANGLE backend |
| Linux | fontconfig and FreeType development packages; an X11 or Wayland session |
| iOS | Xcode, iOS SDK, simulator or device Rust target |
| Android | Android SDK, NDK, and the aarch64-linux-android Rust target |
| Browser | Emscripten, the wasm32-unknown-emscripten target, and the exact wasm-bindgen CLI version |

The first graphics build downloads a matching Skia binary, or builds it when no matching binary is available. HarfBuzz also needs a C++ compiler. Allow more time for the first build than for subsequent application changes.

## Use the published release

Name the release exactly and use the same version for every FerroUI crate. For declarative Rust views, `ferroui-view` with its `desktop` feature brings the desktop entry point (`launch`) and the Fluent theme:

```toml
[dependencies]
ferroui-view = { version = "=0.5.0", features = ["desktop"] }
```

Add `ferroui-base` at the same version when your code names its types directly, such as `ferroui_base::layout::Orientation`, and a theme crate such as `ferroui-themes-winui` when you choose a theme other than Fluent. The features `xaml`, `treedatagrid`, `color-picker`, `dialogs`, `reactiveui`, and `hot-reload` of `ferroui-view` add XAML inside components, the builders of the other control crates, and hot reload of `rsx!` literals.

An application that compiles XAML or builds its window with the application model names the crates individually:

```toml
[dependencies]
ferroui-base = "=0.5.0"
ferroui-controls = "=0.5.0"
ferroui-desktop = "=0.5.0"
ferroui-themes-fluent = "=0.5.0"
```

The facade crate `ferroui` re-exports common functionality; its default configuration includes desktop support and the Fluent theme, for example `ferroui = { version = "=0.5.0", features = ["xaml"] }`. XAML build output names individual framework crates, so projects compiling markup should use those direct dependencies too. The libraries for MVVM applications and the developer tools are crates of the same release: add `ferroui-reactiveui-controls` or `ferroui-diagnostics` at `=0.5.0`, or enable the facade features `reactiveui` and `diagnostics`.

## Run the samples of this release

```sh
git clone https://github.com/wieslawsoltes/FerroUI.git
cd FerroUI
git checkout v0.5.0
cargo run -p hello-world-hooks
```

`hello-world-hooks` is Hello, World! as a component with hooks. The same window is also written with the builders (`hello-world-builders`), with `rsx!` and a run-once component (`hello-world-macros`), in XAML (`hello-world`), and as a component hosted in XAML (`hello-world-component-host`). Explore every control with `cargo run -p control-catalog-desktop`. The samples are part of the repository and are not published as crates.

## Choose your next step

- [Create your first application]({{BASE}}/start/first-application/) with a component, then the same screen in XAML.
- [Learn the declarative API]({{BASE}}/declarative/overview/): builders, `rsx!`, and signals.
- [Understand the application model]({{BASE}}/guides/architecture/).
- [Build for the browser]({{BASE}}/platforms/browser/).

## Confirm your setup

A successful `hello-world-hooks` run opens a themed window with a button that counts its clicks. Close it normally and confirm the process exits. If compilation fails before your application code is reached, resolve the reported toolchain or native dependency first. If the window opens but controls are missing, check theme and font setup.

Keep the working checkout as a comparison while creating your application. Follow [Your first application]({{BASE}}/start/first-application/) before introducing services, custom controls, or platform-specific features.

## Public entry points

- [`rsx`]({{BASE}}/api/ferroui-view-macros/proc_macro-rsx/) and [`component`]({{BASE}}/api/ferroui-view-macros/proc_macro-component/) — declarative views and components.
- [`AppBuilder`]({{BASE}}/api/ferroui-controls/struct-appbuilder/) — application construction.
- [`AppBuilderDesktopExtensions`]({{BASE}}/api/ferroui-desktop/trait-appbuilderdesktopextensions/) — desktop platform and lifetime setup.
- [Window]({{BASE}}/controls/reference/window/) — the desktop host; [UserControl]({{BASE}}/controls/reference/usercontrol/) for shared content.
