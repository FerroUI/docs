---
title: "Provide services to view models"
description: "Register services, choose their lifetime, resolve a scoped service, and dispose owned resources."
---

Use dependency injection when several view models need services such as settings, search, or storage. Register the implementations at startup and pass resolved services into your models. This keeps tests able to supply small substitutes.

`ferroui-dependency-injection` works independently of the UI. Add it at your application's FerroUI version; the optional `splat` feature connects it to ReactiveUI's resolver.

## Register and resolve a service

This complete example registers a clock shared by the application and a greeting scoped to one operation:

```rust
use ferroui_dependency_injection::*;
use std::rc::Rc;

trait Clock { fn hour(&self) -> u8; }
struct FixedClock;
impl Clock for FixedClock { fn hour(&self) -> u8 { 12 } }
struct Greeting { clock: Rc<dyn Clock> }

fn main() -> Result<(), ServiceError> {
    let mut services = ServiceCollection::new();
    services.add_singleton::<dyn Clock, _>(|_| Ok(Rc::new(FixedClock)));
    services.add(ServiceDescriptor::from_factory(
        ServiceLifetime::Scoped,
        service_factory!(Greeting, |clock: required(dyn Clock)| Rc::new(Greeting { clock })),
    ));
    let provider = services.build_service_provider(ServiceProviderOptions {
        validate_scopes: true,
        validate_on_build: true,
    })?;
    let scope = provider.create_scope()?;
    let greeting = scope.service_provider().get_required_service::<Greeting>()?;
    assert_eq!(greeting.clock.hour(), 12);
    scope.dispose()?;
    provider.dispose()?;
    Ok(())
}
```

Replace `FixedClock` with a real implementation in the application and keep it in tests for predictable results. `service_factory!` declares dependencies so provider validation can inspect them; an opaque closure's hidden dependencies cannot be validated until resolution.

## Choose a lifetime

| Lifetime | Reuse | Application example |
| --- | --- | --- |
| Singleton | One instance in the root provider | Shared settings service |
| Scoped | One instance per explicit scope | An editor session |
| Transient | A new instance per resolution | A short-lived operation object |

Create a scope when the editor or operation starts, and dispose it when that lifetime ends. Enable scope validation to catch a singleton capturing a scoped service or an attempt to resolve a scoped service from the root.

## Dispose resources explicitly

Factory-created services that own resources opt into disposal with `with_disposal`, `with_async_disposal`, or the corresponding callbacks. Dropping an `Rc` does not invoke the disposal contract. Services registered as existing instances remain caller-owned.

Use asynchronous disposal for async-only resources; synchronous disposal returns `AsyncDisposalRequired`. Providers and services use `Rc` and belong to one thread. Pass worker-safe data to background work rather than moving the UI's provider.

## Connect to a view model

Resolve the service at the application's composition point and pass it into the model constructor. The view binds the model's state; it does not resolve a service for each binding getter. See [MVVM]({{BASE}}/guides/mvvm/) and [testing]({{BASE}}/tools/testing/).

When using the `splat` adapter, complete registration before resolving services and install the adapter before ReactiveUI initialization. Changes to that adapter's registrations can replace its built provider; do not use registration changes as a normal UI state mechanism.

## Public APIs

- [`ServiceCollection`]({{BASE}}/api/ferroui-dependency-injection/struct-servicecollection/) — service registration.
- [`ServiceDescriptor`]({{BASE}}/api/ferroui-dependency-injection/struct-servicedescriptor/) and [`service_factory`]({{BASE}}/api/ferroui-dependency-injection/macro-service_factory/) — factories and dependency declarations.
- [`ServiceProviderOptions`]({{BASE}}/api/ferroui-dependency-injection/struct-serviceprovideroptions/) and [`ServiceLifetime`]({{BASE}}/api/ferroui-dependency-injection/enum-servicelifetime/) — validation and ownership.
