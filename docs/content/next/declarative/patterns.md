---
title: "Lists, async data, errors, and routing"
description: "Render keyed and virtualized lists, load data with use_future and suspense, contain failures with error boundaries, and navigate with the router."
---

An application larger than a form needs lists that keep their items, data that arrives later, parts of the window that can fail without ending the application, and navigation between views. `ferroui-view` covers each with an element or a hook. The examples are taken from the TodoMVC, ViewInterop, and ReactiveDemoComponents samples.

## Render a keyed list

In a component that runs again, write the list with `for` in `rsx!` and give each item a stable `key`:

```rust
use ferroui_view::prelude::*;

#[derive(Clone, PartialEq)]
pub struct Todo {
    pub id: u32,
    pub title: String,
}

#[component(rerender)]
fn TodoList(todos: Signal<Vec<Todo>>) -> Element {
    let visible = todos.get();
    rsx! {
        StackPanel { spacing: 2.0,
            for todo in visible {
                TextBlock { key: todo.id, text: todo.title }
            }
        }
    }
}
```

When an item moves, the reconciler moves its control instead of making a new one, so focus and state stay with the record. An array index is unsuitable as a key when positions can change.

In a view that runs once, `for_each(each, key, view)` follows a signal by itself: an item whose key and value stay keeps its control, a new or changed item gets a new one, and the controls of items that left are removed.

```rust
use ferroui_view::prelude::*;

fn todo_list(todos: Signal<Vec<Todo>>) -> Element {
    stack_panel()
        .child(for_each(move || todos.get(), |todo: &Todo| todo.id, |todo: Todo| text_block().text(todo.title)))
        .into()
}
```

## Show a large list with virtualization

An items control with virtualization creates its item containers itself. Give it a data template whose items are components, and keep the items and the template in hooks so that later runs do not replace them:

```rust
use ferroui_base::BoxedValue;
use ferroui_controls::ItemsSource;
use ferroui_view::prelude::*;
use std::rc::Rc;

#[derive(Clone, PartialEq)]
pub struct Person {
    pub name: String,
    pub city: String,
}

#[component(rerender)]
fn Directory(people: Rc<Vec<Person>>) -> Element {
    let source = use_hook({
        let people = people.clone();
        move || ItemsSource::from_items(people.iter().map(|person| Some(Rc::new(person.clone()) as BoxedValue)))
    });
    let item_template = use_hook(|| template(|person: Person| rsx! {
        StackPanel {
            TextBlock { text: person.name }
            TextBlock { text: person.city }
        }
    }));
    rsx! { ListBox { items_source: source, item_template: item_template } }
}
```

Only the visible items have controls. When a container scrolls out of view, its component is recycled for the next item and patched by the reconciler instead of being mounted anew: in the framework's test of 10,000 items in a 300-pixel list, scrolling to three distant positions mounted one more component in all. Give the list a bounded height, as for any [virtualized list]({{BASE}}/guides/collections/).

## Load data with use_future and suspense

`use_future(deps, make)` runs a future on the UI thread's dispatcher when the component first runs, and again whenever `deps` differ from the previous run. It returns a `Signal<AsyncState<T>>`: `Pending`, `Ready(T)`, or `Failed(String)`. `suspense` shows an element for each state.

```rust
#[component(rerender)]
fn Search() -> Element {
    let query = use_signal(String::new);
    let results = use_future(query.get(), |query| {
        let query = query.clone();
        async move {
            sleep(Duration::from_millis(300)).await;
            search(&query).await
        }
    });
    rsx! {
        StackPanel {
            TextBox { text: query.two_way() }
            {suspense(
                results,
                || rsx! { TextBlock { text: "Searching..." } },
                |found| rsx! { TextBlock { text: format!("{} crates", found.len()) } },
                |error| rsx! { TextBlock { text: error } },
            )}
        }
    }
}
```

Here `search` is the application's own `async fn` returning `Result<Vec<_>, String>`. With new dependencies the state goes back to `Pending` and another future starts. A future whose dependencies were replaced, or whose component was removed, is dropped at once and never writes the state, also when what it awaited had already completed. In this search, each keystroke abandons the previous future during its `sleep`, so the search runs once typing pauses for 300 ms. The future runs on the UI thread, so what it reads and writes needs no synchronization; blocking work still belongs on a worker ([async work]({{BASE}}/guides/async/)).

## Contain failures with an error boundary

```rust
error_boundary(
    || rsx! { Report {} },
    |info| rsx! {
        StackPanel {
            TextBlock { text: format!("The report failed: {}", info.message()) }
            Button { on_click: move |_| info.reset(), "Try again" }
        }
    },
)
```

When a run of a component below the boundary panics, on its first run or a later one, the boundary shows its fallback and the rest of the window continues. `info.reset()` mounts the child again with fresh hooks. The nearest boundary catches; a panic in a fallback goes to the boundary above. Boundaries guard the functions of components, not handlers, effects, or the mounting of controls, and the process's panic hook still prints the message.

## Navigate with the router

`router(initial, routes)` shows the view of the first route whose pattern matches the current path and provides a `Router` handle to the components below:

```rust
router("/", vec![
    route("/", |_| rsx! { Home {} }),
    route("/people/:id", |m| rsx! { Person { id: m.param("id").unwrap_or_default().to_string() } }),
    route("*", |m| rsx! { NotFound { path: m.path().to_string() } }),
])
```

`:name` matches one segment and binds it, `*` matches the rest of the path, and a last `route("*", ..)` shows what no other route matches. A component calls `use_router()` while it runs and keeps the handle, which is `Copy`, for its handlers: `navigate(path)`, `navigate_back()`, `navigate_and_reset(path)`, and the reactive `current()`, `can_go_back()`, and `stack()`. The entries of the stack are paths, so state that outlives navigation lives above the router in signals or context. TodoMVC uses its filters (`/`, `/active`, `/completed`) as routes; ReactiveDemoComponents opens a crate's details as `/crate/:name` inside an error boundary.

The router is in-application navigation. In the browser, map routes to the page URL explicitly if users need bookmarks; see [navigation]({{BASE}}/guides/navigation/).

## Write values with typed forms

Setters take short typed values, which the compiler checks and which link no parser:

```rust
use ferroui_base::media::Colors;
use ferroui_view::prelude::*;

let card = border()
    .background(linear_gradient(&[(0.0, rgb(0x0063B1)), (1.0, rgb(0x60CDFF))]).horizontal())
    .box_shadow(shadow(0.0, 2.0, 4.0, argb(0x40000000)))
    .render_transform(translate(10.0, 5.0).rotate(45.0))
    .effect(blur(2.0));
let save = button().hot_key(ctrl(KeyCode::S)).content("Save");
let icon = path().data(path!("M8 3v5H3v2h5v5h2V10h5V8h-5V3z")).fill(Colors::BLACK);
```

| Value | Typed forms |
| --- | --- |
| Key gesture | `ctrl`, `shift`, `alt`, `meta`, chained: `ctrl(KeyCode::S).shift()` |
| Transform | `translate`, `rotate` (degrees), `scale`, `skew`, chained, and `.matrix(..)` |
| Box shadow | `shadow(x, y, blur, color)`, `.spread(..)`, `.inset()`; an array gives several |
| Effect | `blur(radius)`, `drop_shadow(x, y, radius, color)` |
| Brush | `rgb(0x1E293B)`, `argb(0x801E293B)`, `linear_gradient(&[..])` |
| Path | `path!("M...")`, checked when the crate compiles; `path_data()` with `move_to`, `line_to`, `quad_to`, `cubic_to`, `arc_to`, `close` for a path computed from values |

The keyboard key is `KeyCode` in the prelude, because `Key` there is the key of an element among its siblings. Elements that name one color or one gradient share one brush, and elements that name one `path!` share one geometry.

Text stays the better form for a value that comes from data, such as a color from a settings file or a path from a document: `Color::parse`, `Geometry::parse`, `KeyGesture::parse`.

## Use typed routes

A route can be a type whose fields are its parameters. See [navigation]({{BASE}}/guides/navigation/).

## Run the samples

```sh
cargo run -p todo-mvc
cargo run -p reactive-demo-components --no-default-features
cargo run -p view-interop
```

[TodoMVC](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/TodoMvc) is the TodoMVC specification as components with hooks and a router. [ReactiveDemoComponents](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ReactiveDemoComponents) is a crate browser whose throttled search is a `use_future`; without default features it searches an in-memory catalogue instead of crates.io. Both have scenario tests: `cargo test -p todo-mvc` and `cargo test -p reactive-demo-components`.

## Public APIs

- [`for_each`]({{BASE}}/api/ferroui-view/prelude/function-for_each/) and [`template`]({{BASE}}/api/ferroui-view/prelude/template/function-template/) — lists that follow state and virtualized item templates.
- [`use_future`]({{BASE}}/api/ferroui-view/async_data/function-use_future/), [`suspense`]({{BASE}}/api/ferroui-view/async_data/function-suspense/), [`AsyncState`]({{BASE}}/api/ferroui-view/async_data/enum-asyncstate/), and [`sleep`]({{BASE}}/api/ferroui-view/async_data/function-sleep/) — asynchronous data.
- [`error_boundary`]({{BASE}}/api/ferroui-view/error_boundary/function-error_boundary/) and [`ErrorInfo`]({{BASE}}/api/ferroui-view/error_boundary/struct-errorinfo/) — failure containment.
- [`router`]({{BASE}}/api/ferroui-view/router/function-router/), [`route`]({{BASE}}/api/ferroui-view/router/function-route/), [`use_router`]({{BASE}}/api/ferroui-view/router/function-use_router/), and [`Router`]({{BASE}}/api/ferroui-view/router/struct-router/) — navigation.
- [ListBox]({{BASE}}/controls/reference/listbox/) and [StackPanel]({{BASE}}/controls/reference/stackpanel/) — list hosts.
