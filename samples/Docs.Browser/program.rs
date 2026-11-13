//! Real, resettable FerroUI views for documentation. No runtime Rust compilation.
#![cfg_attr(target_os = "emscripten", no_main)]

#[cfg(not(target_os = "emscripten"))]
use serde_json::json;

fn register() {
    ferroui_base::register_types();
    ferroui_controls::register_types();
    ferroui_controls_color_picker::register_types();
    ferroui_controls_treedatagrid::register_types();
    ferroui_markup_xaml_loader::FerroRuntimeXamlLoader::register();
    #[cfg(not(target_os = "emscripten"))]
    {
        ferroui_opengl::register_types();
        ferroui_themes_material::register_types();
        ferroui_reactiveui_controls::register_types();
        ferroui_controls_charts::register_types();
        ferroui_controls_livecharts::register_types();
        ferroui_controls_inking::register_types();
        ferroui_controls_repeater::register_types();
    }
}

// The interpreter is intentionally exposed through a bounded document vocabulary.
// In particular, includes, native hosts, arbitrary namespaces, and x:Class are unavailable.
fn validate(xaml: &str) -> Result<(), String> {
    if xaml.len() > 64 * 1024 {
        return Err("Examples are limited to 64 KiB of XAML.".into());
    }
    let document = roxmltree::Document::parse(xaml).map_err(|e| e.to_string())?;
    if document.descendants().count() > 1200 {
        return Err("Examples are limited to 1200 XML nodes.".into());
    }
    const ALLOWED: &[&str] = &[
        "UserControl",
        "StackPanel",
        "Grid",
        "DockPanel",
        "WrapPanel",
        "UniformGrid",
        "Canvas",
        "Border",
        "Panel",
        "Button",
        "RepeatButton",
        "ToggleButton",
        "RadioButton",
        "CheckBox",
        "ToggleSwitch",
        "TextBlock",
        "TextBox",
        "SelectableTextBlock",
        "Slider",
        "ProgressBar",
        "ScrollViewer",
        "ListBox",
        "ListBoxItem",
        "ComboBox",
        "ComboBoxItem",
        "ContentControl",
        "Separator",
        "Expander",
        "TabControl",
        "TabItem",
        "NumericUpDown",
        "Viewbox",
        "ToolTip",
        "Calendar",
        "DatePicker",
        "TimePicker",
        "ColorPicker",
        "SplitView",
        "Label",
        "RowDefinition",
        "ColumnDefinition",
        "Run",
        "Span",
        "LineBreak",
        "Rectangle",
        "Ellipse",
        "Polygon",
        "Polyline",
        "Path",
        "SolidColorBrush",
        "LinearGradientBrush",
        "GradientStop",
        "Binding",
        "Style",
        "Setter",
        "Styles",
        "ControlTheme",
        "ControlTemplate",
        "DataTemplate",
    ];
    for node in document.descendants().filter(|n| n.is_element()) {
        if node.ancestors().count() > 64 {
            return Err("Examples are limited to 64 levels of nesting.".into());
        }
        let tag = node.tag_name();
        if !matches!(
            tag.namespace(),
            None | Some("https://github.com/ferroui")
        ) {
            return Err(format!(
                "Namespace not available in the playground: {:?}",
                tag.namespace()
            ));
        }
        let owner = tag.name().split('.').next().unwrap_or("");
        if !ALLOWED.contains(&owner) {
            return Err(format!(
                "{owner} is not available in this playground. Use the downloadable native example."
            ));
        }
        for attribute in node.attributes() {
            if attribute.namespace() == Some("http://schemas.microsoft.com/winfx/2006/xaml")
                && attribute.name() != "Name"
            {
                return Err(format!(
                    "x:{} is not available in the playground.",
                    attribute.name()
                ));
            }
            let lower = attribute.value().to_ascii_lowercase();
            if (attribute.name().ends_with("Source") && !attribute.value().starts_with("{Binding"))
                || ["ferres:", "http:", "https:", "file:"]
                    .iter()
                    .any(|scheme| lower.contains(scheme))
            {
                return Err("External resources are not available in editable examples.".into());
            }
            // Resolve only well-known data binding extensions, never arbitrary executable markup.
            let value = attribute.value();
            for (offset, _) in value.match_indices('{') {
                if ![
                    "{Binding",
                    "{StaticResource",
                    "{DynamicResource",
                    "{TemplateBinding",
                    "{}",
                ]
                .iter()
                .any(|prefix| value[offset..].starts_with(prefix))
                {
                    return Err(
                        "This markup extension is not available in editable examples.".into(),
                    );
                }
            }
        }
    }
    Ok(())
}

#[cfg(not(target_os = "emscripten"))]
fn main() {
    register();
    let arguments: Vec<_> = std::env::args().skip(1).collect();
    if arguments.first().is_some_and(|a| a == "--verify-examples") {
        let examples: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(arguments.get(1).expect("Pass the version's examples.json"))
                .expect("Read example definitions"),
        )
        .expect("Parse example definitions");
        for example in examples.as_array().expect("Examples must be an array") {
            let xaml = example["xaml"].as_str().expect("Example XAML");
            validate(xaml).unwrap_or_else(|e| panic!("{}: {e}", example["id"]));
            ferroui_markup_xaml_loader::FerroRuntimeXamlLoader::load(xaml, None, None, None, false)
                .unwrap_or_else(|e| panic!("{}: {e}", example["id"]));
        }
        println!(
            "Verified {} examples with the selected framework's XAML interpreter",
            examples.as_array().unwrap().len()
        );
        return;
    }
    let registry = ferroui_base::FerroPropertyRegistry::instance();
    let mut types = Vec::new();
    // Many ordinary controls need no extra MarkupType declaration: their class
    // metadata already supplies construction and registered properties.
    for (class, path) in ferroui_base::TypeInfo::all_rust_paths() {
        let markup = class.markup();
        let mut properties = registry
            .get_registered(class)
            .iter()
            .copied()
            .collect::<Vec<_>>();
        properties.extend(registry.get_registered_attached(class).iter().copied());
        properties.sort_by_key(|p| p.name());
        properties.dedup_by_key(|p| p.name());
        let properties: Vec<_> = properties.into_iter().map(|p| {
            json!({ "name": p.name(), "type": p.property_type_name(), "owner": p.owner_type().name(),
                "attached": p.is_attached(), "direct": p.is_direct(), "readOnly": p.is_read_only(), "inherits": p.inherits(), "bindingMode": format!("{:?}", p.get_metadata(class).default_binding_mode()) })
        }).collect();
        let mut events = Vec::new();
        let mut ancestor = Some(class);
        while let Some(info) = ancestor {
            events.extend(
                ferroui_base::interactivity::RoutedEventRegistry::instance()
                    .get_registered(info)
                    .iter()
                    .map(|e| e.name().to_string()),
            );
            ancestor = info.base_type();
        }
        if let Some(markup) = markup {
            events.extend(markup.events.iter().map(|e| e.name.to_string()));
        }
        events.sort();
        events.dedup();
        types.push(json!({ "name": class.name(), "namespace": class.namespace(), "rustPath": path, "isTrait": false,
            "base": class.base_type().map(|b| b.full_name()), "contentProperty": markup.and_then(|m| m.content_property),
            "properties": properties, "events": events,
            "plainProperties": markup.map(|m| m.properties.iter().map(|p| json!({"name":p.name,"readOnly":p.set.is_none()})).collect::<Vec<_>>()).unwrap_or_default() }));
    }
    println!("{}", json!({ "schemaVersion":1,"types":types }));
}

#[cfg(target_os = "emscripten")]
mod browser {
    use super::*;
    use ferroui_base::media::FontManagerOptions;
    use ferroui_base::metadata::from_markup_value;
    use ferroui_base::styling::ThemeVariant;
    use ferroui_base::{
        ferro_class, ferro_impl_classes, instantiate, FerroObjectImpl, Ref, Thickness,
    };
    use ferroui_browser::{BrowserAccessibility, BrowserAppBuilder, BrowserPlatformOptions};
    use ferroui_controls::{
        AppBuilder, Application, ApplicationImpl, ApplicationImplExt, Border, Control,
        NewApplication,
    };
    use ferroui_fonts_inter::AppBuilderExtension;
    use ferroui_themes_fluent::FluentTheme;
    use std::{cell::RefCell, rc::Rc};
    use wasm_bindgen::prelude::*;

    ferroui_base::ferro_thread_local! { static ROOT: RefCell<Option<Ref<Border>>> = const { RefCell::new(None) }; }
    #[repr(C)]
    pub struct App {
        base: Application,
    }
    ferro_class!(App: Application);
    ferro_impl_classes!(App: FerroObjectImpl);
    impl NewApplication for App {
        fn new_application() -> Ref<Self> {
            instantiate(Self {
                base: Application::construct(),
            })
        }
    }
    impl ApplicationImpl for App {
        fn initialize(this: &Self) {
            Self::parent_initialize(this);
            this.styles().add(FluentTheme::new().as_style());
        }
        fn on_framework_initialization_completed(this: &Self) {
            let root = Border::new();
            root.set_padding(Thickness::uniform(24.0));
            if let Some(lifetime) = this
                .application_lifetime()
                .as_ref()
                .and_then(|l| l.as_single_view_application_lifetime())
            {
                lifetime.set_main_view(Some(root.clone().upcast()));
            }
            ROOT.with(|slot| *slot.borrow_mut() = Some(root));
            Self::parent_on_framework_initialization_completed(this);
        }
    }
    #[wasm_bindgen(js_name = runMain)]
    pub fn run_main() {
        register();
        AppBuilder::configure::<App>()
            .with_inter_font()
            .with(Rc::new(FontManagerOptions {
                default_family_name: Some("fonts:Inter#Inter".into()),
                ..Default::default()
            }))
            .start_browser_app("out", Some(BrowserPlatformOptions::default()));
        if let Some(top) = Application::current()
            .and_then(|app| app.application_lifetime())
            .and_then(|lifetime| {
                lifetime
                    .as_single_top_level_application_lifetime()
                    .and_then(|l| l.top_level())
            })
        {
            if let Some(tree) = BrowserAccessibility::of(&top) {
                tree.set_enabled(true);
            }
        }
    }
    #[wasm_bindgen(js_name = applyXaml)]
    pub fn apply_xaml(xaml: &str) -> Result<(), JsValue> {
        validate(xaml).map_err(|e| JsValue::from_str(&e))?;
        let value =
            ferroui_markup_xaml_loader::FerroRuntimeXamlLoader::load(xaml, None, None, None, false)
                .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let control = from_markup_value::<Ref<Control>>(&Some(value))
            .ok_or_else(|| JsValue::from_str("The root must be a control."))?;
        ROOT.with(|slot| {
            let slot = slot.borrow();
            let root = slot
                .as_ref()
                .ok_or_else(|| JsValue::from_str("The view has not started."))?;
            root.set_child(Some(control));
            Ok(())
        })
    }
    #[wasm_bindgen(js_name = setTheme)]
    pub fn set_theme(theme: &str) {
        if let Some(app) = Application::current() {
            app.set_requested_theme_variant(Some(if theme == "dark" {
                ThemeVariant::dark()
            } else {
                ThemeVariant::light()
            }));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::validate;
    #[test]
    fn editable_documents_reject_executable_and_external_content() {
        assert!(validate("<Button Content=\"Hello\" />").is_ok());
        for xaml in [
            "<NativeControlHost />",
            "<StyleInclude Source=\"https://example.com/a.xaml\" />",
            "<Button Content=\"{x:Static Unsafe.Call}\" />",
            "<Button Content=\"{Binding Source={x:Static Unsafe.Call}}\" />",
            "<Button xmlns:x=\"http://schemas.microsoft.com/winfx/2006/xaml\" x:Class=\"Foo\" />",
            "<other:Button xmlns:other=\"using:External\" />",
            "<Button>",
        ] {
            assert!(validate(xaml).is_err(), "accepted {xaml}");
        }
    }
    #[test]
    fn documentation_examples_use_the_supported_vocabulary() {
        let examples: serde_json::Value =
            serde_json::from_str(include_str!("examples.json")).unwrap();
        for example in examples.as_array().unwrap() {
            validate(example["xaml"].as_str().unwrap())
                .unwrap_or_else(|e| panic!("{}: {e}", example["id"]));
        }
    }
    #[test]
    fn documentation_examples_load_with_the_real_xaml_interpreter() {
        super::register();
        let examples: serde_json::Value =
            serde_json::from_str(include_str!("examples.json")).unwrap();
        let mut errors = Vec::new();
        for example in examples.as_array().unwrap() {
            let result = ferroui_markup_xaml_loader::FerroRuntimeXamlLoader::load(
                example["xaml"].as_str().unwrap(),
                None,
                None,
                None,
                false,
            );
            match result {
                Ok(value) if example["id"] == "element-binding" => {
                    let root = ferroui_base::metadata::from_markup_value::<
                        ferroui_base::Ref<ferroui_controls::Control>,
                    >(&Some(value))
                    .unwrap();
                    let editor = root
                        .find_control::<ferroui_controls::TextBox>("Editor")
                        .unwrap();
                    let echo = root
                        .find_control::<ferroui_controls::TextBlock>("Echo")
                        .unwrap();
                    editor.set_text(Some("Updated through a real binding"));
                    assert_eq!(
                        echo.text().as_deref(),
                        Some("Updated through a real binding")
                    );
                }
                Err(error) => errors.push(format!("{}: {error}", example["id"])),
                _ => {}
            }
        }
        assert!(errors.is_empty(), "{}", errors.join("\n"));
    }
}
