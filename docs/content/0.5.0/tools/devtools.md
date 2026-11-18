---
title: "Inspect a running interface"
description: "Find a control, inspect effective property values, and diagnose layout or binding with developer tools."
---

Use developer tools when the UI differs from the values you expect. Inspect the actual control, its current properties, and its parents before changing layout or binding code.

## Start with the catalog

For the local Chrome DevTools Protocol endpoint:

```sh
FERROUI_CDP_PORT=9222 cargo run -p control-catalog-desktop --features cdp
```

In Chrome, open `chrome://inspect/#devices`, configure `127.0.0.1:9222` as a network target, then choose **inspect** beside the FerroUI window. The ordinary F12 tools remain available independently where the application enables them.

The CDP endpoint inspects native FerroUI controls. It supports a subset of CDP; browser JavaScript evaluation, DOM scripting, and ordinary Playwright HTML locators are not available.

## Inspect components

For a declarative view, the component inspector of `ferroui-view` shows the mounted components with their keys, runs, and hooks, and for each control where its values come from (a value, following state, two-way, an element, or a binding). An application started with `launch` opens it with **Shift+F12** in a debug build; F12 stays with the developer tools of this page. See [hot reload & inspector]({{BASE}}/declarative/tools/).

## Diagnose an invisible or incorrectly styled control

1. Find the control in **Elements** and check its bounds and visibility.
2. Inspect the parent's constraints if the control has zero size or is clipped.
3. In **Styles**, inspect the effective value and active value sources.
4. If a style loses to a local value, remove or change that assignment rather than repeatedly changing the selector.
5. For a binding, verify the data context and registered property names; check **Console** for relevant logs.

Use the visual tree for template parts and layout. Use logical relationships for inherited data and resources. The **Accessibility** view helps inspect the exposed automation peers; still test with the target platform's assistive technology.

## Add inspection to your application

Enable the facade's `devtools` feature or depend on `ferroui-devtools` with `server`. After platform setup, start the server on the UI thread and retain it while the application runs:

```rust
let server = ferroui_devtools::DevToolsServer::start(9222)?;
// Keep `server` in the application's lifetime owner until shutdown.
```

This fragment belongs in a fallible startup function. Custom lifetimes register their top levels with `server.register(&top_level)`. Dropping the server closes the endpoint. Start it only for an application you intend to inspect and operate; the listener binds to loopback.

## Automate a repeatable diagnosis

Use CDP sessions for protocol-based inspection or the [MCP integration]({{BASE}}/tools/mcp/) for agent tools. The repository's [CDP smoke client](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/scripts/cdp/smoke.mjs) finds the catalog search box, sends input, reads properties, and captures the native window.

## Public APIs and next steps

- [`DevToolsServer`]({{BASE}}/api/ferroui-devtools/struct-devtoolsserver/) — opt-in application endpoint.
- [`inspector`]({{BASE}}/api/ferroui-view/inspect/function-inspector/) and [`mounted_trees`]({{BASE}}/api/ferroui-view/inspect/function-mounted_trees/) — the component inspector.
- [`Control`]({{BASE}}/api/ferroui-controls/struct-control/) and [`FerroObject`]({{BASE}}/api/ferroui-base/struct-ferroobject/) — control and effective property APIs.
- [Troubleshooting by symptom]({{BASE}}/tools/troubleshooting/), [bindings]({{BASE}}/guides/binding/), and [styles]({{BASE}}/design/themes/).
