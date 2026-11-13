---
title: "Display tabular and hierarchical data"
description: "Choose a TreeDataGrid source, define columns, and keep selection and updates predictable."
---

Use TreeDataGrid when records need columns, sorting, cell editing, or expandable child rows. For a simple selectable list, start with [ListBox]({{BASE}}/controls/reference/listbox/) instead.

Add `ferroui-controls-treedatagrid` and the data-model crate `ferroui-treedatagrid-core` at the same version as your framework. Register the control types and load the matching theme resources; the complete demo shows that setup.

## Run the data-grid demo

```sh
cargo run -p treedatagrid-demo
```

Open the Countries page to try sorting and filtering, then People to try declarative columns and hierarchy. [The demo source](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/TreeDataGridDemo) includes the data models, theme setup, and view registration.

## Define a view with columns

This fragment expects a registered `People` collection on the view model and registered `Name` and `Title` properties on each item. It uses runtime bindings to keep the example independent of an application's namespace:

This fragment uses explicit reflection bindings because it omits your application’s registered source types. See [compiled binding setup]({{BASE}}/xaml/compilation/#migrate-to-compiled-bindings-by-default) for typed XAML.

```xml
<TreeDataGrid xmlns="https://github.com/ferroui"
              ItemsSource="{ReflectionBinding People}" SelectionMode="Row,Multiple">
  <TreeDataGridTextColumn Header="Name" Width="2*" Binding="{ReflectionBinding Name}" />
  <TreeDataGridTextColumn Header="Title" Width="2*" Binding="{ReflectionBinding Title}" />
</TreeDataGrid>
```

`ItemsSource` supplies records; column bindings read each record. The [People XAML example](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/TreeDataGridDemo/Views/PeopleXamlPage.xaml) adds compiled bindings, a child expander, a template column, and check boxes.

## Choose a source model

| Need | Starting point |
| --- | --- |
| Flat records with programmatic columns | `FlatTreeDataGridSource` |
| Records with expandable children | `HierarchicalTreeDataGridSource` |
| Columns declared alongside the view | `ItemsSource` and XAML column declarations |
| Framework-neutral column models | Core source assigned through the control's `Model` path |

For programmatic columns, accessors describe how to read and optionally write item properties. Use the public [Countries view model](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/samples/TreeDataGridDemo/ViewModels/countries_page_view_model.rs) as an end-to-end example of a notifying list, text columns, a template column, filtering, and row selection.

## Make edits and selection survive updates

Keep record identity stable. Notify item property changes when a cell value changes, and notify collection changes when adding or removing records. A plain vector mutation does not tell the grid what changed.

Choose whether the task selects rows or cells. When deleting or filtering a selected record, update the application's selection deliberately. For hierarchy, decide where expansion state lives so a refresh does not unexpectedly close every node.

## Keep the viewport bounded

Place the grid in a `*` row of a constrained [Grid]({{BASE}}/controls/reference/grid/). Avoid wrapping it in another scrolling container. Test with enough rows and columns to require scrolling, and verify keyboard editing, empty data, and theme changes.

## Public APIs and controls

- [TreeDataGrid]({{BASE}}/controls/reference/treedatagrid/) — registered properties and markup.
- [`FlatTreeDataGridSource`]({{BASE}}/api/ferroui-treedatagrid-core/struct-flattreedatagridsource/) and [`HierarchicalTreeDataGridSource`]({{BASE}}/api/ferroui-treedatagrid-core/struct-hierarchicaltreedatagridsource/) — application data sources.
- [`Accessor`]({{BASE}}/api/ferroui-treedatagrid-core/accessor/struct-accessor/) and [`TextColumn`]({{BASE}}/api/ferroui-controls-treedatagrid/models/struct-textcolumn/) — item access and columns.
- [Collection notifications]({{BASE}}/guides/collections/) and [layout]({{BASE}}/design/layout/) — the underlying patterns.
