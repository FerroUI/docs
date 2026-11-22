const sharedTopics = [
 {id:'getting-started',title:'Get started',description:'Install FerroUI and build a first application in declarative Rust or XAML.',items:[['Install & run','start/installation'],['Project templates','start/templates'],['Your first application','start/first-application'],['Declarative Rust or XAML?','start/choose-ui'],['Application model','guides/architecture'],['Interactive playground','start/playground']]},
 {id:'declarative',title:'Declarative Rust UI',description:'Write views with builders or rsx!, signals, and React-like components with hooks.',items:[['Builders, rsx! & signals','declarative/overview'],['Components & hooks','declarative/components'],['Lists, async data & routing','declarative/patterns'],['Styles, themes & motion','declarative/styling'],['Components with XAML','declarative/xaml-interop'],['Hot reload & inspector','declarative/tools'],['Coming from React','declarative/react']]},
 {id:'xaml',title:'Compiled XAML',description:'Write views in XAML that the build compiles to Rust, or load markup at run time.',items:[['Write XAML','xaml/overview'],['Compile or load XAML','xaml/compilation'],['Resources','xaml/resources']]},
 {id:'views',title:'Build views',description:'Choose controls, arrange content, and package reusable parts.',items:[['Control gallery','controls'],['Choose a control','guides/choosing-controls'],['Layout & sizing','design/layout'],['Custom controls','design/custom-controls']]},
 {id:'data',title:'Connect data & actions',description:'Bind application state, handle input, and navigate.',items:[['Data binding','guides/binding'],['MVVM & view models','guides/mvvm'],['Commands & buttons','guides/commands'],['Forms & validation','guides/forms'],['Lists & collections','guides/collections'],['Navigation','guides/navigation'],['Async work & UI updates','guides/async'],['Subscription lifetimes','guides/subscriptions'],['Dependency injection','ecosystem/dependency-injection']]},
 {id:'design',title:'Style & accessibility',description:'Apply a consistent appearance and support every user.',items:[['Styles & themes','design/themes'],['Keyboard & accessibility','design/accessibility'],['Localization','ecosystem/localization']]},
 {id:'features',title:'Add application features',description:'Find packages for richer content and interactions.',items:[['Package overview','ecosystem/overview'],['TreeDataGrid','ecosystem/treedatagrid'],['Charts','ecosystem/charts'],['Docking','ecosystem/dock'],['Behaviors & interactions','ecosystem/behaviors'],['Prepared text','ecosystem/prepared-text'],['Video, camera & QR','ecosystem/media']]},
 {id:'ship',title:'Test, debug & ship',description:'Run on your platform, measure, diagnose problems, and test behavior.',items:[['Desktop','platforms/desktop'],['Browser & WebAssembly','platforms/browser'],['iOS & Android','platforms/mobile'],['Testing','tools/testing'],['Troubleshooting','tools/troubleshooting'],['Developer tools','tools/devtools'],['Performance & size','tools/performance'],['Build profiles','tools/build-profiles'],['Visual designer','tools/designer'],['MCP & automation','tools/mcp']]},
 {id:'reference',title:'Reference & releases',description:'Look up public APIs, check version-specific changes, and read where FerroUI comes from.',items:[['Public Rust API','api'],['Control reference','controls/reference'],['What’s new','releases/whats-new'],['Versions & migration','releases/versions'],['Release policy','releases/policy'],['Origins & attribution','start/origins'],['Contribute to the docs','tools/contributing']]},
];
// Every documented version (0.5.0 and next) has the same topics. Give a version its own list here
// when a guide applies only to newer releases.
export function topicsFor(_version: string) {
 return sharedTopics;
}
export const commonTasks = [
 ['Write a component','declarative/components','rsx!, hooks, the reconciler'],
 ['Follow state with signals','declarative/overview','Signals, memos, effects, two-way values'],
 ['Load data in a component','declarative/patterns','use_future, suspense, error boundaries'],
 ['Bind a text field','guides/binding','Signals, bindings, notifications'],
 ['Handle a button click','guides/commands','Handlers, commands, async actions'],
 ['Display a list','guides/collections','Keyed lists, items, templates'],
 ['Style a control','design/themes','Styles, selectors, themes'],
 ['Fix a layout problem','design/layout','Sizing, alignment, panels'],
 ['Diagnose a problem','tools/troubleshooting','Bindings, keys, resources, startup'],
];
