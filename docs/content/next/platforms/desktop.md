---
title: "Ship desktop applications"
description: "Start a desktop lifetime, share view content, and verify a packaged application."
sidebar:
  order: 1
---

Desktop applications use a classic desktop lifetime. Configure platform detection, install services and a theme, then create the main window. Keep reusable content separate from its window host so it can also be used in tests or on another platform.


## Build and exercise the smallest host

From the matching source checkout:

```sh
cargo run -p hello-world-hooks
cargo build -p hello-world-hooks --profile dist
```

A declarative application starts with `ferroui_view::launch` (the `desktop` feature of `ferroui-view`): it configures platform detection, installs the Fluent theme, mounts the `Window` element as the main window, and starts the classic desktop lifetime. `launch_themed` takes another theme, and `launch_with` gives you the main window before the main loop runs. Further windows are elements too: `open_window(|| ..)` mounts and shows one, and the tree it mounted ends when the window closes.

```rust
use ferroui_view::prelude::*;

fn main() {
    launch_themed(
        || ferroui_themes_winui::WinUITheme::new().as_style(),
        || rsx! { Window { title: "Editor", width: 960.0, height: 640.0, Editor {} } },
        |_| {},
    );
}
```

`Editor` stands for the application's root component. An application written with XAML and an application class uses the same lifetime directly: the [HelloWorld entry point](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/HelloWorld/program.rs) (`cargo run -p hello-world`) calls `AppBuilder::configure`, selects the platform, and starts the classic desktop lifetime. Keep the application's initialization responsible for its theme and resources, then assign the main window when framework setup completes.

For a two-window editor, use one shared service/model layer and give each `Window` its own view. Closing an auxiliary window should not accidentally discard shared documents. Choose and test the lifetime's shutdown behavior deliberately.

## Platform setup

On macOS, install Xcode Command Line Tools. On Windows, use the MSVC toolchain and install the requirements of your selected graphics backend. On Linux, provide fontconfig and FreeType development packages for building and the required runtime libraries for the chosen windowing platform.

X11 is the default detected Linux desktop path; Wayland is an explicit choice in the current framework. Validate input methods, clipboard, drag and drop, window state, and display scaling on each supported desktop.

## Package deliberately

Build with the repository's distribution profile when measuring shipped artifacts. Bundle fonts and application resources under stable asset identities. Native library requirements depend on the selected platform and renderer; test the packaged application on a clean machine rather than only from the development checkout.

## Native integrations

Storage pickers, system menus, tray icons, accessibility, and hosted native controls are platform services. Avoid assuming a feature exists because the corresponding control can be constructed on another platform. Check the platform reference and implement a user-visible fallback where necessary.

## Release verification

Exercise startup, shutdown, opening a second window, high DPI, input methods, and a failure during initialization. Verify code signing and platform packaging as part of the product's own distribution process.

## Public APIs and controls

- [`rsx`]({{BASE}}/api/ferroui-view-macros/proc_macro-rsx/) and [`component`]({{BASE}}/api/ferroui-view-macros/proc_macro-component/) — the declarative main window and its content.
- [`AppBuilderDesktopExtensions`]({{BASE}}/api/ferroui-desktop/trait-appbuilderdesktopextensions/) — desktop platform and lifetime entry points.
- [`Application`]({{BASE}}/api/ferroui-controls/struct-application/) — application initialization.
- [Window]({{BASE}}/controls/reference/window/), [TopLevel]({{BASE}}/controls/reference/toplevel/), and [UserControl]({{BASE}}/controls/reference/usercontrol/) — hosting and reusable content.
- [Installation]({{BASE}}/start/installation/), [testing]({{BASE}}/tools/testing/), and [version migration]({{BASE}}/releases/versions/).
