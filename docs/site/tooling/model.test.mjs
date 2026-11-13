import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRustdoc, typeText, signature } from './model.mjs';

const item = (id,name,inner,visibility='public') => ({ id, name, crate_id:0, attrs:[], docs:'Contract documentation.', visibility, inner });
function fixture() {
  return { format_version:61, root:0, paths:{}, index:{
    0:item(0,'sample',{module:{items:[1,5,6]}}),
    1:item(1,null,{use:{id:2,name:'Button',source:'private::Button',is_glob:false}}),
    2:item(2,'Button',{struct:{kind:{plain:{fields:[3]}},generics:{params:[]},impls:[4]}}),
    3:item(3,'value',{struct_field:{primitive:'u32'}}),
    4:item(4,null,{impl:{trait:null,items:[7]}}),
    5:item(5,'button',{module:{items:[]}}),
    6:{...item(6,'Hidden',{struct:{kind:{plain:{fields:[]}},impls:[]}}),attrs:[{other:'#[doc(hidden)]'}]},
    7:item(7,'set_value',{function:{header:{},generics:{params:[]},sig:{inputs:[['value',{primitive:'u32'}]],output:null}}}),
  }};
}
test('public reexports expose their real API, excluding hidden internals',()=>{
  const model=normalizeRustdoc(fixture(),'sample');
  const button=model.pages.find(p=>p.name==='Button');
  assert.equal(button.url,'api/sample/struct-button/');
  assert.deepEqual(button.members.map(m=>m.name),['value','set_value']);
  assert.equal(model.pages.some(p=>p.name==='Hidden'),false);
  assert.ok(model.pages.find(p=>p.name==='button').url!==button.url);
  assert.equal(model.pages.find(p=>p.path.length===0).url,'api/sample/');
});
test('symbol identities do not include compiler-local IDs',()=>{
  const a=normalizeRustdoc(fixture(),'sample');
  assert.equal(a.pages.find(p=>p.name==='Button').id,'sample::Button#struct');
  assert.ok(a.symbols.every(s=>!s.id.includes('rustdoc')));
});
test('public glob reexports expose public contracts from private modules',()=>{
  const doc=fixture();
  doc.index[0].inner.module.items=[8];
  doc.index[8]=item(8,null,{use:{id:9,name:'private',source:'private',is_glob:true}});
  doc.index[9]=item(9,'private',{module:{items:[2,6,10]}},'default');
  doc.index[10]=item(10,'Secret',{struct:{kind:{plain:{fields:[]}},impls:[]}},'default');
  const model=normalizeRustdoc(doc,'sample');
  assert.ok(model.pages.some(p=>p.id==='sample::Button#struct'));
  assert.deepEqual(model.pages.find(p=>p.path.length===0).children.map(c=>c.name),['Button']);
  assert.ok(!model.pages.some(p=>['Hidden','Secret','private'].includes(p.name)));
});
test('unknown schema and type shapes fail instead of silently dropping API',()=>{
  const d=fixture();d.format_version=999;assert.throws(()=>normalizeRustdoc(d,'sample'),/Unreviewed/);
  assert.throws(()=>typeText({future_type:{}}),/Unsupported/);
});
test('signatures retain references, generics, and return values',()=>{
  assert.equal(typeText({borrowed_ref:{is_mutable:true,type:{generic:'T'}}}),'&mut T');
  assert.equal(signature(item(1,'get',{function:{header:{is_async:true},generics:{params:[]},sig:{inputs:[],output:{primitive:'u32'}}}})),'async fn get() -> u32');
});
test('synthetic impl-Trait parameters are not printed as invalid generic declarations',()=>{
  const value=item(1,'build',{function:{header:{},generics:{params:[{name:'T',kind:{type:{bounds:[]}}},{name:'impl Into<T>',kind:{type:{is_synthetic:true,bounds:[]}}}],where_predicates:[{bound_predicate:{type:{generic:'T'},bounds:[{trait_bound:{trait:{path:'Clone'},modifier:'none'}}]}}]},sig:{inputs:[['value',{generic:'impl Into<T>'}]],output:{generic:'T'}}}});
  assert.equal(signature(value),'fn build<T>(value: impl Into<T>) -> T\nwhere T: Clone');
});

test('case-distinct reexports keep separate routes and duplicate entries collapse',()=>{
  const doc=fixture();
  doc.index[0].inner.module.items=[8,9,10];
  doc.index[8]=item(8,null,{use:{id:81,name:'Locale',source:'icu::Locale',is_glob:false}});
  doc.index[9]=item(9,null,{use:{id:91,name:'locale',source:'icu::locale',is_glob:false}});
  doc.index[10]=item(10,null,{use:{id:91,name:'locale',source:'icu::locale',is_glob:false}});
  const pages=normalizeRustdoc(doc,'sample').pages;
  assert.equal(pages.filter(p=>p.kind==='use').length,2);
  assert.equal(new Set(pages.map(p=>p.url)).size,pages.length);
  assert.equal(pages.find(p=>p.path.length===0).children.length,2);
  doc.index[0].inner.module.items.reverse();
  assert.deepEqual(normalizeRustdoc(doc,'sample').pages.map(p=>p.url).sort(),pages.map(p=>p.url).sort());
});
