import { slug } from './model.mjs';

// Type names are not unique across the ecosystem (both chart libraries expose Chart).
export function controlIdentity(types, pages) {
  const counts=new Map();
  for(const type of types)counts.set(type.name,(counts.get(type.name)||0)+1);
  const byQualifiedName=new Map(types.map(t=>[`${t.namespace}.${t.name}`,t]));
  const apiFor=(type)=>{
    if(!type)return null;
    const [crate,...segments]=type.rustPath.split('::');
    const candidates=pages.filter(p=>p.crate===crate.replaceAll('_','-')&&p.name===type.name&&p.kind==='struct');
    return candidates.find(p=>p.path.join('::')===segments.join('::'))||(candidates.length===1?candidates[0]:null);
  };
  const routeFor=type=>counts.get(type.name)>1?`${slug(type.namespace)}/${slug(type.name)}`:slug(type.name);
  const titleFor=type=>counts.get(type.name)>1?`${type.name} (${type.namespace})`:type.name;
  return {apiFor,routeFor,titleFor,byQualifiedName};
}
