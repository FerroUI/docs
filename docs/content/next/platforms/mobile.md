---
title: "Target iOS and Android"
description: "Start from the iOS or Android host and adapt shared views for mobile lifetimes and input."
sidebar:
  order: 2
---

Share view models and controls, then supply a mobile entry point and a single-view lifetime. Desktop `Window` behavior is not the hosting contract for mobile content.


## Start with an existing host

Use the [iOS catalog](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ControlCatalog.iOS) or [Android catalog](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/ControlCatalog.Android) before adapting your own application. These supply the platform entry points and build setup that a shared view does not include.

From the repository root, the supplied smoke scripts can build and exercise the hosts:

```sh
# Replace the simulator argument with an installed device name or UDID.
scripts/ios/sim-catalog.sh 'YOUR_SIMULATOR_UDID' --pages Home,TextBox,ListBox
# Uses the configured Android SDK, NDK, and emulator.
scripts/android/emu-catalog.sh --build --pages 'Home;TextBox;ListBox'
```

These scripts manage a simulator/emulator run and capture the requested pages. Follow their `--help` output for keeping the device running and selecting output paths. Device signing and store distribution remain separate steps.

For a shared profile view, keep the form in a `UserControl`; each platform host installs that view using its own lifetime. Put saved profile data in a service so a recreated surface can rebuild the form from state.

## iOS

Use Xcode, the iOS SDK, and a Rust target appropriate to the simulator or device. The repository includes bundling scripts and a catalog entry point. Simulator success does not verify signing, device GPU behavior, safe areas, or VoiceOver on physical hardware.

## Android

Use the Android SDK and NDK with the framework's supported minimum API level. The repository's packaging scripts build without requiring a Gradle application project. Keep the native activity lifecycle, input method, and surface lifecycle in mind when retaining application state.

## Design for interruption

A mobile app can lose focus, pause, change orientation, or have its surface recreated. Persist important state in services or models with an appropriate lifetime. Cancel transient work and avoid assuming every control attachment lasts for the whole process.

## Verify interaction

Test touch target size, software keyboard occlusion, scrolling while text is focused, safe-area insets, back navigation, accessibility, and suspend/resume. Use actual devices for release confidence; emulators and simulators cover only part of the platform behavior.

## Public controls and next steps

- [UserControl]({{BASE}}/controls/reference/usercontrol/) — reusable content without desktop window assumptions.
- [ScrollViewer]({{BASE}}/controls/reference/scrollviewer/), [TextBox]({{BASE}}/controls/reference/textbox/), and [Button]({{BASE}}/controls/reference/button/) — a form that remains usable with the software keyboard open.
- [Adaptive layout]({{BASE}}/design/layout/), [accessibility]({{BASE}}/design/accessibility/), and [async lifetimes]({{BASE}}/guides/async/).
- [Public API index]({{BASE}}/api/) — check each entry's extracted platform availability before using a platform-specific method.
