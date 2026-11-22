---
title: "Choose build profiles and ship smaller applications"
description: "Use the right Cargo profile for development, testing, and shipping, and give your own application FerroUI's size settings."
---

Use `dist` for the executable you ship. Use `release` for everyday optimized builds, and `dev` or `fast-release` while you work. Cargo takes these settings from **your application's** root `Cargo.toml`, so check that it defines them.

## Choose a profile

| Profile | Command | Use it for | What it does |
| --- | --- | --- | --- |
| `dev` | `cargo run` | Editing and debugging | Fast builds, debug information, unwinding |
| `fast-release` | `cargo run --profile fast-release` | Running optimized code locally | Optimized, no link-time optimization across crates, unwinding |
| `release` | `cargo build --release` | Everyday optimized builds and benchmarks | Thin LTO, abort on panic, symbols kept |
| `dist` | `cargo build --profile dist` | The build you ship | Fat LTO, one code generation unit, stripped symbols, abort on panic, theme optimized for size |
| `release-unwind`, `dist-unwind` | `cargo build --profile dist-unwind` | An application that catches panics to carry on | The same profile with unwinding |

## Add the profiles to your application

Cargo reads `[profile.*]` sections only from the root manifest of the workspace it builds. An application that depends on FerroUI from crates.io, from git, or through a path does **not** inherit FerroUI's profiles, and without its own settings `cargo build --release` uses Cargo's defaults: no link-time optimization, with unwinding.

- **Single-crate [project templates]({{BASE}}/start/templates/)** (`app`, `app-codebehind`, `declarative`, `rsx`) include these profiles.
- **The `cross-platform` template** gets them when you run `scripts/setup.sh`. After you update the FerroUI submodule, run `python3 FerroUI/scripts/apps/sync-workspace.py` to bring them up to date.
- **Any other application** adds them to its root `Cargo.toml`:

```toml
[profile.release]
lto = "thin"
panic = "abort"

[profile.release-unwind]
inherits = "release"
panic = "unwind"

[profile.fast-release]
inherits = "release"
lto = false
panic = "unwind"

[profile.dist]
inherits = "release"
lto = "fat"
codegen-units = 1
strip = "symbols"
panic = "abort"

[profile.dist-unwind]
inherits = "dist"
panic = "unwind"

# Repeat for each FerroUI theme crate your application uses.
[profile.dist.package.ferroui-themes-fluent]
opt-level = "z"
```

Abort on panic requires FerroUI 0.5.0 or later, the first release in which no production path uses a panic for an expected error.

## What each setting costs and saves

| Setting | Effect | Cost |
| --- | --- | --- |
| `lto = "fat"`, `codegen-units = 1` | With the theme setting below, `dist` executables of FerroUI's samples were 15 to 19 % smaller than stripped `release` builds on macOS | About twice the build time, and the link step of a large application can need about 6 GB of memory |
| `panic = "abort"` | Removes unwind tables and landing pads: hello world was about a fifth smaller | A panic ends the process |
| `strip = "symbols"` | Removes the symbol table, a sixth to a quarter of a macOS or Linux executable. Windows keeps symbols in the PDB, so this changes nothing there | Panic backtraces show addresses instead of names |
| `opt-level = "z"` on theme crates | Compiled theme markup runs once, at startup, and takes less space | Startup cost within measurement noise in FerroUI's samples |

Your application's numbers will differ. Measure it as described below.

## Decide how panics should behave

With `panic = "abort"`, the panic hook runs and the process then ends. `std::panic::catch_unwind` no longer catches anything. Tests, build scripts, and procedural macros always unwind, whatever the profile says.

Use an unwinding profile when your application must survive a panic in code it hosts, such as a plug-in host. FerroUI's development tools that isolate the code they inspect (the Designer, the previewer, hot reload, and DevTools) also need unwinding, so run them with `dev`, `fast-release`, or an `-unwind` profile.

To read a backtrace with names from a problem in a `dist` build, reproduce it with `release`.

## Measure the build you ship

Compare executables built with the same profile, target, and features. A debug build says little about shipped size or speed.

```sh
cargo build --profile dist
ls -l target/dist/
```

The output of a custom profile is in a folder with the profile's name. For a browser build, see [Browser & WebAssembly]({{BASE}}/platforms/browser/), which uses a separate profile tuned for download size. To find what makes an executable large, see [Performance & size]({{BASE}}/tools/performance/) and the FerroUI repository's [binary size guide](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/docs/binary-size.md).
