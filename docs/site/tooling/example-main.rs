use ferroui::prelude::*;
use ferroui::base::metadata::from_markup_value;
use ferroui::markup_xaml_loader::FerroRuntimeXamlLoader;

#[repr(C)]
pub struct App {
    base: Application,
}

ferro_class!(App: Application);
ferro_impl_classes!(App: FerroObjectImpl);

impl NewApplication for App {
    fn new_application() -> Ref<Self> {
        instantiate(Self { base: Application::construct() })
    }
}

impl ApplicationImpl for App {
    fn initialize(this: &Self) {
        Self::parent_initialize(this);
        ferroui::controls::register_types();
        FerroRuntimeXamlLoader::register();
        this.styles().add(FluentTheme::new().as_style());
    }

    fn on_framework_initialization_completed(this: &Self) {
        let lifetime = this.application_lifetime();
        if let Some(desktop) = lifetime.as_ref().and_then(|l| l.as_classic_desktop_style_application_lifetime()) {
            let value = FerroRuntimeXamlLoader::load(include_str!("View.xaml"), None, None, None, false)
                .expect("Example XAML should load");
            let view = from_markup_value::<Ref<Control>>(&Some(value)).expect("Example root must be a control");
            let window = Window::new();
            window.set_title(Some("FerroUI documentation example".to_owned()));
            window.set_width(560.0);
            window.set_height(420.0);
            window.set_padding(Thickness::uniform(24.0));
            window.set_content(Some(Control::boxed(view)));
            desktop.set_main_window(Some(window));
        }
        Self::parent_on_framework_initialization_completed(this);
    }
}

fn main() -> std::process::ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let result = AppBuilder::configure::<App>().use_platform_detect().start_with_classic_desktop_lifetime(&args);
    std::process::ExitCode::from(result as u8)
}
