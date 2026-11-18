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
            style("Button.accent")
                .set(TemplatedControl::background_property(), "#0063B1")
                .set(TemplatedControl::foreground_property(), "White")
                .nested(style("^:pointerover").set(Visual::opacity_property(), 0.85)),
        ],
        Button { class: "accent", "Save" }
        Button { "Cancel" }
    }
};
```

`style(selector)` parses a selector in XAML syntax, resolving type names among the registered classes; `style_of` takes a selector built with the selectors API. `.set(property, value)` converts the value as element setters do. A nested style's selector starts with `^`, the selector of the style it is in. `styles: [..]` (`.styles([..])` with the builders) adds the styles to the control's `Styles` when it is made. Use classes for application intent, as in XAML.

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
            Border { height: 12.0, corner_radius: 6.0, background: "#0063B1",
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
