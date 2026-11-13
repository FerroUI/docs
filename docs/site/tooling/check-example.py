#!/usr/bin/env python3
"""Compile the shared downloadable desktop host against the selected framework."""
import json, os, pathlib, shutil, subprocess, tempfile

SITE=pathlib.Path(__file__).resolve().parents[1]
ROOT=pathlib.Path(os.environ.get('DOCS_FRAMEWORK_ROOT',str(SITE.parents[1] / '.framework' / os.environ.get('DOCS_VERSION', 'next'))))
CONTENT=pathlib.Path(os.environ.get('DOCS_CONTENT_ROOT',str(SITE.parent/'content/next')))
with tempfile.TemporaryDirectory(prefix='ferroui-docs-example-') as directory:
    project=pathlib.Path(directory)
    (project/'src').mkdir()
    (project/'Cargo.toml').write_text('[package]\nname = "ferroui-docs-download-check"\nversion = "0.1.0"\nedition = "2021"\n\n[workspace]\n\n[dependencies]\nferroui = { path = '+json.dumps(str(ROOT/'src/FerroUI'))+', features = ["xaml"] }\n')
    shutil.copyfile(ROOT/'Cargo.lock',project/'Cargo.lock')
    shutil.copyfile(SITE/'tooling/example-main.rs',project/'src/main.rs')
    (project/'src/View.xaml').write_text(json.loads((CONTENT/'examples.json').read_text())[0]['xaml'])
    env=dict(os.environ,CARGO_TARGET_DIR=os.environ.get('CARGO_TARGET_DIR',str(ROOT/'target')),CARGO_INCREMENTAL='0',CARGO_PROFILE_DEV_DEBUG=os.environ.get('CARGO_PROFILE_DEV_DEBUG','0'),CARGO_BUILD_JOBS=os.environ.get('CARGO_BUILD_JOBS','2'))
    subprocess.run(['cargo','check','--manifest-path',str(project/'Cargo.toml')],env=env,check=True)
