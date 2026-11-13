#!/usr/bin/env python3
"""Assemble the GitHub Pages output from the documentation snapshots built for each pinned version."""
import argparse, html, json, pathlib, re, shutil, tempfile

VERSION = re.compile(r'^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$')
# GitHub Pages publishes sites of up to 1 GB; stay below it with a margin.
BUDGET = 850_000_000

def version_key(version):
    match = VERSION.fullmatch(version)
    if not match: raise ValueError(f'Invalid release version: {version}')
    prerelease = match.group(4)
    identifiers = tuple((0, int(p)) if p.isdigit() else (1, p) for p in prerelease.split('.')) if prerelease else ()
    return tuple(int(n) for n in match.groups()[:3]) + (not bool(prerelease), identifiers)

def redirect(destination):
    target = html.escape(destination, quote=True)
    return (f'<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={target}">'
            f'<link rel="canonical" href="{target}"><title>FerroUI documentation</title>'
            f'<a href="{target}">Open the FerroUI documentation</a></html>')

def assemble(next_site, releases, output, prefix='/docs', budget=BUDGET):
    """Lay out every version under the site root: <prefix>/next/, <prefix>/<version>/, versions.json and a landing redirect."""
    output = pathlib.Path(output).resolve()
    if output.exists(): raise ValueError('Use a new output directory; existing deployments are never overwritten in place')
    if not prefix.startswith('/') or '..' in prefix: raise ValueError('Invalid documentation prefix')
    prefix = prefix.rstrip('/')
    with tempfile.TemporaryDirectory(prefix='ferroui-pages-') as temporary:
        staged = pathlib.Path(temporary) / 'site'
        staged.mkdir()
        shutil.copytree(next_site, staged / 'next')
        versions = []
        releases = pathlib.Path(releases)
        for source in sorted(releases.iterdir()) if releases.exists() else []:
            if not source.is_dir() or not VERSION.fullmatch(source.name): continue
            metadata = json.loads((source / 'release.json').read_text())
            provenance = json.loads((source / 'agents/provenance.json').read_text())
            if metadata['version'] != source.name or provenance['version'] != source.name: raise ValueError('Release identity mismatch')
            shutil.copytree(source, staged / source.name)
            versions.append({'id': source.name, 'label': 'v' + source.name + (' · preview' if metadata['prerelease'] else ''), 'prerelease': metadata['prerelease']})
        versions.sort(key=lambda v: version_key(v['id']), reverse=True)
        stable = next((v['id'] for v in versions if not v['prerelease']), None)
        versions.append({'id': 'next', 'label': 'Next · unreleased', 'prerelease': True})
        (staged / 'versions.json').write_text(json.dumps({'schemaVersion': 1, 'stable': stable, 'versions': versions}, indent=2) + '\n')
        current = stable or 'next'
        destination = f'{prefix}/{current}/'
        (staged / 'index.html').write_text(redirect(destination))
        (staged / 'llms.txt').write_text(
            f'# FerroUI documentation\n\nStable: {stable or "no stable snapshot is published yet"}.\n\n'
            f'- [Current documentation]({destination}llms.txt)\n- [Available versions]({prefix}/versions.json)\n'
            f'- [Development documentation]({prefix}/next/llms.txt)\n')
        # Pages serves one 404 page for the whole project site: use the current version's.
        if (staged / current / '404.html').is_file(): shutil.copyfile(staged / current / '404.html', staged / '404.html')
        (staged / '.nojekyll').touch()
        size = sum(p.stat().st_size for p in staged.rglob('*') if p.is_file())
        if size > budget: raise ValueError(f'Pages output is {size:,} bytes, above {budget:,}; drop an older version before deploying')
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(staged), output)
        print(f'Assembled {len(versions)} documentation versions: {size:,} bytes')

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--next', required=True); p.add_argument('--releases', required=True)
    p.add_argument('--output', required=True); p.add_argument('--prefix', default='/docs')
    a = p.parse_args()
    assemble(a.next, a.releases, a.output, a.prefix)

if __name__ == '__main__': main()
