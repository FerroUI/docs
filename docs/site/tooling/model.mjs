// The site consumes this model, never compiler-local rustdoc IDs.
import { createHash } from 'node:crypto';

export const schemaVersion = 1;
export const slug = (value) => value.replace(/[^A-Za-z0-9_-]+/g, '-').toLowerCase();
export const anchor = (kind, name) => `${kind}-${slug(name)}`;
export const symbolKey = (crate, path, kind) => `${crate}::${path.join('::')}#${kind}`;
export const digest = (value) => createHash('sha256').update(value).digest('hex');

export function typeText(type) {
  if (!type) return '()';
  if (typeof type === 'string') return type;
  if (type.primitive) return type.primitive;
  if (type.generic) return type.generic;
  if (type.resolved_path) return type.resolved_path.path + argsText(type.resolved_path.args);
  if (type.borrowed_ref) { const r = type.borrowed_ref; return `&${r.lifetime ? r.lifetime + ' ' : ''}${r.is_mutable ? 'mut ' : ''}${typeText(r.type)}`; }
  if (type.raw_pointer) return `*${type.raw_pointer.is_mutable ? 'mut' : 'const'} ${typeText(type.raw_pointer.type)}`;
  if (type.tuple) return `(${type.tuple.map(typeText).join(', ')}${type.tuple.length === 1 ? ',' : ''})`;
  if (type.slice) return `[${typeText(type.slice)}]`;
  if (type.array) return `[${typeText(type.array.type)}; ${type.array.len}]`;
  if (type.impl_trait) return `impl ${type.impl_trait.map(boundText).join(' + ')}`;
  if (type.dyn_trait) return `dyn ${type.dyn_trait.traits.map((t) => t.trait.path + argsText(t.trait.args)).join(' + ')}`;
  if (type.qualified_path) { const q = type.qualified_path; return `<${typeText(q.self_type)}${q.trait ? ` as ${q.trait.path}` : ''}>::${q.name}${argsText(q.args)}`; }
  if (type.function_pointer) return `fn(${type.function_pointer.sig.inputs.map((i) => typeText(i[1])).join(', ')}) -> ${typeText(type.function_pointer.sig.output)}`;
  if ('infer' in type) return '_';
  if (type.pat) return typeText(type.pat.type);
  throw new Error(`Unsupported Rust type shape: ${JSON.stringify(type)}`);
}
function boundText(bound) {
  if (bound.outlives) return bound.outlives;
  if (bound.use) return `use<${bound.use.join(', ')}>`;
  const b = bound.trait_bound;
  return b ? `${b.modifier === 'maybe' ? '?' : ''}${b.trait.path}${argsText(b.trait.args)}` : '';
}
function argsText(args) {
  if (!args) return '';
  if (args.parenthesized) return `(${args.parenthesized.inputs.map(typeText).join(', ')}) -> ${typeText(args.parenthesized.output)}`;
  const a = args.angle_bracketed;
  if (!a) return '';
  const values = [...a.args.map((v) => v.type ? typeText(v.type) : v.lifetime || v.const?.expr || '_'), ...a.constraints.map((c) => `${c.name} = ${c.binding?.equality?.type ? typeText(c.binding.equality.type) : '_'}`)];
  return values.length ? `<${values.join(', ')}>` : '';
}
export function genericsText(generics) {
  const p = (generics?.params || []).filter(g=>!g.kind?.type?.is_synthetic);
  return p.length ? `<${p.map((g) => {
    if(g.kind?.const)return `const ${g.name}: ${typeText(g.kind.const.type)}${g.kind.const.default?' = '+g.kind.const.default:''}`;
    const bounds=g.kind?.type?.bounds||g.kind?.lifetime?.outlives||[];
    return g.name+(bounds.length?': '+bounds.map(b=>typeof b==='string'?b:boundText(b)).join(' + '):'')+(g.kind?.type?.default?' = '+typeText(g.kind.type.default):'');
  }).join(', ')}>` : '';
}
function whereText(generics) {
  const predicates=generics?.where_predicates||[];
  const values=predicates.map(p=>{
    if(p.bound_predicate)return typeText(p.bound_predicate.type)+': '+p.bound_predicate.bounds.map(boundText).join(' + ');
    if(p.lifetime_predicate)return p.lifetime_predicate.lifetime+': '+p.lifetime_predicate.outlives.join(' + ');
    if(p.eq_predicate)return typeText(p.eq_predicate.lhs)+' = '+typeText(p.eq_predicate.rhs?.type||p.eq_predicate.rhs);
    throw new Error('Unsupported generic predicate: '+JSON.stringify(p));
  });
  return values.length?'\nwhere '+values.join(',\n      '):'';
}
export function signature(item,index={}) {
  const [kind, data] = Object.entries(item.inner)[0];
  const n = item.name || '';
  if (kind === 'function') {
    const s = data.sig;
    return `${data.header?.is_const ? 'const ' : ''}${data.header?.is_async ? 'async ' : ''}${data.header?.is_unsafe ? 'unsafe ' : ''}fn ${n}${genericsText(data.generics)}(${s.inputs.map(([name, t]) => `${name}: ${typeText(t)}`).join(', ')}${s.is_c_variadic ? ', ...' : ''})${s.output ? ' -> ' + typeText(s.output) : ''}${whereText(data.generics)}`;
  }
  if (kind === 'struct_field') return `${n}: ${typeText(data)}`;
  if (kind === 'type_alias') return `type ${n}${genericsText(data.generics)} = ${typeText(data.type)}${whereText(data.generics)}`;
  if (kind === 'constant' || kind === 'static') return `${kind === 'constant' ? 'const' : 'static'} ${n}: ${typeText(data.type)}${data.const?.expr?' = '+data.const.expr:''}`;
  if (kind === 'assoc_type') return `type ${n}${genericsText(data.generics)}${data.bounds?.length?': '+data.bounds.map(boundText).join(' + '):''}${data.type ? ' = ' + typeText(data.type) : ''}${whereText(data.generics)}`;
  if (kind === 'assoc_const') return `const ${n}: ${typeText(data.type)}`;
  if (kind === 'macro') return `macro_rules! ${n}`;
  if (kind === 'proc_macro') return `${data.kind} macro ${n}!`;
  if (kind === 'use') return `pub use ${data.source}${data.name ? ' as ' + data.name : ''}${data.is_glob ? '::*' : ''};`;
  if(kind==='variant') {
    if(data.kind?.tuple)return `${n}(${data.kind.tuple.map(id=>index[id]?.inner?.struct_field?typeText(index[id].inner.struct_field):'_').join(', ')})`;
    if(data.kind?.struct)return `${n} { ${data.kind.struct.fields.map(id=>index[id]?.name+': '+typeText(index[id]?.inner?.struct_field)).join(', ')} }`;
    return n+(data.discriminant?' = '+data.discriminant.expr:'');
  }
  return `${kind.replaceAll('_', ' ')} ${n}${genericsText(data?.generics)}${kind==='trait'&&data.bounds?.length?': '+data.bounds.map(boundText).join(' + '):''}${whereText(data?.generics)}`;
}

export function normalizeRustdoc(doc, packageName, platform = 'host') {
  if (!Number.isInteger(doc.format_version) || !doc.index || !doc.paths || doc.root == null) throw new Error('Invalid rustdoc JSON document');
  // Schema changes must be reviewed alongside the pinned extraction toolchain.
  if (doc.format_version !== 61) throw new Error(`Unreviewed rustdoc schema ${doc.format_version}; expected 61 (Rust 1.99)`);
  const pages = [], symbols = [], owners = new Map(), paths = new Map(), aliases = new Map(), globs = new Map(), expanding = new Set();
  const visit = (id, path) => {
    const item = doc.index[id]; if (!item || item.crate_id !== doc.index[doc.root].crate_id) return;
    if ((item.attrs || []).some((a) => typeof a === 'string' ? /doc\s*\(\s*hidden/.test(a) : a.other && /doc\s*\(\s*hidden/.test(a.other))) return;
    const [kind, data] = Object.entries(item.inner)[0];
    if (kind === 'use') {
      if (data.id != null && doc.index[data.id]?.crate_id === doc.index[doc.root].crate_id) {
        if (data.is_glob) {
          if (expanding.has(id)) return;
          expanding.add(id);
          const children = doc.index[data.id]?.inner?.module?.items || [];
          globs.set(id, children);
          for (const child of children) {
            const c = doc.index[child], name = c?.name || c?.inner?.use?.name;
            if (name && (c.visibility === 'public' || c.inner?.use)) visit(child, [...path.slice(0, -1), name]);
          }
          expanding.delete(id);
        } else {
          visit(data.id, [...path.slice(0, -1), data.name]); aliases.set(id, data.id);
        }
      } else paths.set(id, path);
      return;
    }
    if (paths.has(id)) return;
    paths.set(id, path);
    if (kind === 'module') for (const child of data.items) { const c = doc.index[child]; const name = c?.name || c?.inner?.use?.name; if (name && (c.visibility === 'public' || c.inner?.use)) visit(child, [...path, name]); }
  };
  visit(doc.root, []);
  const routeGroups = new Map();
  for (const [id, path] of paths) {
    const item = doc.index[id]; const kind = Object.keys(item.inner)[0];
    const segments = path.map(slug);
    if (segments.length && kind !== 'module') segments[segments.length - 1] = `${kind}-${segments.at(-1)}`;
    const url = `api/${packageName}/${segments.length ? segments.join('/') + '/' : ''}`;
    const owner = { url, path, item };
    owners.set(id, owner);
    const identities = routeGroups.get(url) || new Map();
    const identity = symbolKey(packageName, path, kind);
    const matches = identities.get(identity) || [];
    matches.push(owner);
    identities.set(identity, matches);
    routeGroups.set(url, identities);
  }
  // Case-sensitive Rust names can map to the same lower-case route, for
  // example the Locale type and locale macro re-exported from ICU.
  for (const [url, identities] of routeGroups) {
    if (identities.size < 2) continue;
    for (const identity of [...identities.keys()].sort().slice(1)) {
      for (const owner of identities.get(identity)) owner.url = `${url.slice(0, -1)}-${digest(identity).slice(0, 12)}/`;
    }
  }
  const childOwners = (id, seen = new Set()) => {
    if (seen.has(id)) return [];
    seen.add(id);
    if (globs.has(id)) return globs.get(id).flatMap(child => childOwners(child, seen));
    const owner = owners.get(id) || owners.get(aliases.get(id));
    return owner ? [owner] : [];
  };
  const emitted = new Set();
  for (const owner of owners.values()) {
    const { item, path, url } = owner; const [kind, data] = Object.entries(item.inner)[0];
    const identity = symbolKey(packageName, path, kind);
    if (emitted.has(identity)) continue;
    emitted.add(identity);
    const memberIds = new Set();
    for (const mid of data?.items || []) if (kind !== 'module') memberIds.add(mid);
    for (const mid of data?.variants || []) memberIds.add(mid);
    for (const mid of data?.kind?.plain?.fields || []) memberIds.add(mid);
    for (const mid of data?.kind?.tuple || []) if (mid != null) memberIds.add(mid);
    const impls = [];
    for (const iid of data?.impls || data?.implementations || []) {
      const impl = doc.index[iid]?.inner?.impl;
      if (!impl) continue;
      if (impl.trait) impls.push(typeText({ resolved_path: impl.trait }));
      // Trait contracts have their own pages. Repeating blanket-implementation
      // prose on every type inflates the site and obscures the type's own API.
      if (!impl.trait) for (const mid of impl.items) memberIds.add(mid);
    }
    const members = [...memberIds].map((mid) => doc.index[mid]).filter((m) => m?.name && (m.visibility === 'public' || ['variant', 'assoc_type', 'assoc_const'].includes(Object.keys(m.inner)[0]) || kind === 'trait')).filter((m) => !(m.attrs || []).some((a) => /doc\s*\(\s*hidden/.test(typeof a === 'string' ? a : a.other || ''))).map((m) => {
      const k = Object.keys(m.inner)[0];
      return { id: symbolKey(packageName, [...path, m.name], k), name: m.name, kind: k, signature: signature(m,doc.index), docs: m.docs || '', url: url + '#' + anchor(k, m.name), source: m.span, deprecated: m.deprecation || null };
    });
    const page = { id: symbolKey(packageName, path, kind), name: item.name || data?.name || packageName, path, kind, crate: packageName, signature: signature(item), docs: item.docs || '', url, source: item.span, deprecated: item.deprecation || null, members, impls: [...new Set(impls)], links: Object.fromEntries(Object.entries(item.links || {}).map(([name, id]) => [name, owners.get(id)?.url]).filter(([,url])=>url)), platform, schema: doc.format_version, children: kind === 'module' ? [...new Map(data.items.flatMap(i=>childOwners(i)).map(o=>[o.url,o])).values()].map((o) => ({ name: o.item.name || o.item.inner?.use?.name, url: o.url, kind: Object.keys(o.item.inner)[0] })) : [] };
    pages.push(page); symbols.push({ ...page, members: undefined, children: undefined, links: undefined, impls: undefined }, ...members.map((m) => ({ ...m, crate: packageName, platform })));
  }
  return { schemaVersion, pages, symbols };
}
