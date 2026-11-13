---
title: "Inspect applications with MCP"
description: "Connect an agent to a running FerroUI application and use its inspection tools deliberately."
---

Use the MCP integration to let an agent inspect a FerroUI application's controls, properties, and screenshots. This is separate from reading this documentation: documentation is already available as Markdown and [agent indexes]({{BASE}}/llms.txt), without running an application server.

## Connect to the catalog

Build the optional integration from the matching checkout:

```sh
cargo build -p control-catalog-desktop --features mcp
```

Configure your MCP client's stdio server with an absolute executable path. For example, in a JSON client configuration that uses `mcpServers`:

```json
{
  "mcpServers": {
    "ferroui": {
      "command": "/absolute/path/to/FerroUI/target/debug/control-catalog-desktop",
      "args": ["--mcp-stdio", "--mcp-headless"]
    }
  }
}
```

Replace the path with your checkout's build output. Headless mode supports inspection and screenshots without showing a desktop window. Omit it to inspect a visible window. The exact configuration file location depends on your client.

## Ask for a concrete inspection

Start with: “Find SearchBox, report its current text and bounds, and capture a screenshot.” The client obtains the current tool schemas from the server; it should use those schemas for arguments and returned node identities.

To enable interaction, add `--mcp-allow-input` to the server's arguments. To enable property changes, add `--mcp-allow-writes`. Those capabilities are disabled by default. A useful follow-up task is to type a query, inspect the updated results, and report any visible error.

## Attach to an already running application

```sh
cargo run -p control-catalog-desktop --features mcp -- --mcp-http=8765
```

Use the startup URL `http://127.0.0.1:8765/mcp` and the fresh bearer token printed to stderr in your client's HTTP configuration. The token changes on restart. Port `0` selects a free port. Keep tokens out of committed configuration.

## Embed the endpoint in your own application

Make `ferroui-mcp` an optional dependency. After application setup, on the UI thread, retain the returned handle while the lifetime runs:

```rust
let mcp = ferroui_mcp::serve(ferroui_mcp::Options {
    permissions: ferroui_mcp::Permissions {
        allow_property_writes: false,
        allow_input: false,
    },
    ..Default::default()
})?;
// Keep `mcp` alive until the application shuts down.
```

The fragment belongs in a fallible startup function. Linking the crate does not start a server. For stdio, reserve stdout before platform startup with `reserve_stdout()` and pass that writer in the options so application logs cannot corrupt the protocol stream.

## If a request fails

A destroyed control's old identity is no longer valid: query the tree again. A denied write or input requires its corresponding explicit permission. An unresponsive dispatcher can prevent inspection from completing; fix blocking UI work before increasing timeouts.

## Public APIs and next steps

- [`serve`]({{BASE}}/api/ferroui-mcp/function-serve/), [`Options`]({{BASE}}/api/ferroui-mcp/struct-options/), and [`reserve_stdout`]({{BASE}}/api/ferroui-mcp/function-reserve_stdout/) — application integration.
- [Developer tools]({{BASE}}/tools/devtools/) for manual inspection.
- [Testing]({{BASE}}/tools/testing/) for repeatable behavior checks.
