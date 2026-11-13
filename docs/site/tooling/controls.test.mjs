import test from 'node:test';
import assert from 'node:assert/strict';
import { controlIdentity } from './controls.mjs';

test('same-named controls retain separate references and correct crate APIs',()=>{
  const types=[{name:'Chart',namespace:'FerroUI.Controls.Charts',rustPath:'ferroui_controls_charts::Chart'},{name:'Chart',namespace:'FerroUI.LiveCharts',rustPath:'ferroui_controls_livecharts::Chart'},{name:'Button',namespace:'FerroUI.Controls',rustPath:'ferroui_controls::Button'}];
  const pages=types.map(t=>({name:t.name,crate:t.rustPath.split('::')[0].replaceAll('_','-'),kind:'struct',path:[t.name]}));
  const {apiFor,routeFor,titleFor}=controlIdentity(types,pages);
  assert.notEqual(routeFor(types[0]),routeFor(types[1]));
  assert.equal(routeFor(types[2]),'button');
  assert.equal(apiFor(types[0]),pages[0]);
  assert.equal(apiFor(types[1]),pages[1]);
  assert.match(titleFor(types[0]),/FerroUI.Controls.Charts/);
});
