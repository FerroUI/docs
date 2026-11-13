import fs from 'node:fs';
const policy=JSON.parse(fs.readFileSync(new URL('../api-surface.json',import.meta.url),'utf8'));
const internal=new Set(policy.internalModules);
const implementation=policy.implementationTypePatterns.map(p=>new RegExp(p));
const platform=new Set(policy.platformCrates);
const allowedNames=new Set(policy.platformApiNames);
const allowedPatterns=policy.platformApiNamePatterns.map(p=>new RegExp(p));
const within=(path,prefix)=>path===prefix||path.startsWith(prefix+'::');
const scopeFor=page=>policy.restrictedScopes.filter(s=>s.crate===page.crate&&within(page.path.join('::'),s.path)).sort((a,b)=>b.path.length-a.path.length)[0];

export function exclusion(page) {
  if(policy.excludedCrates[page.crate])return policy.excludedCrates[page.crate];
  if(page.path.some(segment=>internal.has(segment)))return 'Framework implementation module';
  if((policy.excludedPaths[page.crate]||[]).some(prefix=>within(page.path.join('::'),prefix)))return 'Framework implementation namespace';
  const scope=scopeFor(page);
  if(scope&&page.kind!=='module'){
    const relative=page.path.join('::').slice(scope.path.length+2);
    if(!scope.subtrees.some(prefix=>within(relative,prefix))&&!scope.names.includes(page.name)&&!scope.patterns.some(pattern=>new RegExp(pattern).test(page.name)))return 'Infrastructure namespace; only reviewed application contracts are documented';
  }
  if(page.name.startsWith('__'))return 'Generated implementation helper';
  if(page.name.includes('VTable')||(page.kind==='function'&&page.signature?.includes('VTable')))return 'Virtual dispatch implementation machinery';
  if(/^I[A-Z].*Impl(?:Ext)?$/.test(page.name))return 'Backend implementation contract';
  if(page.kind!=='trait'&&implementation.some(pattern=>pattern.test(page.name)))return 'Framework implementation type';
  if(page.crate==='ferroui-markup-xaml-loader'&&page.path.length&&!policy.runtimeLoaderApiNames.includes(page.name))return 'Compiler/loader implementation';
  if(platform.has(page.crate)&&page.path.length&&!allowedNames.has(page.name)&&!allowedPatterns.some(p=>p.test(page.name)))return 'Backend implementation; only application configuration and hosting contracts are documented';
  return null;
}
export function publicSurface(model) {
  const rejected=[];
  const rejectedNames=new Set();
  let pages=model.pages.filter(page=>{const reason=exclusion(page);if(reason){rejected.push({id:page.id,reason});if(['struct','enum','trait','type_alias'].includes(page.kind))rejectedNames.add(page.name)}return !reason});
  for(const page of pages)rejectedNames.delete(page.name);
  // A module is useful only when it contains an application-facing contract.
  const contracts=pages.filter(p=>p.kind!=='module');
  pages=pages.filter(p=>p.kind!=='module'||contracts.some(c=>c.url.startsWith(p.url)));
  const urls=new Set(pages.map(p=>p.url));
  for(const page of pages){
    const scope=scopeFor(page);
    if(scope&&page.kind==='module'&&page.path.join('::')===scope.path)page.docs=scope.description;
    page.children=page.children.filter(c=>urls.has(c.url));
    page.members=page.members.filter(m=>!m.name.startsWith('__')&&!m.signature.includes('VTable')&&!(m.signature.match(/\b[A-Z][A-Za-z0-9_]+\b/g)||[]).some(name=>rejectedNames.has(name)));
    page.links=Object.fromEntries(Object.entries(page.links).filter(([,url])=>urls.has(url)));
    page.impls=page.impls.filter(name=>!name.endsWith('VTable'));
  }
  const ids=new Set(pages.flatMap(p=>[p.id,...p.members.map(m=>m.id)]));
  const docsById=new Map(pages.map(p=>[p.id,p.docs]));
  return {pages,symbols:model.symbols.filter(s=>ids.has(s.id)).map(s=>docsById.has(s.id)?{...s,docs:docsById.get(s.id)}:s),rejected};
}
