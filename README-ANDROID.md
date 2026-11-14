# PULSE ARENA Android

An offline Android build of the PULSE ARENA interface and local bot battles. The APK packages local assets; Capacitor does not run Node.js, the Render server, WebSocket matchmaking or native canvas on Android.

## Build

Use Node.js 22+, Java 21 and Android SDK platform 36 with build tools 35.0.0 (AGP default; 36.0.0 may also be installed). Capacitor 8 supports Android 7.0/API 24 and newer. Install dependencies with `npm ci`, set `ANDROID_HOME` to your SDK directory (or create ignored `android/local.properties` with `sdk.dir=...`), then run:

```
npm run android:build
```

The script copies `public/` to ignored `dist-android/`, selects `pulse.html` as the APK entry point, bundles native lifecycle/orientation plugins, syncs Capacitor and builds a debug APK. Output: `artifacts/PULSE-ARENA-debug.apk` and its SHA-256 checksum. Set `PULSE_ARTIFACT_DIR` to choose another output directory. The source web entry and original server remain intact.

The PULSE interface controller is still being integrated. Until `public/pulse/app.js` exists, the packaging script stops instead of producing an incomplete APK. See `CLOUD-HANDOFF.md` for the exact continuation point.

The inherited HTTPS proxy, if present, is also used for Gradle downloads. A downloaded JDK may need your environment’s trusted CA store, for example `JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts` in this cloud workspace; TLS verification stays enabled. No credentials, SDK files, signing keys or generated web bundles belong in git.

## Install and limits

Transfer the APK to Android and open it, permitting installation from that source. It uses Android's debug signing key and is a development build, not a Play Store release. Local progress belongs to the app installation; uninstalling or clearing app data removes it. Export saves from the game's backup controls before doing so.

The entire game requests landscape, including menus and battles; Android 16 large-screen policies may override orientation requests. The native bridge emits pause/resume/back events for the interface. Hardware/device performance needs real Android testing; a successful build and APK inspection do not establish device compatibility.
