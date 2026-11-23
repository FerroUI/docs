---
title: "Style and animate declarative views"
description: "Choose a theme, add styles with XAML selectors, follow the theme variant and resources, and add transitions, animations, popups, and context menus from Rust."
---

Declarative views use the same styling system as XAML: selectors, styles, control themes, resources, and transitions. This page shows the Rust side of each. The ViewGallery sample (`cargo run -p view-gallery`, `-- --dark` to start dark) puts them together.

## Choose the theme of the application

`launch` uses the Fluent theme. `launch_themed` takes the theme the application uses, for example the WinUI 3 theme of `ferroui-themes-winui`:

```rust
use ferroui_view::prelude::*;

fn main() {
    launch_themed(
        || ferroui_themes_winui::WinUITheme::new().as_style(),
        || window().title("Settings").width(480.0).height(320.0).child(rsx! { Settings {} }).into(),
        |_| {},
    );
}
```

FerroUI has themes for five design languages, each covering every control with light and dark variants: WinUI 3, Fluent, Material 3 Expressive, macOS 26, and Simple. See [styles and themes]({{BASE}}/design/themes/) for what a theme supplies.

## Add styles with selectors

```rust
use ferroui_base::Visual;
use ferroui_controls::primitives::TemplatedControl;
use ferroui_view::prelude::*;

let panel = rsx! {
    StackPanel { spacing: 12.0,
        styles: [
            style(of::<Button>().class("accent"))
                .set(TemplatedControl::background_property(), rgb(0x0063B1))
                .set(TemplatedControl::foreground_property(), "White")
                .nested(style(nesting().pointer_over()).set(Visual::opacity_property(), 0.85)),
        ],
        Button { class: "accent", "Save" }
        Button { "Cancel" }
    }
};
```

`style(..)` takes a typed selector or text. A misspelled class or pseudo-class in a typed selector does not compile, and an application that uses only typed selectors links no selector parser. `.set(property, value)` converts the value as a setter of an element does, and `.nested(..)` adds a style that starts from the selector of this one.

| Text | Typed |
| --- | --- |
| `Button` | `of::<Button>()` |
| `:is(Control)` | `is_type::<Control>()` |
| `.accent` | `any().class("accent")` |
| `#title` | `any().name("title")` |
| `:pressed` | `any().pressed()` |
| `Button.accent:focus` | `of::<Button>().class("accent").focus()` |
| `StackPanel > TextBlock` | `of::<StackPanel>().child().of::<TextBlock>()` |
| `StackPanel TextBlock` | `of::<StackPanel>().descendant().of::<TextBlock>()` |
| `Button /template/ ContentPresenter` | `of::<Button>().template().of::<ContentPresenter>()` |
| `Button:not(.accent)` | `of::<Button>().not(any().class("accent"))` |
| `:nth-child(2n+1)` | `any().nth_child(2, 1)` |
| `Button[IsEnabled=False]` | `of::<Button>().property_equals(InputElement::is_enabled_property(), false)` |
| `Button, TextBlock` | `any_of([of::<Button>(), of::<TextBlock>()])` |
| `^:pointerover` | `nesting().pointer_over()` |

Every pseudo-class that a framework control declares is a method. A pseudo-class of your own control is written `.class(":name")`. To start several selectors from one prefix, use the pseudo-class methods or `.with_class(..)`: `.class(..)` extends the selector it is called on, so a clone of that selector gets the class too.

Text is the better form for a selector that comes from data or is copied from XAML. A type name in text that is not registered is matched by name, so a misspelled one never applies.

## Follow the theme variant and resources

| Hook or element | Gives |
| --- | --- |
| `use_theme_variant()` | The actual theme variant of the control the component is mounted in: light, dark, or one of the application |
| `use_resource(key)`, `use_resource_as::<T>(key)` | A resource as that control finds it (its own, its ancestors', the application's, and the theme's), followed as it changes |
| `use_parent_property(property)` | The value of a styled property on that control, inherited values included |
| `ThemeVariantScope { requested_theme_variant: .. }` | A part of the tree with another theme variant |

```rust
use ferroui_base::media::IBrush;
use ferroui_base::styling::ThemeVariant;
use ferroui_view::prelude::*;
use std::rc::Rc;

#[component(rerender)]
fn Gallery() -> Element {
    let dark = use_signal(|| false);
    let variant = if dark.get() { ThemeVariant::dark() } else { ThemeVariant::light() };
    rsx! {
        ThemeVariantScope { requested_theme_variant: variant,
            Page { dark }
        }
    }
}

#[component(rerender)]
fn Page(dark: Signal<bool>) -> Element {
    let background = use_resource_as::<Rc<dyn IBrush>>("SystemControlBackgroundAltHighBrush");
    rsx! {
        Border { background: background, padding: 16.0,
            Button { on_click: move |_| dark.update(|dark| *dark = !*dark), "Switch theme" }
        }
    }
}
```

The components below the scope read the new variant and resources and run again when they change.

## Follow a resource without running again

Each theme crate has a `keys` module: a constant per key of its dictionaries, with the type of its value. A builder can follow a key directly, so a change of the theme variant reaches the property with no component running again:

```rust
use ferroui_controls::Border;
use ferroui_themes_fluent::keys;
use ferroui_view::prelude::*;

let card = border()
    .dynamic_resource(Border::background_property(), keys::SystemControlBackgroundAltHighBrush)
    .static_resource(Border::corner_radius_property(), keys::ControlCornerRadius);
```

- `dynamic_resource` is `{DynamicResource}` and `static_resource` is `{StaticResource}`. Both also take the text of a key.
- A key that does not exist does not compile, and neither does a key whose value does not convert to the property. A color key on a brush property becomes a brush.
- `use_theme_resource(keys::Name)` reads a typed key in a component, which then runs again when it changes.
- A key with no single value type (a converter, a template, a geometry) is checked as a key only. Use it through its text, `keys::Name.name()`.
- Typed keys are exact roots of [theme trimming]({{BASE}}/design/themes/). Avoid `use keys::*`, which hides which keys the application names.

Text keys are the right form for a key from data or from a dictionary of your own.

## Write a control theme or a dictionary in Rust

`control_theme::<T>()` and `resource_dictionary()` make the same objects as compiled XAML. See [custom controls]({{BASE}}/design/custom-controls/) for a templated control with its whole theme in Rust.

```rust
use ferroui_base::styling::ThemeVariant;
use ferroui_base::Thickness;
use ferroui_view::prelude::*;

let resources = resource_dictionary()
    .value("CardPadding", Thickness::uniform(12.0))
    .theme_variant(ThemeVariant::light(), resource_dictionary().value("Accent", rgb(0x0063B1)))
    .theme_variant(ThemeVariant::dark(), resource_dictionary().value("Accent", rgb(0x60CDFF)))
    .build();
```

## Add transitions and animations

| Function | Gives |
| --- | --- |
| `transition(property, duration)`, `transition_eased(property, duration, easing)` | A transition for the property's value type (numbers, `bool`, `Thickness`, `CornerRadius`, `Color`, brushes, `Size`, `Point`, `Vector`) |
| `transitions([..])` | The `Transitions` of a control, for its `transitions` setter |
| `ms(n)` | `Duration::from_millis(n)` |
| `animation(duration).key_frame(cue, \|frame\| frame.set(property, value))` | A key-frame animation with `iterations`, `easing`, `fill_mode`, and `delay` |
| `use_animation(node_ref, trigger, \|\| animation(..))` | Runs the animation on the referenced control once its controls are in place, and again when `trigger` changes; a run in progress is cancelled first |

```rust
use ferroui_base::layout::{HorizontalAlignment, Layoutable};
use ferroui_view::prelude::*;

#[component(rerender)]
fn Bar() -> Element {
    let wide = use_signal(|| false);
    let bar_transitions = use_hook(|| transitions([transition(Layoutable::width_property(), ms(400))]));
    rsx! {
        StackPanel { spacing: 8.0,
            Button { on_click: move |_| wide.update(|wide| *wide = !*wide), "Animate" }
            Border { height: 12.0, corner_radius: 6.0, background: rgb(0x0063B1),
                horizontal_alignment: HorizontalAlignment::Left,
                width: if wide.get() { 480.0 } else { 120.0 }, transitions: bar_transitions }
        }
    }
}
```

In a component that runs again, keep `transitions([..])` in `use_hook`: a new value on each run would be set again.

## Popups and context menus

A `Popup` takes its child as an element (`Popup { .. }` in `rsx!`). The child is shown in a root of its own above the window, in the logical tree and under the owner of the popup, which is what a portal is in React. A property that holds a control takes an element too:

```rust
rsx! {
    Button { context_menu: rsx! { ContextMenu { MenuItem { header: "Copy" } MenuItem { header: "Paste" } } },
        "Right-click for a menu" }
}
```

Flyouts are not controls, so they are made with their own API and given to `flyout` or `context_flyout` as values.

## Public APIs

- [`style`]({{BASE}}/api/ferroui-view/prelude/style/function-style/), [`style_of`]({{BASE}}/api/ferroui-view/prelude/style/function-style_of/), and [`StyleBuilder`]({{BASE}}/api/ferroui-view/prelude/style/struct-stylebuilder/) — styles.
- [`use_theme_variant`]({{BASE}}/api/ferroui-view/hooks/function-use_theme_variant/), [`use_resource`]({{BASE}}/api/ferroui-view/hooks/function-use_resource/), [`use_resource_as`]({{BASE}}/api/ferroui-view/hooks/function-use_resource_as/), and [`use_parent_property`]({{BASE}}/api/ferroui-view/hooks/function-use_parent_property/) — theme variant and resources.
- [`transition`]({{BASE}}/api/ferroui-view/prelude/animation/function-transition/), [`transitions`]({{BASE}}/api/ferroui-view/prelude/animation/function-transitions/), [`animation`]({{BASE}}/api/ferroui-view/prelude/animation/function-animation/), and [`use_animation`]({{BASE}}/api/ferroui-view/prelude/animation/function-use_animation/) — motion.
- [`Style`]({{BASE}}/api/ferroui-base/styling/struct-style/) and [`ThemeVariant`]({{BASE}}/api/ferroui-base/styling/struct-themevariant/) — the styling model shared with XAML.
- [Styles and themes]({{BASE}}/design/themes/) and [resources]({{BASE}}/xaml/resources/) explain precedence and scope.
