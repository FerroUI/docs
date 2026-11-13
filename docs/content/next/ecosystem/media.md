---
title: Play video, preview a camera, or scan QR codes
description: "Choose the media control, connect a platform provider, and manage playback, capture, and QR sessions."
---

Use FerroUI media controls when your view needs video playback, camera preview, or QR analysis. These are separate features. Choose the smallest set of packages and provide the platform integration for your application.

| Task | Start with | Application responsibility |
| --- | --- | --- |
| Play a video | [`MediaPlayerElement`]({{BASE}}/api/ferroui-media-video-controls/struct-mediaplayerelement/) and optional transport controls | Configure a playback provider and choose a supported source. |
| Preview a camera or take a photo | [`CameraPreview`]({{BASE}}/api/ferroui-media-camera-controls/struct-camerapreview/) | Discover devices, let the user start capture, report the negotiated settings, and stop when finished. |
| Outline live QR detections | `QrPreview` with the camera controls' `qr` feature | Supply detections from the preview session and handle decoded results as data. |

## Run the complete example

From the [matching source checkout]({{BASE}}/start/installation/):

```sh
cargo run -p control-catalog-desktop
```

Open **Media & Graphics** and choose **Video**, **Camera**, or **QR codes**. On the Video page, choose **Load bundled video**, then **Play**. On the Camera page, discover devices before starting capture; discovery alone does not acquire hardware. On the QR page, try decoding the bundled image even if live capture is unavailable.

The catalog has separate desktop and browser host integrations. Its iOS and Android hosts do not yet install the same media providers; consult the [mobile integration sample](https://github.com/wieslawsoltes/FerroUI/tree/{{COMMIT}}/samples/PortableMedia.Mobile). Support depends on the host, renderer, permissions, and media format.

## Declare a video player

Register the video controls' markup metadata for your application. Set a provider factory in Rust before attaching the view; the markup describes playback options and the selected source.

```xml
<video:MediaPlayerElement
    xmlns:video="using:FerroUI.Media.Video.Controls"
    Source="file:///absolute/path/video.mp4"
    AutoPlay="False"
    Stretch="Uniform"
    AreTransportControlsEnabled="True" />
```

Choose a local file on desktop or an HTTP(S) resource the browser can load. For a caller-owned player, use `set_media_player` instead. When switching a view away from a caller-owned player, manage that player's lifetime in the caller.

## Start and stop capture explicitly

Give the user a Start action and a Stop action. Report permission denial, absent devices, and negotiated dimensions separately. For a photo action, wait for the pending capture before issuing another request and distinguish a native still image from a preview snapshot.

For live QR, `QrPreview::set_detections` shows matching detections on the current preview. An outline is transient; keep the last decoded value separately if the user needs history. Treat decoded URLs like any other untrusted input and let the user decide whether to open them. The current browser catalog demonstrates live camera QR with supported browser capabilities; static-image decoding is a separate path.

When navigating away, stop application-owned work and ignore late results from the old session. Test denied permission, switching sources, and navigating away during startup.

See the [catalog walkthrough](https://github.com/wieslawsoltes/FerroUI/blob/{{COMMIT}}/docs/media/CONTROL-CATALOG.md), [video controls API]({{BASE}}/api/ferroui-media-video-controls/), and [camera controls API]({{BASE}}/api/ferroui-media-camera-controls/). For deployment details, see [browser hosting]({{BASE}}/platforms/browser/) and [mobile hosting]({{BASE}}/platforms/mobile/).
