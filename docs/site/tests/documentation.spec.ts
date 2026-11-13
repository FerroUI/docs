import { test, expect } from '@playwright/test';

test('task search leads to a guide and excludes implementation reference pages',async({page})=>{
 await page.goto('./');
 await page.getByRole('button',{name:'Search documentation',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search query'}).fill('button command');
 await expect(page.locator('.search-results a').first()).toContainText('Handle actions with commands',{timeout:30000});
 await expect(page.locator('.search-results strong').filter({hasText:/^ButtonVTable$/})).toHaveCount(0);
});

test('real WASM loads on demand and edited or invalid XAML has the correct lifecycle',async({page})=>{
 const modules:string[]=[];page.on('request',request=>{if(request.url().includes('ferroui_docs_browser.wasm'))modules.push(request.url())});
 await page.goto('start/playground/');
 expect(modules).toHaveLength(0);
 const sample=page.locator('live-sample').first();
 await sample.getByRole('button',{name:'Run example'}).click();
 await expect(sample.locator('[data-sample-status]')).toHaveText('Preview updated',{timeout:60000});
 expect(modules.length).toBeGreaterThan(0);
 await expect(sample.frameLocator('iframe').locator('canvas').first()).toBeVisible();
 await sample.getByRole('button',{name:'Edit XAML'}).click();
 const editor=sample.getByRole('textbox',{name:'Editable XAML example'});
 const previous=await sample.getAttribute('data-render-revision');
 await editor.fill('<Button xmlns="https://github.com/ferroui" Content="Edited in documentation"/>');
 await expect.poll(()=>sample.getAttribute('data-render-revision')).not.toBe(previous);
 await editor.fill('<Button>');
 await expect(sample.locator('.sample-error')).toBeVisible();
 await expect(sample.frameLocator('iframe').locator('canvas').first()).toBeVisible();
 await sample.getByRole('button',{name:'Reset',exact:true}).click();
 await expect(sample.locator('.sample-error')).toBeHidden();
 await page.goto('guides/binding/');
 await expect(page.getByRole('heading',{name:'Bind controls to application state'})).toBeVisible();
});

test('mobile control navigation and agent exports remain useful',async({page,request})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('controls/');
 await page.getByPlaceholder('Button, text, selection…').fill('TextBox');
 const textbox=page.locator('.gallery-grid a').filter({has:page.getByRole('heading',{name:'TextBox',exact:true})});
 await expect(textbox).toBeVisible();
 await textbox.click();
 await expect(page.getByRole('heading',{name:'TextBox',exact:true,level:1})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const markdown=await request.get('controls/reference/textbox/index.md');
 expect(markdown.ok()).toBe(true);expect(await markdown.text()).toContain('PlaceholderText');
 expect((await request.get('llms.txt')).ok()).toBe(true);
});
