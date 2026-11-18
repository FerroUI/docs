import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { topicsFor } from './src/data/navigation';

const version = process.env.DOCS_VERSION || 'next';
export default defineConfig({
  site: process.env.DOCS_ORIGIN,
  base: process.env.DOCS_BASE || `/docs/${version}`,
  trailingSlash: 'always',
  integrations: [starlight({
    title: 'FerroUI',
    pagefind: false,
    description: 'Documentation for FerroUI, a cross-platform UI framework for Rust: declarative Rust UI with signals and React-like components, or compiled XAML; controls, data binding, themes, and the public Rust API.',
    favicon: '/favicon.svg',
    logo: { src: './src/assets/mark.svg', replacesTitle: false },
    social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/wieslawsoltes/FerroUI' }],
    customCss: ['./src/styles/theme.css'],
    components: {
      SiteTitle: './src/components/SiteTitle.astro',
      Head: './src/components/Head.astro',
      Footer: './src/components/Footer.astro',
      Search: './src/components/Search.astro',
      PageTitle: './src/components/PageTitle.astro',
      Sidebar: './src/components/Sidebar.astro',
    },
    sidebar: [{label:'All topics',slug:'topics'}, ...topicsFor(version).map(group=>({label:group.title,collapsed:true,items:group.items.map(([label,slug])=>({label,slug}))}))],
    expressiveCode: { themes: ['github-light', 'github-dark'] },
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
  })],
  vite: { resolve: { alias: { '@components': new URL('./src/components', import.meta.url).pathname } } },
});
