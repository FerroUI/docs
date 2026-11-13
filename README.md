# FerroUI documentation

This repository is the source of the FerroUI documentation site, published at **https://ferroui.github.io/docs/**. [FerroUI](https://github.com/wieslawsoltes/FerroUI) is a cross-platform UI framework for Rust; its code, samples, and changelog live in the FerroUI repository, and its crates are published on [crates.io](https://crates.io/crates/ferroui).

The site documents each release separately (currently 0.5.0) and `next`, the development state of the FerroUI `main` branch. Every version contains task guides, a reference of the public Rust API and the registered controls generated from the FerroUI source, live XAML examples that run FerroUI in WebAssembly, full-text search, and Markdown exports of every page.

## Repository layout

| Path | Contents |
| --- | --- |
| `docs/content/<version>/` | The authored pages of a version (Markdown and MDX), the live examples (`examples.json`), and the curated control summaries (`controls.json`) |
| `docs/site/` | The Astro Starlight site: components, styles, navigation (`src/data/navigation.ts`), generators and checks (`tooling/`), and browser tests (`tests/`) |
| `samples/Docs.Browser/` | The runner that loads the live examples in the browser; the build adds it to the pinned FerroUI checkout |
| `framework.json` | The FerroUI commit documented by `next` and by each release |
| `.github/workflows/` | The workflow that builds every version and deploys the site to GitHub Pages |

The API and control reference pages, the search index, and the browser runner are generated during the build and are not stored in this repository.

## Build and preview locally

A complete build checks out the pinned FerroUI commit, extracts its API with rustdoc, builds the browser runner, and then builds the site. It needs Node 24, Python 3.11 or later, Rust 1.99, and the native prerequisites of FerroUI. The steps are in [docs/site/README.md](docs/site/README.md); in short:

```sh
python3 docs/site/tooling/snapshot.py --version next --environment .framework/next.env
npm ci --prefix docs/site
# extract the API and build the runner as described in docs/site/README.md, then:
npm run build --prefix docs/site
npm run preview --prefix docs/site
```

Open `/docs/next/` at the address the preview prints. For editing prose, `npm run dev --prefix docs/site` serves the pages with live reload once the generation step has run.

## Deployment

Every push to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml). It builds each version listed in `framework.json` (API extraction on macOS, Linux, Windows, iOS, Android, and the browser; the runner; the site; link, export, and browser checks), assembles the versions under `/docs/<version>/`, and deploys the result with GitHub Pages. `/docs/` redirects to the latest stable version. A failed build of any version stops the deployment, and the site that is already published stays in place.

## Contributing

To fix a mistake, open a pull request against `main`: edit the page under `docs/content/next/` (and the same page under the release directory when the fix applies to the release too). The "Edit page" link at the bottom of each `next` page opens the right file on GitHub. Keep links within the site in the `{{BASE}}/...` form and links to FerroUI source in the `{{COMMIT}}` form so that they stay correct for each version. Add a new guide to `docs/site/src/data/navigation.ts`. Issues with the framework itself belong in the [FerroUI repository](https://github.com/wieslawsoltes/FerroUI/issues).

## Licence

The documentation and the site source are licensed under the [MIT License](LICENSE). See [NOTICE.md](NOTICE.md) for the material generated from FerroUI and the third-party components used to build the site.
