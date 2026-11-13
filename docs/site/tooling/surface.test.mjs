import test from 'node:test';
import assert from 'node:assert/strict';
import { exclusion } from './surface.mjs';
const page=(crate,name,kind='struct',path=[name])=>({crate,name,kind,path});
test('Rust-public implementation types are not part of the application reference',()=>{
 for(const p of [page('ferroui-controls','ButtonVTable'),page('ferroui-base','TextFormatterImpl'),page('ferroui-x11','X11Window'),page('ferroui-remote-protocol','Message'),page('ferroui-base','ServerVisual','struct',['rendering','composition','server','ServerVisual']),page('ferroui-base','IPlatformRenderInterface','trait',['platform','IPlatformRenderInterface']),page('ferroui-controls','IWindowingPlatform','trait',['platform','IWindowingPlatform']),page('ferroui-base','RenderDataReader','struct',['rendering','composition','drawing','RenderDataReader'])])assert.ok(exclusion(p),p.name);
});
test('controls, MVVM, custom-control contracts and platform options remain public',()=>{
 for(const p of [page('ferroui-controls','Button'),page('ferroui-reactiveui','ReactiveCommand'),page('ferroui-controls','ControlImpl','trait'),page('ferroui-controls','ControlImplExt','trait'),page('ferroui-win32','Win32PlatformOptions'),page('ferroui-browser','BrowserAppBuilder','trait'),page('ferroui-opengl','OpenGlControlBase'),page('ferroui-pretext','PreparedText'),page('ferroui-base','PixelFormat','struct',['platform','PixelFormat']),page('ferroui-base','IStorageProvider','trait',['platform','storage','IStorageProvider']),page('ferroui-base','Compositor','struct',['rendering','composition','Compositor']),page('ferroui-base','ICustomDrawOperation','trait',['rendering','scene_graph','ICustomDrawOperation'])])assert.equal(exclusion(p),null,p.name);
});
