#!/usr/bin/env python3
"""Check out a pinned upstream snapshot and add the documentation runner."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[3]
PIN = json.loads((ROOT / 'framework.json').read_text())

def git(source, *args):
    return subprocess.check_output(['git', '-C', str(source), *args], text=True).strip()

def prepare(version, environment):
    if not re.fullmatch(r'next|\d+\.\d+\.\d+(?:-[\w.-]+)?', version):
        raise ValueError('Invalid documentation version')
    commit = PIN['next'] if version == 'next' else PIN['releases'][version]
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        raise ValueError('Framework pins must be full commit IDs')
    content = ROOT / 'docs/content' / version
    if not content.is_dir():
        raise ValueError(f'Missing curated content for {version}')
    source = ROOT / '.framework' / version
    if not source.exists():
        source.mkdir(parents=True)
        git(source, 'init', '--quiet')
        git(source, 'remote', 'add', 'origin', PIN['repository'])
        git(source, 'fetch', '--depth=1', 'origin', commit)
        git(source, 'checkout', '--detach', commit)
    if git(source, 'rev-parse', 'HEAD') != commit:
        raise ValueError(f'{source} is not at {commit}; move it aside before selecting a new pin')
    manifest = git(source, 'show', 'HEAD:Cargo.toml') + '\n'
    if version != 'next':
        actual = re.search(r'\[workspace.package\][\s\S]*?^version\s*=\s*"([^"]+)"', manifest, re.M)
        if not actual or actual.group(1) != version:
            raise ValueError('Release pin and workspace version disagree')
    runner = source / 'samples/Docs.Browser'
    if git(source, 'ls-files', '--', 'samples/Docs.Browser'):
        raise ValueError('Upstream already owns the runner path')
    shutil.copytree(ROOT / 'samples/Docs.Browser', runner, dirs_exist_ok=True)
    # Tests embed the selected version's examples next to the runner.
    shutil.copyfile(content / 'examples.json', runner / 'examples.json')
    (source / 'Cargo.toml').write_text(manifest.replace('members = [', 'members = [\n    "samples/Docs.Browser",', 1))
    (runner / 'Cargo.toml').write_text((runner / 'Cargo.toml').read_text().replace('serde_json.workspace = true', 'serde_json = "1"'))
    # Resolve the new runner workspace entry using the existing upstream lockfile.
    subprocess.run(['cargo', 'metadata', '--format-version', '1', '--filter-platform', 'wasm32-unknown-emscripten'],
                   cwd=source, check=True, stdout=subprocess.DEVNULL)
    values = {
        'DOCS_VERSION': version,
        'DOCS_CONTENT_ROOT': str(content),
        'DOCS_FRAMEWORK_ROOT': str(source),
        'DOCS_FRAMEWORK_COMMIT': commit,
        'DOCS_BASE': f"{os.environ.get('DOCS_PREFIX', '/docs').rstrip('/')}/{version}",
    }
    if environment:
        with open(environment, 'a') as out:
            for key, value in values.items():
                out.write(f'{key}={value}\n')
    print(f'Documentation {version}: framework {commit} at {source}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', default='next')
    parser.add_argument('--environment', default=os.environ.get('GITHUB_ENV'))
    args = parser.parse_args()
    prepare(args.version, args.environment)
