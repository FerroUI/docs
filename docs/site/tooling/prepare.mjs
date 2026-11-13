import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { site, root, version, base, content } from './paths.mjs';
import { normalizeRustdoc, digest } from './model.mjs';
import { publicSurface } from './surface.mjs';
import { exclusion } from './surface.mjs';
import { gzipSync } from 'node:zlib';
import { controlIdentity } from './controls.mjs';

export async function files(directory) {
  const result = [];
  try { for (const entry of await fs.readdir(directory, { withFileTypes: true })) { const p = path.join(directory, entry.name); if (entry.isDirectory()) result.push(...await files(p)); else result.push(p); } }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return result;
}
export async function write(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, value); }
const docs = path.join(site, 'src/content/docs');
await fs.rm(docs, { recursive: true, force: true }); await fs.mkdir(docs, { recursive: true });
await fs.rm(path.join(site, '.cache/api-markdown'), { recursive: true, force: true });
const framework = process.env.DOCS_FRAMEWORK_ROOT || path.join(root, '.framework', version);
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: framework, encoding: 'utf8' }).trim();
const pins = JSON.parse(await fs.readFile(path.join(root, 'framework.json'), 'utf8'));
if (commit !== (version === 'next' ? pins.next : pins.releases[version]) || (process.env.DOCS_FRAMEWORK_COMMIT && commit !== process.env.DOCS_FRAMEWORK_COMMIT)) throw new Error('Framework checkout does not match the selected pin');
const docRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const packageVersion = version === 'next' ? (await fs.readFile(path.join(framework,'Cargo.toml'),'utf8')).match(/\[workspace.package\][\s\S]*?^version\s*=\s*"([^"]+)"/m)[1] : version;
const sourceUrl = (span) => span ? `https://github.com/wieslawsoltes/FerroUI/blob/${commit}/${span.filename.replaceAll('\\','/')}#L${span.begin[0]}` : null;
const frontmatter = (title, description = '') => `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description.slice(0, 250))}\neditUrl: false\n---\n\n`;
const markdown = (text) => (text || '').replace(/^\s*# (?!\!)(.*)$/gm, '## $1').replace(/```rust[^\n]*\n([\s\S]*?)```/g, (_, code) => '```rust\n' + code.split('\n').filter((l) => !/^\s*#(?:\s|$)/.test(l)).join('\n') + '```').replace(/\[(`?[^\]\n]+`?)\]\((?:crate|Self|super)::[^)]+\)/g, '$1').replace(/\[(`[^`]+`)\](?!\()/g, '$1');
for (const file of await files(content)) {
  if (!/\.mdx?$/.test(file)) continue;
  const relative = path.relative(content, file);
  let text = await fs.readFile(file, 'utf8');
  const imported = text.match(/<!-- source: ([^>]+) -->/);
  if (imported) {
    const sourcePath = imported[1].trim();
    const sourceRoot = framework;
    const source = await fs.readFile(path.join(sourceRoot, sourcePath), 'utf8').catch((error)=>{if(error.code!=='ENOENT')throw error;return '# Unavailable\n\nThis feature is not available in this framework snapshot. Choose next to read its development documentation.'});
    const resolveLink = (href) => {
      if (/^(https?:|mailto:|#)/.test(href)) return href;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), href));
      return `https://github.com/wieslawsoltes/FerroUI/blob/${commit}/${resolved}`;
    };
    let importedText = source.replace(/^# [^\n]+\n/, '').replace(/(!?\[[^\]]*\])\(([^\s)]+)\)/g, (_,label,href) => `${label}(${resolveLink(href)})`);
    // Historical prose sometimes states its development version as the current one.
    importedText = importedText.replace(/=0\.\d+\.\d+(?:-preview\.\d+)?/g, '='+packageVersion);
    const sourceNote = `:::note[Source and availability]\nPrepared from [${sourcePath}](https://github.com/wieslawsoltes/FerroUI/blob/${commit}/${sourcePath}) at this build's framework revision. This is ${version === 'next' ? 'unreleased development documentation' : 'documentation for version ' + version}. Design and porting notes describe their recorded verification limits.\n:::\n\n`;
    text = text.slice(0, text.indexOf('---', 3) + 3) + '\n\n' + sourceNote + importedText;
  }
  text = text.replaceAll('{{VERSION}}', version).replaceAll('{{COMMIT}}', commit).replaceAll('{{PACKAGE_VERSION}}', packageVersion).replaceAll('{{BASE}}', base);
  const editUrl = version === 'next' && process.env.DOCS_REPOSITORY && !imported
    ? `https://github.com/${process.env.DOCS_REPOSITORY}/edit/main/docs/content/next/${relative.replaceAll(path.sep,'/')}`
    : false;
  text=text.replace(/^---\n/, '---\neditUrl: '+JSON.stringify(editUrl)+'\n');
  if(version!=='next') text=text.replace(/:::note\[You are reading next\][\s\S]*?:::/, `:::note[Official release snapshot]\nThis documentation describes FerroUI ${version} at framework commit ${commit}. All framework dependencies must use this same version.\n:::`);
  text=text.replace(/```rust,[^\n]*\n/g,'```rust\n').replace(', the version the workspace carries','');
  await write(path.join(docs, relative), text);
}
const examples = JSON.parse(await fs.readFile(path.join(content, 'examples.json'), 'utf8'));
for (const example of examples) {
  if (!example.id || !example.xaml || !example.title) throw new Error('Incomplete example');
  await write(path.join(site, 'public/generated/examples', `${example.id}.xaml`), example.xaml + '\n');
  if (example.rust) await write(path.join(site, 'public/generated/examples', `${example.id}.rs`), example.rust + '\n');
}
await write(path.join(site, 'public/generated/examples.json'), JSON.stringify(examples));
try {
  const wasm=await fs.readFile(path.join(site,'public/runner/ferroui_docs_browser.wasm'));
  const bytes=gzipSync(wasm,{level:9}).length;
  if(bytes>17_000_000)throw new Error('The documentation runtime exceeds its 17 MB gzip budget');
  await write(path.join(site,'public/generated/runtime.json'),JSON.stringify({rawBytes:wasm.length,gzipBytes:bytes,sha256:digest(wasm)}));
} catch(error) { if(error.code!=='ENOENT')throw error; }
const apiDirectory = process.env.DOCS_API_DIR || path.join(site, '.cache/api');
const apiFiles = (await files(apiDirectory)).filter((p) => p.endsWith('.json') && path.basename(p) !== 'manifest.json');
const pages = new Map(), symbols = new Map(), packages = new Map(), targets = new Set();
const excluded = [];
const configurations = new Map();
for (const file of apiFiles) {
  const manifestFile = path.join(path.dirname(file), 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
  const configuration={target:manifest.target,features:manifest.features,applicationFeatures:manifest.applicationFeatures||[],rustc:manifest.rustc};
  configurations.set(JSON.stringify(configuration),configuration);
  if (manifest.frameworkCommit !== commit) throw new Error(`API provenance differs from framework commit: ${manifestFile}`);
  const name = path.basename(file, '.json'); const pkg = manifest.packages.find((p) => p.name === name);
  if (!pkg) throw new Error(`Undeclared API package ${name}`);
  const model = publicSurface(normalizeRustdoc(JSON.parse(await fs.readFile(file, 'utf8')), name, manifest.target));
  excluded.push(...model.rejected);
  if(model.pages.length)packages.set(name, pkg);
  targets.add(manifest.target);
  for (const p of model.pages) {
    if (pages.has(p.id)) {
      const previous = pages.get(p.id); previous.platforms.push(manifest.target);
      const byId = new Map(previous.members.map((m) => [m.id, m]));
      for (const member of p.members) {
        const existing=byId.get(member.id);
        if(existing)existing.platforms=[...new Set([...existing.platforms,manifest.target])];
        else previous.members.push({...member,platforms:[manifest.target]});
      }
      const children=new Set(previous.children.map(c=>c.url));
      for(const child of p.children)if(!children.has(child.url))previous.children.push(child);
      previous.impls=[...new Set([...previous.impls,...p.impls])];
      previous.platforms=[...new Set(previous.platforms)];
    } else pages.set(p.id, { ...p, members:p.members.map(m=>({...m,platforms:[manifest.target]})), platforms: [manifest.target] });
  }
  for (const {platform,...s} of model.symbols) {
    if(symbols.has(s.id)){const previous=symbols.get(s.id);previous.platforms=[...new Set([...previous.platforms,manifest.target])];}
    else symbols.set(s.id,{...s,platforms:[manifest.target]});
  }
}
const apiNames = new Map();
for (const p of pages.values()) if (!apiNames.has(p.name)) apiNames.set(p.name, p);
const missing = [];
const usedUrls = new Set();
for (const p of pages.values()) {
  if (usedUrls.has(p.url)) throw new Error(`API URL collision: ${p.url}`);
  usedUrls.add(p.url);
  if (!p.docs) missing.push(p.id);
  let body = frontmatter(p.name, p.docs.split('\n')[0]);
  body += `**${p.kind.replaceAll('_', ' ')}** · [\`${p.crate}\`](${base}/api/${p.crate}/) · ${version === 'next' ? 'Unreleased' : 'v' + version}\n\n`;
  let prose = p.docs;
  for (const [name,url] of Object.entries(p.links)) prose = prose.replaceAll(`[\`${name}\`]`, `[\`${name}\`](${base}/${url})`).replaceAll(`[${name}]`, `[${name}](${base}/${url})`);
  body += `\`\`\`rust\n${p.signature}\n\`\`\`\n\n${markdown(prose)}\n\n`;
  if (sourceUrl(p.source)) body += `[View source](${sourceUrl(p.source)})\n\n`;
  if (p.deprecated) body += `> **Deprecated${p.deprecated.since ? ' since ' + p.deprecated.since : ''}.** ${p.deprecated.note || 'Use the supported replacement described in the API documentation.'}\n\n`;
  if (p.children.length) body += '## Contents\n\n' + p.children.map((c) => `- [\`${c.name}\`](${base}/${c.url}) — ${c.kind.replaceAll('_', ' ')}`).join('\n') + '\n\n';
  if (p.members.length) body += '## Members\n\n' + p.members.map((m) => `- [\`${m.name}\`](#${m.url.split('#')[1]})`).join('\n') + '\n\n';
  for (const m of p.members) {
    if (!m.docs) missing.push(m.id);
    body += `<h3 id="${m.url.split('#')[1]}">${m.name}</h3>\n\n\`\`\`rust\n${m.signature}\n\`\`\`\n\n${markdown(m.docs)}\n\n`;
    if(m.platforms.length!==p.platforms.length)body+=`Available on: ${m.platforms.map(target=>'\`'+target+'\`').join(', ')}.\n\n`;
    if(m.deprecated)body+=`> **Deprecated${m.deprecated.since?' since '+m.deprecated.since:''}.** ${m.deprecated.note||'See the supported replacement.'}\n\n`;
    if (sourceUrl(m.source)) body += `[Source](${sourceUrl(m.source)})\n\n`;
  }
    if (p.impls.length) body += '## Trait implementations\n\n' + p.impls.map((t) => { const trait = apiNames.get(t.split('<')[0].split('::').pop()); return trait ? `- [\`${t}\`](${base}/${trait.url})` : `- \`${t}\``; }).join('\n') + '\n\n';
  body += `## Availability\n\nExtracted for ${p.platforms.map((p) => '\`' + p + '\`').join(', ')}. Cargo features are listed in the [crate index](${base}/api/).\n`;
  // .md is deliberately used: Rustdoc prose is Markdown, never executable MDX.
  await write(path.join(site, '.cache/api-markdown', p.url, 'index.md'), body);
}
const groups = {};
for (const p of packages.values()) {
  const manifest = await fs.readFile(path.join(framework, p.manifest), 'utf8').catch(() => '');
  const group = manifest.match(/\[package.metadata.release\]\s*group\s*=\s*"([^"]+)"/)?.[1] || 'libraries';
  (groups[group] ||= []).push(p);
}
let api = frontmatter('API reference', 'The application-facing public Rust API, grouped by crate, with XAML relationships and source links.');
api += `Browse ${packages.size} crates and ${symbols.size.toLocaleString()} public symbols for **${version}**.\n\n`;
if (!packages.size) api += ':::caution[API extraction required]\nRun the documentation API extraction command before publishing this build. No API coverage is claimed for this preview.\n:::\n';
for (const [group, list] of Object.entries(groups).sort()) {
  api += `\n## ${group[0].toUpperCase() + group.slice(1)}\n\n`;
  for (const p of list.sort((a,b)=>a.name.localeCompare(b.name))) api += `### [${p.name}](${base}/api/${p.name}/)\n\n${p.description || ''}\n\nVersion: \`${p.version}\`. Features: ${Object.keys(p.features).map((f) => '\`' + f + '\`').join(', ') || 'none'}.\n\n`;
}
await write(path.join(docs, 'api/index.md'), api);

let markup = { types: [] };
try { markup = JSON.parse(await fs.readFile(path.join(site, '.cache/markup.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const byName = new Map(markup.types.map((t) => [t.namespace + '.' + t.name, t]));
function isControl(t, seen = new Set()) {
  if (!t || seen.has(t.rustPath)) return false;
  if (t.name === 'Control') return true;
  seen.add(t.rustPath); return isControl(byName.get(t.base), seen);
}
let curations = {};
try { curations = JSON.parse(await fs.readFile(path.join(content, 'controls.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const controls = markup.types.filter((t) => isControl(t) && !t.isTrait && !exclusion({crate:t.rustPath.split('::')[0].replaceAll('_','-'),name:t.name,path:t.rustPath.split('::').slice(1),kind:'struct'})).sort((a,b)=>a.name.localeCompare(b.name));
const {apiFor,routeFor,titleFor}=controlIdentity(controls,[...pages.values()]);
let controlIndex = frontmatter('Explore the controls', 'Choose a control, understand its behavior, and try its XAML in your browser.');
controlIndex += 'Find a control by the task it solves. Each reference connects its Rust API, XAML surface, inherited properties, and source.\n\n';
for (const category of ['Input', 'Text', 'Layout', 'Collections', 'Navigation', 'Feedback', 'Advanced']) {
  const selected = controls.filter((t) => (curations[t.name]?.category || 'Advanced') === category);
  if (!selected.length) continue;
  controlIndex += `## ${category}\n\n`;
  for (const t of selected) controlIndex += `- [**${titleFor(t)}**](${base}/controls/reference/${routeFor(t)}/) — ${curations[t.name]?.summary || apiFor(t)?.docs?.split('\n')[0] || 'Framework control; see its reference and base type.'}\n`;
  controlIndex += '\n';
}
await write(path.join(site,'public/generated/controls.json'),JSON.stringify(controls.map(t=>({name:t.name,title:titleFor(t),namespace:t.namespace,category:curations[t.name]?.category||'Advanced',summary:curations[t.name]?.summary||apiFor(t)?.docs?.split('\n')[0]||'Public control contract.',url:`${base}/controls/reference/${routeFor(t)}/`,live:examples.some(e=>e.control===t.name)}))));
await write(path.join(docs, 'controls/index.mdx'), frontmatter('Explore the controls','Find the right control for your task. Browse public controls, filter by category, and try live XAML examples.')+"import ControlGallery from '@components/ControlGallery.astro';\n\nChoose by the task you need to solve, then explore the control’s API, markup, and examples.\n\n<ControlGallery />\n");
for (const t of controls) {
  const c = curations[t.name] || {}; const p = apiFor(t); const example = examples.find((e) => e.control === t.name);
  const summary = c.summary || p?.docs?.split('\n')[0] || `The ${t.name} framework control.`;
  let text = frontmatter(titleFor(t), summary) + summary + '\n\n';
  if (c.when) text += `## When to use it\n\n${c.when}\n\n`;
  if (p?.docs && p.docs !== summary) text += `## Behavior\n\n${markdown(p.docs)}\n\n`;
  if (example) {
    text += `import LiveSample from '@components/LiveSample.astro';\n\n## Try it\n\n<LiveSample id="${example.id}" />\n\n`;
  }
  if (c.notes) text += `## Usage guidance\n\n${c.notes}\n\n`;
  text += `## XAML and inheritance\n\nRust path: \`${t.rustPath}\`. XAML namespace: \`${t.namespace}\`.\n\n`;
  if (t.base) { const b = t.base.split('.').pop(); const control = controls.find((c)=>`${c.namespace}.${c.name}`===t.base); const api = apiFor(byName.get(t.base)); const link = control ? `${base}/controls/reference/${routeFor(control)}/` : api ? `${base}/${api.url}` : null; text += `Base type: ${link ? `[\`${b}\`](${link})` : '\`' + b + '\`'}. Its layout, input, and styling behavior also applies.\n\n`; }
  if (t.contentProperty) text += `The content property is \`${t.contentProperty}\`; unnamed child content is assigned there.\n\n`;
  if (t.properties.length) {
    text += '## Registered properties\n\n| Property | Rust value type | Declared by | Behavior | Default binding |\n|---|---|---|---|---|\n';
    for (const prop of t.properties) text += `| \`${prop.name}\` | \`${prop.type.replaceAll('|','\\|')}\` | ${prop.owner} | ${[prop.readOnly && 'Read-only', prop.attached && 'Attached', prop.direct ? 'Direct' : 'Styled', prop.inherits && 'Inherited value'].filter(Boolean).join(', ')} | ${prop.bindingMode||'Property-specific'} |\n`;
  }
  if (t.plainProperties.length) text += '\n## Additional XAML properties\n\n' + t.plainProperties.map((p) => `- \`${p.name}\`${p.readOnly ? ' — read-only collection or value' : ''}`).join('\n') + '\n';
  if (t.events.length) text += '\n## Events\n\n' + t.events.map((e) => `- \`${e}\``).join('\n') + '\n';
  if (c.accessibility) text += `\n## Keyboard and accessibility\n\n${c.accessibility}\n`;
  if (c.pitfalls) text += `\n## Common mistakes\n\n${c.pitfalls}\n`;
  text += `\n## Related guidance\n\n- [Choose the right control](${base}/guides/choosing-controls/)\n- [Layout](${base}/design/layout/)\n- [Styles and themes](${base}/design/themes/)\n`;
  if (p) text += `- [Full Rust API](${base}/${p.url})\n`;
  if (!example) text += '\nThis reference describes the framework API. For platform-dependent controls, exercise the matching native sample before relying on browser behavior.\n';
  await write(path.join(docs, `controls/reference/${routeFor(t)}/index.${example ? 'mdx' : 'md'}`), text);
}
await write(path.join(docs, 'controls/reference/index.md'), frontmatter('Control reference') + 'Browse control types using the [control gallery](' + base + '/controls/). Properties are extracted from the real registered metadata, including inherited members.\n');

const report = { schemaVersion: 1, version, frameworkCommit: commit, documentationCommit: docRevision, packages: packages.size, symbols: symbols.size, pages: pages.size, controls: controls.length, examples: examples.length, targets: [...targets], configurations:[...configurations.values()], missingDocumentation: [...new Set(missing)].sort(), apiDigest: digest(JSON.stringify([...symbols.values()].map(s=>({id:s.id,signature:s.signature,docs:s.docs,platforms:s.platforms})).sort((a,b)=>a.id.localeCompare(b.id)))) };
report.contentDigest=digest((await Promise.all((await files(content)).sort().map(async file=>path.relative(content,file)+':'+digest(await fs.readFile(file))))).join('\n'));
report.documentationDirty=Boolean(execFileSync('git',['status','--porcelain','--','docs/site','docs/content','samples/Docs.Browser'],{cwd:root,encoding:'utf8'}).trim());
await write(path.join(site, '.cache/api-pages.json'), JSON.stringify([...pages.values()].map(({ id,name,kind,crate,url,members,source,docs })=>({ id,name,kind,crate,url,summary:docs.split('\n')[0],source,members:members.map(({name,url})=>({name,url})) }))));
await write(path.join(site, 'public/generated/coverage.json'), JSON.stringify(report, null, 2));
await write(path.join(site, 'public/generated/symbols.json'), JSON.stringify([...symbols.values()].map(({ docs, ...s }) => ({ ...s, summary: docs?.split('\n')[0] || '' }))));
await write(path.join(site, '.cache/build.json'), JSON.stringify(report, null, 2));
await write(path.join(site, '.cache/excluded-api.json'), JSON.stringify(excluded,null,2));
if (process.env.DOCS_STRICT === '1' && (!pages.size || !controls.length)) throw new Error('Publication requires compiler API and registered control metadata');
console.log(`Prepared ${pages.size} API pages, ${symbols.size} symbols, ${controls.length} controls, ${examples.length} live examples; ${missing.length} documentation gaps reported.`);
