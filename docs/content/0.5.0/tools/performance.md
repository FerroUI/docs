---
title: "Measure and improve application performance"
description: "Separate build time from UI latency, reproduce slow interactions, and choose a targeted improvement."
---

Start with an observable problem: a slow edit/build cycle, a long startup, or an interaction that stalls. Measure that operation with the same workload before and after a change.

## Choose what to measure

| Problem | Measure | First checks |
| --- | --- | --- |
| Rebuilding takes too long | First build and unchanged rebuild separately | Selected package, features, generated input watches |
| Startup is slow | Time until the first usable window | Synchronous service work, fonts, asset loading |
| Typing stalls | Time between input and visible update | Blocking callbacks, excessive filtering or notifications |
| Scrolling stalls | Frame behavior with realistic records | Bounded viewport, item templates, collection churn |
| Browser startup is slow | Compressed transfer and initialization separately | Lazy runtime loading, fonts, optional assets |

## Measure a build without cleaning the cache

From the source checkout, run the same command twice:

```sh
cargo build -p hello-world --timings
cargo build -p hello-world --timings
```

Read the Cargo timing report path printed by the command. The second run should mostly reuse work if inputs are unchanged. Do not compare a cold first run with a warm second run and call the difference an application optimization.

For ordinary development, build the sample or application you are editing rather than the entire workspace. Keep the target, features, profile, and compiler consistent when comparing changes.

## Fix a slow search screen

Suppose each keystroke rebuilds a list of thousands of records:

1. Measure typing and scrolling with a representative data set.
2. Move blocking I/O away from the UI thread.
3. Debounce queries and discard obsolete completions.
4. Update a notifying collection while preserving record identity.
5. Give the list a bounded viewport and keep item templates small.
6. Repeat the measurement and verify selection and keyboard behavior still work.

Use [async work]({{BASE}}/guides/async/) for scheduling and [collections]({{BASE}}/guides/collections/) for incremental updates. Avoid making getters perform disk access or create new commands on each read.

## Choose the update model for values that change often

In a declarative view, how a change reaches the controls decides its cost. The framework's declarative benchmarks (medians of a release build on an M3 Pro, with a list of 1,000 rows and 2,600 components) measured:

| Operation | Time |
| --- | --- |
| Mount the list from elements, as a component that runs again | 1.42 ms (1.07 ms for the same controls made directly) |
| A run of that component with nothing changed | 0.28 ms |
| One row changed through its signal, in the run-once model | 0.29 µs |
| A parent that runs again over 2,600 memoized components | 0.23 ms (14.44 ms without memoizing) |

A run costs the component's function and a comparison of its elements; a property that follows a signal costs only that property. Write the structure as components that run again, and pass signals or closures to the properties that change most, such as a progress value or a counter. Keep component parameters comparable (`PartialEq` and `Clone`) so that memoizing applies. The benchmarks run with `FERROUI_BENCH_FILTER=declarative cargo test --release -p ferroui-benchmarks run_benchmarks -- --ignored --nocapture` from the source checkout.

## Measure the artifact you will ship

Use the application's intended optimized profile when evaluating startup, scrolling, and binary size. [Build profiles]({{BASE}}/tools/build-profiles/) explains which one to use and how to add it to your application. For this repository's sample, a distribution build is:

```sh
cargo build -p hello-world --profile dist
cargo build -p hello-world-hooks --profile dist
```

Shipped profiles abort instead of unwinding, and an application that compiles its markup links only the theme units its markup and code reach, so compare sizes from the `dist` profile, not from a debug build. The FerroUI repository's [binary size guide](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/docs/binary-size.md) explains what an executable is made of and the settings that make it smaller.

Record the framework revision, target, profile, features, hardware, and workload. A change that helps one renderer or platform needs verification on the others you support. Keep benchmark results beside the reproduction rather than treating a framework-wide headline as your application's result.

## Public APIs and controls

- [`Dispatcher`]({{BASE}}/api/ferroui-base/threading/struct-dispatcher/) — scheduling UI work.
- [`view_stats`]({{BASE}}/api/ferroui-view/function-view_stats/) — the work of mounting and reconciliation in a declarative view.
- [`JoinHandle`]({{BASE}}/api/ferroui-system/task/struct-joinhandle/) — asynchronous work and completion.
- [ListBox]({{BASE}}/controls/reference/listbox/) and [TreeDataGrid]({{BASE}}/controls/reference/treedatagrid/) — collection presentation.
- [Developer tools]({{BASE}}/tools/devtools/) and [browser hosting]({{BASE}}/platforms/browser/).
