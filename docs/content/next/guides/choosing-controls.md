---
title: "Choose the right control"
description: "Find an input, layout, collection, or feedback control by the task it needs to solve."
sidebar:
  order: 2
---

Choose by the data and interaction you need, then customize appearance through styles and templates.

| Task | Start with | Considerations |
|---|---|---|
| Trigger an action | [Button]({{BASE}}/controls/reference/button/) | Use a command for application logic |
| Toggle an option | [CheckBox]({{BASE}}/controls/reference/checkbox/) or [ToggleSwitch]({{BASE}}/controls/reference/toggleswitch/) | [CheckBox]({{BASE}}/controls/reference/checkbox/) can represent an indeterminate state |
| Choose one of a few options | [RadioButton]({{BASE}}/controls/reference/radiobutton/) | Use a named group for mutually exclusive choices |
| Choose from a compact list | [ComboBox]({{BASE}}/controls/reference/combobox/) | Preserve a meaningful selected item |
| Edit text | [TextBox]({{BASE}}/controls/reference/textbox/) | Set wrapping, acceptance of returns, and validation deliberately |
| Display text | [TextBlock]({{BASE}}/controls/reference/textblock/) | Avoid a read-only [TextBox]({{BASE}}/controls/reference/textbox/) for simple labels |
| Choose a numeric range value | [Slider]({{BASE}}/controls/reference/slider/) or [NumericUpDown]({{BASE}}/controls/reference/numericupdown/) | [Slider]({{BASE}}/controls/reference/slider/) favors approximate adjustment; numeric input favors precision |
| Show selectable records | [ListBox]({{BASE}}/controls/reference/listbox/) | Use templates and collection notifications |
| Show hierarchical tabular data | [TreeDataGrid]({{BASE}}/controls/reference/treedatagrid/) | Define row models, columns, and virtualization |
| Arrange a form | [Grid]({{BASE}}/controls/reference/grid/) | Use rows/columns and size constraints rather than absolute coordinates |
| Arrange a short vertical flow | [StackPanel]({{BASE}}/controls/reference/stackpanel/) | It measures along its stacking axis differently from a bounded [Grid]({{BASE}}/controls/reference/grid/) |
| Show overflow | [ScrollViewer]({{BASE}}/controls/reference/scrollviewer/) | Avoid nesting around an already scrolling items control |
| Reveal optional details | [Expander]({{BASE}}/controls/reference/expander/) | Give its header an understandable label |
| Show progress | [ProgressBar]({{BASE}}/controls/reference/progressbar/) | Distinguish known progress from an indeterminate wait |

A custom template changes presentation while retaining the control's behavior. A custom control changes or extends behavior. Prefer the existing control when it already supplies the necessary input, focus, selection, and accessibility model.

Browse the [complete control reference]({{BASE}}/controls/) or start with [layout]({{BASE}}/design/layout/).

## Example: choose controls for a search screen

Use a [TextBox]({{BASE}}/controls/reference/textbox/) for the query, a [Button]({{BASE}}/controls/reference/button/) for an explicit Search action, and a [ListBox]({{BASE}}/controls/reference/listbox/) for selectable results. Put the search row above a bounded `*` row in a [Grid]({{BASE}}/controls/reference/grid/). Use a [ProgressBar]({{BASE}}/controls/reference/progressbar/) during loading and a [TextBlock]({{BASE}}/controls/reference/textblock/) for empty or error messages.

If every result needs aligned columns, editing, and sorting, consider [TreeDataGrid]({{BASE}}/controls/reference/treedatagrid/). If each result is a short title and subtitle, keep the simpler list with a data template.

Continue with [binding]({{BASE}}/guides/binding/), [commands]({{BASE}}/guides/commands/), and [collections]({{BASE}}/guides/collections/) to connect these controls to the same model.

## Show an identity or page through results

- Use [**PersonPicture**]({{BASE}}/api/ferroui-controls/struct-personpicture/) for a photo with initials or a placeholder as fallback. Give the adjacent person label meaningful text; an avatar alone is often ambiguous. See the [PersonPicture example](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/ControlCatalog/Pages/PersonPicturePage.xaml).
- Use [**PagerControl**]({{BASE}}/api/ferroui-controls/struct-pagercontrol/) when results come in explicit pages. Set `NumberOfPages` and read or bind the zero-based `SelectedPageIndex`; load the page data in your model. A PagerControl does not retrieve data. See the [PagerControl example](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/ControlCatalog/Pages/PagerControlPage.xaml).
- Use [media controls]({{BASE}}/ecosystem/media/) when the content needs playback, explicit camera capture, or live QR detection.
