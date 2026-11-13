#!/usr/bin/env python3
"""Compiler-resolved docs extraction. Does not change production Rust toolchains."""
import argparse, hashlib, json, os, pathlib, shutil, subprocess

SITE = pathlib.Path(__file__).resolve().parents[1]
ROOT = SITE.parents[1]

def run(args):
    metadata = json.loads(subprocess.check_output(['cargo', 'metadata', '--no-deps', '--format-version', '1', '--locked'], cwd=args.source))
    packages = [p for p in metadata['packages'] if p['publish'] != [] and any(set(t['kind']) & {'lib', 'proc-macro', 'rlib'} for t in p['targets'])]
    if args.packages:
        wanted = set(args.packages.split(',')); packages = [p for p in packages if p['name'] in wanted]
    if not packages: raise SystemExit('No public library crates selected')
    target = pathlib.Path(os.environ.get('CARGO_TARGET_DIR', str(ROOT / 'target/docs-api')))
    destination = pathlib.Path(args.output)
    destination.mkdir(parents=True, exist_ok=True)
    command = ['cargo', 'doc', '--no-deps', '--lib', '--locked']
    if args.no_default_features: command += ['--no-default-features']
    if args.target: command += ['--target', args.target]
    for p in sorted(packages, key=lambda p:p['name']): command += ['-p', p['name']]
    if args.features: command += ['--features', args.features]
    application_features=[]
    if args.application_features:
        approved={
            'ferroui':['simple','winui-theme','macos-theme','material-theme','xaml','winui-xaml','color-picker','charts','livecharts','inking','repeater','treedatagrid','dialogs','browser','headless','reactive','dynamic-data','reactiveui','diagnostics'],
            'ferroui-view':['xaml','color-picker','treedatagrid','dialogs','reactiveui'],
            'ferroui-controls':['rtf-codepages'],
            'ferroui-media-camera-controls':['qr'],
        }
        for package in packages:
            application_features += [package['name']+'/'+f for f in approved.get(package['name'],[]) if f in package['features']]
        if application_features: command += ['--features',','.join(application_features)]
    env = dict(os.environ, CARGO_TARGET_DIR=str(target), RUSTC_BOOTSTRAP='1', RUSTDOCFLAGS='-Zunstable-options --output-format json')
    if not args.existing: subprocess.run(command, cwd=args.source, env=env, check=True)
    source_docs = target / args.target / 'doc' if args.target else target / 'doc'
    for p in packages:
        library = next(t for t in p['targets'] if set(t['kind']) & {'lib', 'proc-macro', 'rlib'})
        source = source_docs / (library['name'].replace('-', '_') + '.json')
        if not source.is_file(): raise SystemExit(f'Missing compiler output: {source}')
        shutil.copyfile(source, destination / (p['name'] + '.json'))
    commit = subprocess.check_output(['git','rev-parse','HEAD'],cwd=args.source,text=True).strip()
    (destination / 'manifest.json').write_text(json.dumps({'schemaVersion':1,'frameworkCommit':commit,'target':args.target or subprocess.check_output(['rustc','-vV'],text=True).split('host: ')[1].splitlines()[0],'features':args.features,'applicationFeatures':application_features,'rustc':subprocess.check_output(['rustc','--version'],text=True).strip(),'packages':[{ 'name':p['name'],'version':p['version'],'description':p['description'],'features':p['features'],'manifest':pathlib.Path(p['manifest_path']).relative_to(args.source).as_posix() } for p in packages]},indent=2)+'\n')
    print(f'Extracted {len(packages)} crates to {destination}')

if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=pathlib.Path,default=pathlib.Path(os.environ.get("DOCS_FRAMEWORK_ROOT", ROOT / ".framework/next")))
    p.add_argument('--output',default=str(SITE/'.cache/api/host'))
    p.add_argument('--target',default='');p.add_argument('--features',default='');p.add_argument('--packages',default='');p.add_argument('--existing',action='store_true');p.add_argument('--no-default-features',action='store_true')
    p.add_argument('--application-features',action='store_true',help='Also document explicitly approved optional application APIs')
    run(p.parse_args())
