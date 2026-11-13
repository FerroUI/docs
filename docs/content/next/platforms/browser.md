---
title: "Run FerroUI in the browser"
description: "Build a WebAssembly host, serve its assets, and check real input and accessibility."
sidebar:
  order: 4
---

The browser platform hosts a FerroUI view in a page and renders through WebGL 2 or a 2D canvas. It uses the `wasm32-unknown-emscripten` target; this is not interchangeable with a generic `wasm32-unknown-unknown` build.

## Build the catalog

```sh
scripts/browser/setup.sh
source .tools/env.sh
scripts/build-browser.sh control-catalog-browser
node scripts/browser/serve.mjs target/browser/control-catalog-browser
```

The setup script pins Emscripten, Rust, and wasm-bindgen together. The build script compiles the browser platform's JavaScript, links the module, and assembles the host page and assets. Serve the output over HTTP; opening an HTML file directly does not reproduce browser module loading.

## Host a view

The host creates the generated module, attaches it to `FerroExports`, then invokes the application's exported entry point. The application starts a single-view browser lifetime in a named host element. Include fonts explicitly because the renderer cannot assume desktop system-font discovery.

## Threads

The default build does not require cross-origin isolation. The optional threaded renderer uses browser workers and requires the appropriate browser capabilities and isolation. GitHub Pages cannot set arbitrary response headers; the catalog has a service-worker-assisted isolation path. Documentation examples use the non-threaded mode to avoid reloading the documentation shell.

## Size and startup

Load the runtime only when a visitor needs it. Share modules between examples, keep optional assets out of the initial module, and measure compressed transfer size and startup separately. Browser graphics modules are substantial; a tiny HTML host does not imply a tiny download.

## Limitations

Native windows, operating-system materials, unrestricted file access, and some platform integrations cannot be demonstrated faithfully in a browser. Use the native sample for those features. Test Firefox and WebKit explicitly instead of extrapolating from Chromium results.

## Verify a deployed page

After the catalog opens, type in a text field, select an item, resize the viewport, and refresh the page. Check that fonts and the WASM module load from the deployed base path, not just the development server's root. A missing asset request is a hosting/path problem; a working canvas with missing semantic controls is an accessibility configuration problem.

Use the [browser catalog host](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ControlCatalog.Browser) for the entry point and assets. If your application uses bookmarks or URL navigation, wire that explicitly; see [navigation]({{BASE}}/guides/navigation/).

## Public APIs and controls

- [`BrowserAppBuilder`]({{BASE}}/api/ferroui-browser/trait-browserappbuilder/) — browser startup and host selection.
- [`BrowserPlatformOptions`]({{BASE}}/api/ferroui-browser/struct-browserplatformoptions/) and [`BrowserAccessibility`]({{BASE}}/api/ferroui-browser/struct-browseraccessibility/) — application-facing browser configuration.
- [UserControl]({{BASE}}/controls/reference/usercontrol/) — shared content root; [TextBox]({{BASE}}/controls/reference/textbox/) for input verification.
- [Live XAML]({{BASE}}/start/playground/) for a small real WASM example.

## Browser media

The [media guide]({{BASE}}/ecosystem/media/) explains which controls need browser providers and what to verify on a deployed page. Test camera consent and start/stop from your own host in a secure context, such as HTTPS or localhost. The documentation playground does not start media devices.
