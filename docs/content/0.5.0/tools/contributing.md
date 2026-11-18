---
title: "Contribute to the documentation"
description: "Write task-focused guides with verified examples, public reference links, and versioned navigation."
sidebar:
  order: 5
---

The documentation source lives in the [FerroUI/docs](https://github.com/FerroUI/docs) repository. Edit authored pages in `docs/content`, shared layouts and tooling in `docs/site`, and the browser runner of the live examples in `samples/Docs.Browser`. The framework, its samples, and the ControlCatalog are maintained in the [FerroUI repository](https://github.com/wieslawsoltes/FerroUI).

## Work locally

The `framework.json` file of the documentation repository pins the exact FerroUI commit for each documented version. Run the snapshot and build steps in `docs/site/README.md`. Generate the public API and XAML metadata before checking links, and build the WASM runner before testing interactive examples.

To fix a typo or a short passage, use the edit link at the bottom of a `next` page, which opens the source file on GitHub, and propose the change as a pull request.

## Write for a task

Explain what the reader will accomplish, state prerequisites, and show code that matches this release. Include the failure modes that are likely to block the task. Link directly to the relevant control and API instead of repeating a signature manually.

Use shared examples so the visible snippet and live preview cannot drift. Keep Rust support code in source control and test it. Do not present a platform simulation as proof that the native feature works.

## Review quality

A generated reference page provides API inventory, but its explanation must still be useful. Coverage reports distinguish missing prose from missing symbols. Fix documentation at its source when possible so rustdoc, the website, and agent exports all benefit.

Stable corrections rebuild the same framework revision with a new documentation revision. They must not add unreleased APIs to an older version's reference.

## Make a guide change that stays useful

For a new “search a list” guide, show the declarative version and the XAML version where both apply, and show the required model properties before the XAML that binds to them. Copy Rust examples from the samples or the framework's tests at the documented commit rather than writing new API from memory. Explain the expected result, link to `TextBox` and `ListBox`, and give the likely fix for an empty binding. Use version-relative `{{BASE}}` links in source so the same page works in its release snapshot.

Add the page to `docs/site/src/data/navigation.ts`; the build checks that authored guides are reachable there. Update descriptions so search results explain the task rather than repeat the title. Keep application-facing guidance in the site and implementation design records in their repository documents.

## Review a built page

Run the build and link verifier, then inspect the result at a narrow viewport. Confirm the example's prerequisites, API links, code wrapping, headings, and next steps. Also open its Markdown export: a reader of the plain Markdown should be able to follow the same instructions without the interactive preview.

- [TextBox reference]({{BASE}}/controls/reference/textbox/) and [ListBox reference]({{BASE}}/controls/reference/listbox/) show the public surfaces to link.
- The documentation repository's `docs/site/README.md` contains the complete build and publication workflow.
