---
title: "Keep the interface responsive"
description: "Run native worker tasks, report progress, and prevent stale requests from updating a view."
sidebar:
  order: 8
---

Controls belong to the UI thread. Run expensive computation and blocking I/O away from that thread, then schedule the resulting UI updates through the dispatcher or the reactive UI scheduler.


## Move blocking desktop work to a task

After [ReactiveUI startup]({{BASE}}/guides/mvvm/) has installed the UI synchronization context, a command can await a task that returns ordinary data:

```rust
use ferroui_system::{threading::tasks, ObservableError};

async fn calculate_total(values: Vec<u64>) -> Result<u64, ObservableError> {
    tasks::run(move || Ok(values.into_iter().sum::<u64>())).await
}
```

The closure and its data must be `Send`; do not capture `Ref<Control>`, an `Rc` view model, or a UI service provider. Update the view model in the awaiting UI task after completion. This example demonstrates the boundary for native worker tasks; the tiny sum itself would not justify a worker in a real application.

`ferroui_system::task::spawn_local` runs a future on the current thread. Similarly, `ReactiveCommand::create_run_in_background` uses the task-pool scheduler, which defaults to the current thread. Neither name guarantees a worker thread. Blocking work needs an actual worker facility such as `tasks::run` on supported native targets.

## Represent the complete operation

Expose loading, success, empty, and error states. An empty collection after a successful query is different from a failed query. Preserve the user's context while refreshing data and offer a retry when failure is recoverable.

## Cancel obsolete results

Search-as-you-type creates overlapping operations. Cancel the older request or ignore its result using a request identity; otherwise an old response can overwrite the newest query's results. Tie cancellation to the view model's activation or component lifetime.

ReactiveUI supplies observable composition and scheduler integration. Declarative components supply asynchronous resources and error boundaries. Choose the mechanism that matches the state model already used by the view.

## Browser constraints

A browser build cannot treat threads, filesystem access, or blocking waits as if it were a desktop process. The default browser mode executes UI code on the page thread. The optional threaded renderer does not make application code safe to block.

## Verification

Exercise delayed completion, cancellation, repeated requests, failure, and navigating away before completion. A responsive spinner does not prove your operation is safe: check that the view releases subscriptions and that stale completion cannot mutate a new view.

## Work through a search request

1. Capture the query and a request ID; set loading state and clear the previous error.
2. Start the operation with cancellation tied to the view's lifetime.
3. On completion, compare the request ID with the latest request before changing results.
4. For success, show either results or an explicit empty message. For failure, preserve the query and offer retry.
5. Clear loading only if this completion still belongs to the current request.

Try a slow first query followed by a fast second query. The first completion must not replace the second query's results. Then navigate away before either completes and check that the old screen receives no update.

## Public APIs and controls

- [`JoinHandle`]({{BASE}}/api/ferroui-system/task/struct-joinhandle/) and [`CancellationToken`]({{BASE}}/api/ferroui-system/threading/struct-cancellationtoken/) — work and cancellation.
- [`Dispatcher`]({{BASE}}/api/ferroui-base/threading/struct-dispatcher/) — UI-thread scheduling.
- [`ReactiveCommand`]({{BASE}}/api/ferroui-reactiveui/reactive_command/struct-reactivecommand/) — operation status and errors.
- [ProgressBar]({{BASE}}/controls/reference/progressbar/), [TextBlock]({{BASE}}/controls/reference/textblock/), and [Button]({{BASE}}/controls/reference/button/) — progress, explanation, and retry.

## Schedule a future on the UI dispatcher

Use `Dispatcher::spawn_local` on the UI thread when the future must own thread-local UI state. For example, inside a view that already has an asynchronous search service, launch the request and return a handle the view can abort:

```rust
use ferroui_base::threading::Dispatcher;

let task = Dispatcher::ui_thread().spawn_local(async move {
    let results = service.search(query).await;
    // Check the request identity before applying results to view state.
    results
});
let cancel_search = task.abort_handle();
// Retain cancel_search with the active view. Call abort() on teardown.
```

The example assumes an owned service and query and an asynchronous `search` method. The future runs on the dispatcher, so a synchronous blocking call inside it still freezes the UI. Await the [`JoinHandle`]({{BASE}}/api/ferroui-system/task/struct-joinhandle/) when you need the result and handle its join error separately from a service error. Dropping the join handle lets the task continue; dropping a subscription guard releases its observation. These lifetimes are intentionally different. See [subscription lifetimes]({{BASE}}/guides/subscriptions/).
