const sharedTopics = [
 {id:'getting-started',title:'Get started',description:'Install FerroUI and build your first working application.',items:[['Install & run','start/installation'],['Your first application','start/first-application'],['Application model','guides/architecture'],['XAML or Rust?','start/choose-ui'],['Interactive playground','start/playground']]},
 {id:'views',title:'Build views',description:'Choose controls, arrange content, and write your views.',items:[['Control gallery','controls'],['Choose a control','guides/choosing-controls'],['Layout & sizing','design/layout'],['Write XAML','xaml/overview'],['Compile XAML','xaml/compilation'],['Declarative Rust','declarative/overview'],['Coming from React','declarative/react'],['Custom controls','design/custom-controls']]},
 {id:'data',title:'Connect data & actions',description:'Bind application state, handle input, and navigate.',items:[['MVVM & view models','guides/mvvm'],['Data binding','guides/binding'],['Commands & buttons','guides/commands'],['Forms & validation','guides/forms'],['Lists & collections','guides/collections'],['Navigation','guides/navigation'],['Async work & UI updates','guides/async'],['Subscription lifetimes','guides/subscriptions'],['Dependency injection','ecosystem/dependency-injection']]},
 {id:'design',title:'Style & accessibility',description:'Apply a consistent appearance and support every user.',items:[['Styles & themes','design/themes'],['Resources','xaml/resources'],['Keyboard & accessibility','design/accessibility'],['Localization','ecosystem/localization']]},
 {id:'features',title:'Add application features',description:'Find packages for richer content and interactions.',items:[['Package overview','ecosystem/overview'],['TreeDataGrid','ecosystem/treedatagrid'],['Charts','ecosystem/charts'],['Docking','ecosystem/dock'],['Behaviors & interactions','ecosystem/behaviors'],['Prepared text','ecosystem/prepared-text'],['Video, camera & QR','ecosystem/media']]},
 {id:'ship',title:'Test, debug & ship',description:'Run on your platform, diagnose problems, and test behavior.',items:[['Desktop','platforms/desktop'],['Browser & WebAssembly','platforms/browser'],['iOS & Android','platforms/mobile'],['Testing','tools/testing'],['Troubleshooting','tools/troubleshooting'],['Developer tools','tools/devtools'],['Performance','tools/performance'],['Visual designer','tools/designer'],['MCP & automation','tools/mcp']]},
 {id:'reference',title:'Reference & releases',description:'Look up public APIs and check version-specific changes.',items:[['Public Rust API','api'],['Control reference','controls/reference'],['What’s new','releases/whats-new'],['Versions & migration','releases/versions'],['Release policy','releases/policy'],['Contribute to the docs','tools/contributing']]},
];
// Every documented version (0.5.0 and next) has the same topics. Give a version its own list here
// when a guide applies only to newer releases.
export function topicsFor(_version: string) {
 return sharedTopics;
}
export const commonTasks = [
 ['Bind a text field','guides/binding','TextBox, state, notifications'],
 ['Handle a button click','guides/commands','Commands, events, async actions'],
 ['Display a list','guides/collections','Items, selection, templates'],
 ['Style a control','design/themes','Styles, selectors, themes'],
 ['Fix a layout problem','design/layout','Sizing, alignment, panels'],
 ['Diagnose a problem','tools/troubleshooting','Bindings, resources, startup'],
];
