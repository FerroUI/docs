# Build and publish the documentation

This directory holds the Astro Starlight site, its generators, and its tests. The authored pages are in [`docs/content`](../content), the browser runner of the live examples is in [`samples/Docs.Browser`](../../samples/Docs.Browser), and [`framework.json`](../../framework.json) pins the FerroUI commit documented by each version. The FerroUI source stays in its own repository; the build checks out the pinned commit into `.framework/<version>`.

## What a build produces

For one documentation version, the build:

1. checks out the pinned FerroUI commit and adds the documentation runner to its workspace (`tooling/snapshot.py`);
2. extracts the public Rust API with rustdoc JSON for each configured target (`tooling/extract.py`) and dumps the registered XAML and control metadata with the runner;
3. builds the runner for the browser with the pinned Emscripten toolchain of the FerroUI repository;
4. generates the API, control, and example pages (`tooling/prepare.mjs`), builds the site with Astro, writes the Markdown exports and `llms.txt` (`tooling/export.mjs`), packages the downloadable examples (`tooling/package-examples.py`), and indexes everything with Pagefind;
5. verifies authored links, navigation, exports, and examples (`tooling/verify.mjs`) and runs the browser tests in Chromium, Firefox, and WebKit.

The Pages workflow does this for `next` and for every release in `framework.json`, then lays the versions out side by side (`tooling/publish.py`): `/docs/<version>/` for each version, `/docs/versions.json` for the version picker, and `/docs/` redirecting to the latest stable version.

## Local build

Run from the repository root. Use Node 24, Python 3.11 or later, Rust 1.99, and the native prerequisites of FerroUI for your host. The macOS Skia build may require Ninja. The browser runner uses the Emscripten and wasm-bindgen versions pinned by `scripts/browser/setup.sh` in the FerroUI repository.

```sh
python3 docs/site/tooling/snapshot.py --version next --environment .framework/next.env
set -a
. .framework/next.env
set +a
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_BUILD_JOBS=3
export CARGO_TARGET_DIR="$PWD/target/docs-api"
npm ci --prefix docs/site
python3 docs/site/tooling/extract.py --application-features
mkdir -p docs/site/.cache
cargo run --locked --manifest-path "$DOCS_FRAMEWORK_ROOT/samples/Docs.Browser/Cargo.toml" \
  > docs/site/.cache/markup.json
cargo run --locked --manifest-path "$DOCS_FRAMEWORK_ROOT/samples/Docs.Browser/Cargo.toml" \
  -- --verify-examples "$DOCS_CONTENT_ROOT/examples.json"
```

Build the interactive runner in a separate shell, after sourcing the same snapshot environment:

```sh
(cd "$DOCS_FRAMEWORK_ROOT" && scripts/browser/setup.sh "$PWD/.tools")
. "$DOCS_FRAMEWORK_ROOT/.tools/env.sh"
export CARGO_TARGET_DIR="$DOCS_FRAMEWORK_ROOT/target"
"$DOCS_FRAMEWORK_ROOT/scripts/build-browser.sh" ferroui-docs-browser \
  --out "$CARGO_TARGET_DIR/docs-runner"
mkdir -p docs/site/public/runner
cp -R "$CARGO_TARGET_DIR/docs-runner/." docs/site/public/runner/
```

Then run `npm run build --prefix docs/site` and `node docs/site/tooling/verify.mjs`. Preview the result with `npm run preview --prefix docs/site` and open `/docs/next/` at the reported local address. Use the same `DOCS_BASE` for build, verification, and preview. `npm run dev` is useful for authoring after generation; full search exists only in the production build.

A local API build covers the host target only; the workflow merges the desktop, mobile, and browser extractions, and each API page records the targets it was extracted for. Keep the generated caches of different versions apart: clear or move aside `docs/site/.cache/api` and `docs/site/public/runner` before building another version.

Tooling checks: `npm test --prefix docs/site`, `npm run check --prefix docs/site`, and `python3 -m unittest discover -s docs/site/tooling -p 'test_*.py'`.

## Update the framework pin or add a release

1. Record the full commit of the reviewed FerroUI `main` as `next` in `framework.json`.
2. Move aside `.framework/next` if its commit has changed, then run the snapshot command again. It checks out the pinned source and adds only the documentation runner, its examples, and its workspace entry.
3. Review the public API, XAML, sample, and platform changes and update `docs/content/next`. Use `{{BASE}}` for links within a version and `{{COMMIT}}` for links to the pinned FerroUI source.
4. Rebuild the API, the markup metadata, the runner, and the site, and check links, examples, and the Markdown exports.

For a release, add its full release commit to `releases` in `framework.json` and curate a separate `docs/content/<version>` directory; the snapshot step checks that the workspace version at that commit is the release version. Do not reuse later development prose or examples for an earlier version. A documentation correction changes this repository's revision without changing the release pin. Each version adds about 330 MB to the published site, and GitHub Pages publishes at most 1 GB, so remove the oldest version before adding a third.

## Write a guide or a live example

Lead with the task and its prerequisites. Explain the expected result and the likely failures. Link to the exact public API and control pages; implementation design records stay in the FerroUI repository. Add a new guide to `src/data/navigation.ts`; the verifier fails for an authored page that is missing from the navigation.

Add an example to the version's `examples.json` and use `<LiveSample id="..." />` in MDX. The same source feeds the editor, the runtime, the download, and the Markdown export. The editor accepts a bounded vocabulary of registered controls and resources; it cannot compile Rust or load external assets. Link to a complete FerroUI sample for native-only behavior.

## Publishing

`.github/workflows/pages.yml` runs on every push to `main` (and on demand). It builds every pinned version with `.github/workflows/documentation.yml`, checks that each build documents the pinned framework commit, assembles the versions, and deploys them with the GitHub Pages actions. The repository's Pages source is "GitHub Actions"; no branch holds built output. The site origin defaults to `https://ferroui.com` and the base path to the repository name; set the repository variable `DOCS_ORIGIN` only if the site moves to another origin with the same path layout.
