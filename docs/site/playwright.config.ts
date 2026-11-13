import { defineConfig, devices } from '@playwright/test';
const base=process.env.DOCS_BASE||`/docs/${process.env.DOCS_VERSION||'next'}`;
export default defineConfig({
  testDir:'./tests',workers:1,timeout:90000,
  use:{baseURL:'http://127.0.0.1:4387'+base+'/',trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node tooling/serve.mjs',url:'http://127.0.0.1:4387'+base+'/',reuseExistingServer:!process.env.CI},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'firefox',use:{...devices['Desktop Firefox']}},{name:'webkit',use:{...devices['Desktop Safari']}}],
});
