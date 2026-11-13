import { topicsFor } from '../src/data/navigation.ts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { site, base, content, version } from './paths.mjs';
import { files, write } from './io.mjs';

const dist = path.join(site, 'dist');
const examples = JSON.parse(await fs.readFile(path.join(content, 'examples.json'), 'utf8'));
const controls=JSON.parse(await fs.readFile(path.join(site,'public/generated/controls.json'),'utf8'));
const desktopSource=await fs.readFile(path.join(site,'tooling/example-main.rs'),'utf8');
const report = JSON.parse(await fs.readFile(path.join(site, '.cache/build.json'), 'utf8'));
const entries = [], routes = [];
const sources = [path.join(site, 'src/content/docs'), path.join(site, '.cache/api-markdown')];
for (const source of sources) for (const file of (await files(source)).filter((f) => /\.mdx?$/.test(f)).sort()) {
  const relative = path.relative(source, file).replaceAll(path.sep, '/');
  const route = relative.replace(/(?:^|\/)index\.mdx?$/, '/').replace(/\.mdx?$/, '/').replace(/^\//, '');
  let text = await fs.readFile(file, 'utf8');
  const header = text.match(/^---\n([\s\S]*?)\n---\n/);
  const titleValue = header?.[1].match(/^title:\s*(.+)$/m)?.[1] || relative;
  let title = titleValue; try { title = JSON.parse(titleValue); } catch {}
  text = text.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^import .+;?\s*$/gm, '');
  text=text.replace(/<h3 id="([^"]+)">([^<]+)<\/h3>/g,'<a id="$1"></a>\n\n### $2');
  text = text.replace(/<LiveSample\s+id="([^"]+)"\s*\/>/g, (_, id) => {
    const example = examples.find((e) => e.id === id);
    if (!example) throw new Error('Unknown sample in Markdown export: ' + id);
    return `### ${example.title}\n\n\`\`\`xml\n${example.xaml}\n\`\`\`\n\n\`\`\`rust\n${desktopSource}\n\`\`\`\n\n[Download the complete desktop project](${base}/generated/examples/${id}.zip). The browser preview runs real FerroUI controls with precompiled Rust support; this desktop application loads the same XAML.\n`;
  });
  text = text.replace('<TopicDirectory />',topicsFor(version).map(g=>'## '+g.title+'\n\n'+g.description+'\n\n'+g.items.map(([title,slug])=>`- [${title}](${base}/${slug}/index.md)`).join('\n')).join('\n\n'));
  text = text.replace('<Landing />', `Find a task, browse the [topic directory](${base}/topics/index.md), or look up a public API.\n\n- [Install FerroUI](${base}/start/installation/)\n- [MVVM](${base}/guides/mvvm/)\n- [Controls](${base}/controls/)\n- [API reference](${base}/api/)\n`);
  text = text.replace('<ControlGallery />',controls.map(c=>`- [${c.title}](${c.url}index.md) — ${c.summary}`).join('\n'));
  const url = base + '/' + route;
  const markdownUrl = url + 'index.md';
  const body = `# ${title}\n\nVersion: ${version}\nFramework commit: ${report.frameworkCommit}\nCanonical URL: ${url}\n\n${text.trim()}\n`;
  await write(path.join(dist, route, 'index.md'), body);
  routes.push(route);
  entries.push({ id: route || 'home', title, url, markdownUrl, section: route.split('/')[0] || 'start', summary: text.replace(/[`#*<>]/g, '').split('\n').find((l) => l.length > 50)?.slice(0, 240) || title });
}
const symbols = JSON.parse(await fs.readFile(path.join(site, 'public/generated/symbols.json'), 'utf8'));
const byCrate = new Map();
for (const symbol of symbols) {
  (byCrate.get(symbol.crate) || (byCrate.set(symbol.crate, []), byCrate.get(symbol.crate))).push({ ...symbol, url: base + '/' + symbol.url });
}
const shards = [];
for (const [crate, items] of byCrate) {
  await write(path.join(dist, 'agents/symbols', crate + '.json'), JSON.stringify({ schemaVersion: 1, version, frameworkCommit: report.frameworkCommit, symbols: items }));
  shards.push({ crate, count: items.length, url: `${base}/agents/symbols/${crate}.json` });
}
await write(path.join(dist, 'agents/symbols.json'), JSON.stringify({ schemaVersion: 1, version, frameworkCommit: report.frameworkCommit, shards }, null, 2));
await write(path.join(dist, 'agents/content.json'), JSON.stringify({ schemaVersion: 1, version, frameworkCommit: report.frameworkCommit, pages: entries }));
await write(path.join(dist, 'agents/routes.json'), JSON.stringify(routes));
await write(path.join(dist, 'agents/provenance.json'), JSON.stringify(report, null, 2));
const guideEntries = entries.filter((e) => !['api', 'controls'].includes(e.section));
const llms = `# FerroUI documentation (${version})\n\nFerroUI is a cross-platform UI framework for Rust. It provides XAML, MVVM, controls, themes, and declarative Rust components.\n\nThis snapshot documents framework commit ${report.frameworkCommit}. ${version === 'next' ? 'It describes unreleased development; do not assume APIs are already published.' : 'All examples and APIs belong to this release.'}\n\n## Start\n\n- [Installation](${base}/start/installation/index.md)\n- [MVVM](${base}/guides/mvvm/index.md)\n- [Controls](${base}/controls/index.md)\n- [API reference](${base}/api/index.md)\n\n## Structured indexes\n\n- [Content index](${base}/agents/content.json): titles, summaries, canonical URLs, Markdown URLs\n- [Symbol index](${base}/agents/symbols.json): per-crate symbol shards with signatures and links\n- [Build provenance](${base}/agents/provenance.json)\n\n## Guides\n\n${guideEntries.map((e) => `- [${e.title}](${e.markdownUrl})`).join('\n')}\n\nEvery article has an index.md representation. Interactive samples include their XAML and Rust source in that representation. Fetch only the sections and crate shards relevant to the task.\n`;
await write(path.join(dist, 'llms.txt'), llms);
for (const section of new Set(guideEntries.map((e) => e.section))) {
  const texts = await Promise.all(guideEntries.filter((e) => e.section === section).map((e) => fs.readFile(path.join(dist, e.id === 'home' ? '' : e.id, 'index.md'), 'utf8')));
  await write(path.join(dist, 'agents/bundles', section + '.md'), texts.join('\n\n---\n\n'));
}
console.log(`Exported ${entries.length} Markdown pages and ${shards.length} agent symbol shards.`);
