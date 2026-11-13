#!/usr/bin/env python3
"""Package the exact displayed XAML as a complete runnable desktop project."""
import json, os, pathlib, zipfile
SITE=pathlib.Path(__file__).resolve().parents[1]
version=os.environ.get('DOCS_VERSION','next')
content=pathlib.Path(os.environ.get('DOCS_CONTENT_ROOT',str(SITE.parent/'content'/os.environ.get('DOCS_CONTENT_VERSION',version))))
provenance=json.loads((SITE/'dist/agents/provenance.json').read_text())
source=(SITE/'tooling/example-main.rs').read_text()
dependency=f'{{ version = "={version}", features = ["xaml"] }}' if version!='next' else f'{{ git = "https://github.com/wieslawsoltes/FerroUI", rev = "{provenance["frameworkCommit"]}", features = ["xaml"] }}'
destination=SITE/'dist/generated/examples'
destination.mkdir(parents=True,exist_ok=True)
for example in json.loads((content/'examples.json').read_text()):
    manifest=f'[package]\nname = "ferroui-example-{example["id"]}"\nversion = "0.1.0"\nedition = "2021"\n\n[workspace]\n\n[dependencies]\nferroui = {dependency}\n'
    readme=f'# {example["title"]}\n\nFerroUI {version}, framework commit {provenance["frameworkCommit"]}.\n\nInstall the Rust and native build requirements for your platform, then run `cargo run`.\nEdit `src/View.xaml` to change the view.\nThis desktop project uses the same XAML as the real WASM documentation preview; its application lifetime is the desktop equivalent.\n'
    with zipfile.ZipFile(destination/(example['id']+'.zip'),'w',zipfile.ZIP_DEFLATED) as archive:
        for name,text in {'Cargo.toml':manifest,'README.md':readme,'src/main.rs':source,'src/View.xaml':example['xaml']+'\n'}.items():archive.writestr(name,text)
print('Packaged complete desktop projects for every live example')
