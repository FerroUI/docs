import { FerroExports } from './ferroui.js';
import createModule from './ferroui-docs-browser.js';

const protocol = 'ferroui-docs/1';
const origin = location.origin;
const send = (type, payload = {}) => parent.postMessage({ protocol, type, ...payload }, origin);
try {
  const runtime = await createModule();
  FerroExports.attach(runtime);
  runtime.runMain();
  addEventListener('message', (event) => {
    if (event.origin !== origin || event.source !== parent || event.data?.protocol !== protocol) return;
    const { type, xaml, theme, requestId } = event.data;
    try {
      if (type === 'apply' && typeof xaml === 'string' && xaml.length <= 65536) {
        runtime.applyXaml(xaml);
        send('applied', { requestId });
      } else if (type === 'theme' && ['light', 'dark'].includes(theme)) runtime.setTheme(theme);
    } catch (error) { send('error', { requestId, message: String(error) }); }
  });
  send('ready');
} catch (error) { send('error', { message: `The browser runtime could not start: ${String(error)}` }); }
