---
description: "Choose a chart family, populate series, and verify changing data and readable labels."
title: Visualize data with charts
---

FerroUI provides chart controls and a LiveCharts integration. Keep data preparation in the model or view model, then present the prepared series through the chart's public properties.

## Choose a starting sample

Run `cargo run -p charts-demo` or `cargo run -p livecharts-demo --bin livecharts-demo` in the matching checkout. Check the package names in the samples' manifests if your release predates these libraries.

The [LiveCharts sample](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/LiveChartsDemo) shows Cartesian and pie charts, axes, legends, observable data, and updates. It supplies complete series data and runtime/compiled XAML integration.

## Declare the chart

The LiveCharts controls register their XML namespace separately:

```xml
<lc:CartesianChart xmlns="https://github.com/ferroui"
                   xmlns:lc="https://ferroui.dev/livecharts"
                   LegendPosition="Bottom">
  <lc:CartesianChart.XAxes>
    <lc:Axis TextSize="11" />
  </lc:CartesianChart.XAxes>
  <lc:CartesianChart.YAxes>
    <lc:Axis MinLimit="0" TextSize="11" />
  </lc:CartesianChart.YAxes>
  <lc:LineSeries Name="Planned" Stroke="#2459E0"
                 StrokeThickness="2.5" GeometrySize="6" />
</lc:CartesianChart>
```

This markup defines presentation; populate or bind the series values using the sample's view model and the exact APIs in the selected version. An empty series is not a failure to render axes or data binding.

## Keep updates responsive

Retain stable series identities when possible, notify collection/item changes through the appropriate data model, and deliver UI updates on the correct scheduler. Aggregate high-frequency telemetry before updating a complex chart.

Always provide labels, units, and a textual interpretation of important results. A chart should not be the only way to understand an error or complete a task. Test large data sets, empty data, resizing, theme changes, input, and animated updates with the target renderer.

## Build up a chart in small steps

1. Run the sample with its supplied series and confirm data appears.
2. Replace one series' values with a small known data set, such as three monthly totals.
3. Add the axis label and unit so the numbers are interpretable.
4. Update one value through the model and confirm the chart changes.
5. Try zero records and a large result before adding more styling or animation.

Keep the view's series type consistent with the chosen chart library. The built-in chart control and the LiveCharts family have different contracts; a similarly named property is not evidence that their series models are interchangeable.

## Public APIs and controls

- [CartesianChart]({{BASE}}/controls/reference/cartesianchart/) — LiveCharts axes, series, and properties.
- [Built-in Chart]({{BASE}}/controls/reference/ferroui-controls-charts/chart/) and [LiveCharts Chart base]({{BASE}}/controls/reference/ferroui-livecharts/chart/) — distinct control families.
- [`LineSeries`]({{BASE}}/api/ferroui-controls-livecharts/struct-lineseries/) — the line series used above.
- [Collections]({{BASE}}/guides/collections/) and [async updates]({{BASE}}/guides/async/).
