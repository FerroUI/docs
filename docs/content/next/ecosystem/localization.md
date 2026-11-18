---
title: "Translate an application with ProTranslate"
description: "Generate translation catalogs, bind localized text, and verify culture changes and layout."
---

Use ProTranslate to keep UI text and culture-dependent formatting outside your views. A translation service owns the current culture; bindings and generated accessors read from it.

Start from `cargo run -p sample-protranslate-demo` in the matching checkout. The [complete sample](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ProTranslateDemo) includes English, Polish, and Arabic catalogs, compiled XAML, and culture switching. Check the [release's crate index]({{BASE}}/api/) before adding a package.

## 1. Add catalogs with matching keys

Create `Strings.en-US.json`:

```json
{ "Hello": "Hello, {0}!", "Orders.Total": "Total: {0:N2}" }
```

Create `Strings.pl-PL.json`:

```json
{ "Hello": "Witaj, {0}!", "Orders.Total": "Razem: {0:N2}" }
```

Keep keys stable and placeholder sets consistent. A missing translation and an intentionally empty string are different; do not replace empty values with a fallback automatically.

## 2. Generate the typed provider

Add `ferroui-protranslate-core` and `ferroui-protranslate` as dependencies, plus `ferroui-protranslate-build` as a build dependency, all at your framework version. Add this step to your existing `build.rs`, preserving the application's XAML build step:

```rust
ferroui_protranslate_build::Builder::new()
    .catalog("Strings.en-US.json")
    .catalog("Strings.pl-PL.json")
    .generate()
    .expect("translation catalogs must be valid");
```

The generated file is `OUT_DIR/protranslate.rs`. Typed format methods check the number of placeholder arguments at the Rust call site.

## 3. Set the service and change culture

After generating those two catalogs, this application setup function creates the service:

```rust
use std::rc::Rc;
use ferroui_protranslate::Translation;
use ferroui_protranslate_core::{Culture, CultureService, TranslationService};

mod generated {
    include!(concat!(env!("OUT_DIR"), "/protranslate.rs"));
}

fn configure() -> Result<TranslationService, Box<dyn std::error::Error>> {
    let cultures = CultureService::new(Culture::parse("en-US")?);
    let translations = TranslationService::new(
        Rc::new(generated::GeneratedTranslationProvider), cultures,
    );
    Translation::set_service(translations.clone());
    let strings = generated::ProTranslateStrings::new(translations.clone());
    assert_eq!(strings.format_hello(["FerroUI".into()])?, "Hello, FerroUI!");
    translations.cultures().set_culture(Culture::parse("pl-PL")?);
    assert_eq!(strings.format_hello(["FerroUI".into()])?, "Witaj, FerroUI!");
    Ok(translations)
}
```

Retain the service for the application lifetime. Changing its culture should update bound translations without rebuilding the view. The generated typed accessors (`strings.format_hello(..)`) are ordinary Rust calls, so code outside XAML, including declarative views, can call them; a call returns the text for the current culture, so such a view reads it again after a culture change. The XAML extensions below bind translations in markup and follow the culture themselves.

## 4. Bind formatted text in XAML

Register `ferroui_protranslate::register_types()` before runtime markup loading. Compiled applications must include the adapter's metadata in their XAML build.

```xml
<StackPanel xmlns="https://github.com/ferroui"
            xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
            xmlns:pt="https://github.com/protranslate/xaml"
            pt:Translation.AutoFlowDirection="True">
  <Slider x:Name="Amount" Minimum="0" Maximum="2000" Value="1234.5" />
  <TextBlock Text="{pt:Format Orders.Total, Value={Binding #Amount.Value}}" />
</StackPanel>
```

Move the slider, then switch culture through the service. The amount should format using the selected culture, including when its numeric value has not changed. For ordinary text without arguments, use `Translate` or its `T` alias.

## Verify the complete screen

Test long translations, missing keys, placeholder mismatches, and right-to-left text. Let labels wrap and avoid fixed-height fields. Check both the visual order and keyboard order; translated text alone does not make a screen accessible.

## Public APIs and controls

- [`Builder`]({{BASE}}/api/ferroui-protranslate-build/struct-builder/) — catalog generation.
- [`TranslationService`]({{BASE}}/api/ferroui-protranslate-core/struct-translationservice/) and [`CultureService`]({{BASE}}/api/ferroui-protranslate-core/struct-cultureservice/) — translations and culture state.
- [`Translation`]({{BASE}}/api/ferroui-protranslate/struct-translation/) — XAML integration.
- [TextBlock]({{BASE}}/controls/reference/textblock/) and [Slider]({{BASE}}/controls/reference/slider/) — controls in the example.
- [Accessibility]({{BASE}}/design/accessibility/) and [adaptive layout]({{BASE}}/design/layout/).
