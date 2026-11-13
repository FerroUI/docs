---
title: "Edit XAML with Designer Studio"
description: "Open a view, edit its layout, preview real controls, and diagnose design-time failures."
---

Designer Studio provides a visual workspace for XAML: an artboard, source editor, hierarchy, properties, and native preview. Use it to adjust a view while seeing the same FerroUI controls your application uses.

Designer Studio can run from the matching source checkout. Its package availability varies by release; check the [API index]({{BASE}}/api/) before adding it as a dependency.

## Open a working example

```sh
cargo run -p designer-studio -- --file docs/designer/samples/DesignWorkflows.xaml
```

To open your own file, replace the argument with its absolute path. The [workflow sample](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/docs/designer/samples/DesignWorkflows.xaml) gives you a known-working starting point for layout, design data, and focus order.

## Edit a small form

1. Switch to **Split** to show the artboard and XAML together.
2. Select a label or input in the hierarchy and change its margin or alignment.
3. Inspect the corresponding XAML change to learn which property controls the result.
4. Narrow the preview and check wrapping and input width.
5. Use **Preview** to exercise the actual platform window, then save the source.

F6 cycles Design, Split, and XAML views. Use **Fit** to show the document, or Shift+2 to fit the current selection. Use **Interact** to operate controls instead of selecting them.

## Preview realistic states

Open the [preview stages sample](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/docs/designer/samples/PreviewStages.xaml) to compare loading, empty, content, and error states. Check narrow and wide layouts, light and dark themes, and long localized labels.

Design-only data lets you build a useful view before a service is available. Keep it distinct from persisted application state. Check keyboard order and labels with the **Focus** tools, then verify them in the running application.

## When a document does not load

| Symptom | What to check |
| --- | --- |
| A custom type is unknown | Register its application metadata and resources |
| `x:Class` cannot be created | Supply the application's preview root factory |
| Relative resources fail | Open the file with its original document location |
| A resource dictionary has no artboard | Supply a preview control that consumes those resources |
| Artboard succeeds but the app fails | Verify real services, code-behind, and platform startup |

A preview is most useful when it preserves the application's actual types. Do not remove `x:Class` just to hide a missing registration error.

## Relevant public controls and guides

- [Grid]({{BASE}}/controls/reference/grid/), [StackPanel]({{BASE}}/controls/reference/stackpanel/), and [TextBox]({{BASE}}/controls/reference/textbox/) — common form building blocks.
- [XAML syntax]({{BASE}}/xaml/overview/), [resources]({{BASE}}/xaml/resources/), and [layout]({{BASE}}/design/layout/).
- [Testing]({{BASE}}/tools/testing/) — verify the result outside the designer.
