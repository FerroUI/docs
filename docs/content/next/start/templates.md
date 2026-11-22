---
title: "Create a project from a template"
description: "Start a FerroUI application, control library, or cross-platform repository with the official templates, then add windows, controls, and resources."
---

The [FerroUI templates](https://github.com/FerroUI/templates) create a working project in one command. They use [cargo-generate](https://github.com/cargo-generate/cargo-generate) and are the quickest way to start: each project already has its theme, build script, tests, and [build profiles]({{BASE}}/tools/build-profiles/).

## Create your first project

You need Rust 1.89 or later and the [platform requirements]({{BASE}}/start/installation/). Install the generator once:

```sh
cargo install cargo-generate
```

Create and run a desktop application in XAML:

```sh
cargo generate --git https://github.com/FerroUI/templates app --name my-app
cd my-app
cargo run
```

The generator asks for each option it needs. Leave out the template name to choose from a list. The first build downloads a prebuilt Skia and compiles HarfBuzz, so it takes longer than later builds.

The single-crate templates depend on the latest published FerroUI release, currently 0.5.0, so they do not include APIs that exist only on the development branch.

## Choose a template

| Template | Creates | Options |
| --- | --- | --- |
| `app` | A desktop application in XAML with the MVVM pattern and a view model test | `theme`, `mvvm` |
| `app-codebehind` | A desktop application in XAML with code-behind and no view models | `theme` |
| `declarative` | A desktop application written with the `ferroui-view` builders and signals, without XAML | `theme` |
| `rsx` | A desktop application written with `rsx!`, `#[component]`, signals, and hooks | `theme` |
| `cross-platform` | An application repository with a shared crate, desktop, browser, Android, and iOS hosts, and CI | `theme`, `desktop`, `browser`, `android`, `ios`, `app_id` |
| `control-library` | A library crate with a templated control, its control theme, and its registration | `control` |

Not sure between XAML and Rust views? See [Declarative Rust or XAML?]({{BASE}}/start/choose-ui/).

## Set options on the command line

Pass `--define` to skip a prompt, for example in a script:

```sh
cargo generate --git https://github.com/FerroUI/templates app --name my-app \
    --define theme=fluent --define mvvm=reactiveui

cargo generate --git https://github.com/FerroUI/templates rsx --name my-app \
    --define theme=macos

cargo generate --git https://github.com/FerroUI/templates cross-platform --name my-app \
    --define theme=winui --define ios=false --define app_id=org.example.myapp
```

| Option | Values | Default |
| --- | --- | --- |
| `theme` | `winui`, `fluent`, `simple`, `macos`, `material` | `winui` |
| `mvvm` | `minimal` (a small view model base), `reactiveui` (ReactiveUI) | `minimal` |
| `desktop`, `browser`, `android`, `ios` | `true` or `false`; keep at least one host | `true` |
| `app_id` | The application id of the Android and iOS hosts | `com.example.<name>` |
| `control` | The control name in PascalCase | `InfoCard` |
| `namespace` | The XAML namespace of an item, such as `MyApp.Views` | `MyApp.Views` |

## Build, test, and ship

From a generated single-crate project:

```sh
cargo run                         # develop
cargo test                        # run the tests
cargo run --profile fast-release  # try optimized code locally
cargo build --profile dist        # build what you ship
```

The shipped executable is in `target/dist/`. [Build profiles]({{BASE}}/tools/build-profiles/) explains what each profile does and when to keep unwinding.

## Add a window, control, or resources

Item templates generate one item in a new folder, with a `README.md` that gives the exact steps for wiring it into your project. Run them where you want that folder:

```sh
cd my-app/src/views
cargo generate --git https://github.com/FerroUI/templates window --name SettingsWindow \
    --define namespace=MyApp.Views
```

| Item template | Creates | Options |
| --- | --- | --- |
| `window` | A window: its XAML and its class | `namespace` |
| `user-control` | A user control: its XAML and its class | `namespace` |
| `templated-control` | A control class with styled properties and its control theme | `namespace` |
| `resource-dictionary` | A resource dictionary for `ResourceInclude` | |
| `styles` | A set of styles for `StyleInclude` | |

For the window above, the generated `settings-window/README.md` tells you to:

1. Move `SettingsWindow.xaml` and `settings_window.rs` into `src/views/`, then delete the generated folder.
2. Declare the module in `src/views/mod.rs`:

   ```rust
   mod settings_window;
   pub use settings_window::SettingsWindow;
   ```

3. Add `SettingsWindow::TYPE` to the `TYPES` table of that module.

The build script compiles every `*.xaml` file below `src/`, so the new document needs no other registration. Open the window with `SettingsWindow::new()` and `window.show()`.

## Work with a cross-platform repository

The `cross-platform` template creates a repository with one crate for your application and one host crate per platform. FerroUI is a git submodule at `FerroUI/`. Run the setup script once after generating, because it adds the submodule, writes the FerroUI dependency and profile blocks of `Cargo.toml`, and starts `Cargo.lock`:

```sh
cargo generate --git https://github.com/FerroUI/templates cross-platform --name my-app
cd my-app
scripts/setup.sh
cargo run -p my-app-desktop
```

Edit your application in its shared crate, such as `MyApp/`. The hosts, such as `MyApp.Desktop/`, only start it on each platform. The generated `README.md` lists the crates and commands for the hosts you chose.

## Update FerroUI

In a single-crate project, every FerroUI crate is pinned to one exact version, because the crates of a release depend on one another at that version. In `Cargo.toml`, change all of them together, including those under `[build-dependencies]` and `[dev-dependencies]`:

```toml
[dependencies]
ferroui-base = { version = "=0.5.0", features = ["markup-functions"] }
ferroui-controls = "=0.5.0"
ferroui-desktop = "=0.5.0"
# and every other ferroui-* crate

[build-dependencies]
ferroui-build = "=0.5.0"
```

Read [Versions & migration]({{BASE}}/releases/versions/) before moving to a new release.

In a cross-platform repository, update the submodule and let the script rewrite the blocks it owns:

```sh
git -C FerroUI fetch origin && git -C FerroUI checkout origin/main
python3 FerroUI/scripts/apps/sync-workspace.py
cargo metadata --format-version 1 > /dev/null
git add FerroUI Cargo.toml Cargo.lock && git commit
```

## Next steps

- [Your first application]({{BASE}}/start/first-application/) explains the code a template gives you.
- [Choose controls]({{BASE}}/guides/choosing-controls/) to build the first screen.
- [Build profiles]({{BASE}}/tools/build-profiles/) prepares the application for shipping.
