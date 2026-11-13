---
title: Own the lifetime of a subscription
description: "Keep notification guards alive, release them when a view leaves, and understand legacy disposable handles."
---

When a view subscribes to a change, give the subscription an owner. For example, the view that displays search results should keep its result subscription until it closes or starts following a different source.

## Choose an owner

| Return value | Lifetime |
| --- | --- |
| `Subscription` | Dropping the guard ends the subscription. Store it on the view or in its activation state. |
| `Rc<dyn IDisposable>` | Call `dispose()` explicitly or register the handle with the activation's disposable collection. Dropping one reference does not unsubscribe. |
| Event handler token | Follow the API's removal contract or use its guard helper where one is available. |

The new guard APIs and the original ReactiveUI/Rx APIs coexist. Check the actual return type before changing how you store or release a subscription.

## Follow a query while a view is active

Assuming `query_changes` is an `Rc<dyn IObservable<String>>` of query text, keep the returned guard with the view's activation state:

```rust
use ferroui_reactive::ObservableExt;

let subscription = query_changes.subscribe_next_guard(|query: String| {
    println!("Query changed: {query}");
});

// When the view stops observing this query source:
drop(subscription);
```

Do not assign a guard to `let _ = ...`; it would be dropped immediately. Call `detach()` only when you intentionally want observation to continue independently of the guard. Avoid closures that strongly retain the view that owns the subscription; capture a weak handle if the callback needs to update that view.

## Verify reactivation

Open and close the view twice, then change the source. An active view should update once; a detached view should not update. If a callback never fires, check whether the guard was dropped at the end of setup. If it fires twice, check whether the prior activation released its observer.

See the [`Subscription` API]({{BASE}}/api/ferroui-system/struct-subscription/), [reactive API]({{BASE}}/api/ferroui-reactive/), and [MVVM activation guide]({{BASE}}/guides/mvvm/).
