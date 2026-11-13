import { topicsFor } from '../src/data/navigation.ts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { site, base, version } from './paths.mjs';
import { files } from './io.mjs';
import { XMLValidator } from 'fast-xml-parser';

const dist=path.join(site,'dist');
const errors=[];
const exists=async(p)=>{try{return (await fs.stat(p)).isFile()}catch{return false}};
const report=JSON.parse(await fs.readFile(path.join(dist,'agents/provenance.json'),'utf8'));
const content=JSON.parse(await fs.readFile(path.join(dist,'agents/content.json'),'utf8'));
const symbols=JSON.parse(await fs.readFile(path.join(dist,'agents/symbols.json'),'utf8'));
const excluded=new Set(JSON.parse(await fs.readFile(path.join(site,'.cache/excluded-api.json'),'utf8')).map(p=>p.id));
const knownRoutes=new Set(JSON.parse(await fs.readFile(path.join(dist,'agents/routes.json'),'utf8')));
const navigation=new Set(topicsFor(version).flatMap(group=>group.items.map(([,route])=>route+'/')));
for(const page of content.pages){
  if(!['api','controls'].includes(page.section)&&!['home','topics/'].includes(page.id)&&!navigation.has(page.id))errors.push(`Authored page missing from topic navigation: ${page.id}`);
  const route=page.id==='home'?'':page.id;
  if(!await exists(path.join(dist,route,'index.html')))errors.push(`Missing HTML: ${route}`);
  if(!await exists(path.join(dist,route,'index.md')))errors.push(`Missing Markdown: ${route}`);
  if(page.section==='api'){
    // Generated reference pages link only within the site or to absolute URLs.
    const html=await fs.readFile(path.join(dist,route,'index.html'),'utf8');
    for(const [,raw] of html.matchAll(/href="([^"]*)"/g))if(!/^(\/|#|https?:|mailto:)/.test(raw))errors.push(`Unresolved link in generated reference: ${route} -> ${raw}`);
    continue;
  }
  const html=await fs.readFile(path.join(dist,route,'index.html'),'utf8');
  for(const [,raw] of html.matchAll(/href="([^"]+)"/g)){
    if(!raw.startsWith(base+'/'))continue;
    const target=raw.slice(base.length+1).split(/[?#]/)[0];
    if(!target||target.startsWith('generated/')||target.startsWith('agents/')||target.startsWith('_astro/')||/\.(svg|png|css|xml|woff2?)$/.test(target)||target==='llms.txt'||target.endsWith('index.md'))continue;
    if(!knownRoutes.has(target.endsWith('/')?target:target+'/'))errors.push(`Broken authored link: ${route} -> ${raw}`);
  }
}
for(const shard of symbols.shards){
  const data=JSON.parse(await fs.readFile(path.join(dist,'agents/symbols',shard.crate+'.json'),'utf8'));
  if(data.frameworkCommit!==report.frameworkCommit)errors.push(`Mismatched symbol provenance: ${shard.crate}`);
  for(const symbol of data.symbols){
    if(excluded.has(symbol.id))errors.push(`Implementation API leaked into agent export: ${symbol.id}`);
    const route=symbol.url.slice(base.length+1).split('#')[0];
    if(!knownRoutes.has(route))errors.push(`No reference page for ${symbol.id}`);
  }
}
const examples=JSON.parse(await fs.readFile(path.join(dist,'generated/examples.json'),'utf8'));
for(const example of examples){
  if(XMLValidator.validate(example.xaml)!==true)errors.push(`Invalid example XML: ${example.id}`);
  if((await fs.readFile(path.join(dist,'generated/examples',example.id+'.xaml'),'utf8')).trim()!==example.xaml.trim())errors.push(`Example source drift: ${example.id}`);
}
const bytes=(await Promise.all((await files(dist)).map(async f=>(await fs.stat(f)).size))).reduce((a,b)=>a+b,0);
console.log(`${content.pages.length} pages, ${report.symbols} symbols, ${examples.length} examples, ${(bytes/1e6).toFixed(1)} MB output; ${report.missingDocumentation.length} source prose gaps recorded.`);
if(errors.length)throw new Error([...new Set(errors)].slice(0,50).join('\n'));
