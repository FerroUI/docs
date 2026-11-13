---
description: "Prepare a paragraph once and measure it at multiple widths using application text services."
title: Prepare and flow text
---

The Pretext libraries provide application-facing prepared text and reusable text flow. Prepare content once, then measure or wrap it repeatedly rather than reconstructing every intermediate result for each layout pass.


## Measure the same paragraph at two widths

Inside an initialized application's UI thread, after font and shaping services are configured:

```rust
use ferroui_pretext::{PrepareOptions, PretextLayout};

let layout = ferroui_pretext_media::create_layout()?;
let prepared = layout.prepare(
    "A paragraph that can wrap as the reading column changes width.",
    "16px sans-serif",
    PrepareOptions::default(),
)?;
let narrow = PretextLayout::layout(&prepared, 180.0, 24.0);
let wide = PretextLayout::layout(&prepared, 360.0, 24.0);
assert!(narrow.line_count >= wide.line_count);
```

This fragment belongs in a function that handles or returns `PretextError`. It prepares once and measures twice, producing line counts and heights. It does not draw text. Use `prepare_with_segments` and `layout_with_lines` when you also need per-line text and geometry.

## Choose a layer

`ferroui-pretext` contains the portable preparation/layout engine. `ferroui-pretext-layout` adds wrap metrics, exclusion geometry, and multi-column flow. `ferroui-pretext-media` connects application text to FerroUI's font fallback and shaping services.

The portable engine does not create threads or access files. Measurement and shaping belong to an explicit `PretextLayout` instance, so choose the service configuration and lifetime deliberately.

## Native text services

Configure the application's fonts and shaping services before calling `ferroui_pretext_media::create_layout`. For direct drawing, `FerroTextService::shape_native` retains native font faces in its shaped result. Glyph positions use device-independent units relative to a baseline; clusters use UTF-16 units.

Keep coordinate and text-index units explicit when integrating prepared text with selection, hit testing, or a custom control. Rust byte offsets, Unicode scalar indices, and UTF-16 cluster indices are different representations.

## Reuse and invalidate deliberately

Prepared results retain their metrics when backend caches change. Reprepare when the source text or the relevant font/layout inputs change; do not infer invalidation only from a control's visual size.

Use ordinary TextBlock or RichTextBlock when they already meet the task. Prepared text is useful when the application needs custom flow or repeated measurement outside those controls. Consult the application API reference for the exact prepared-value and layout contracts.

## Public APIs and controls

- [`PretextLayout`]({{BASE}}/api/ferroui-pretext/struct-pretextlayout/) and [`PrepareOptions`]({{BASE}}/api/ferroui-pretext/struct-prepareoptions/) — preparation and repeated layout.
- [`create_layout`]({{BASE}}/api/ferroui-pretext-media/function-create_layout/) — use configured application text services.
- [TextBlock]({{BASE}}/controls/reference/textblock/) and [RichTextBlock]({{BASE}}/controls/reference/richtextblock/) — prefer a control when ordinary text presentation is sufficient.
- [Layout]({{BASE}}/design/layout/) and [localization]({{BASE}}/ecosystem/localization/).
