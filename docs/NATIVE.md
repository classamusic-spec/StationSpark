# Getting Station Spark onto a phone

Station Spark is a React Native app that, until now, had only ever been *verified* as a web export.
This document is the record of the first native-readiness pass: what `npx expo prebuild` produces,
how a developer gets a build onto a device, and — the important part — an honest list of what is
still untested because it can only be tested on real hardware.

**Nothing in this document has been run on a device.** It was written in a Linux container with no
Android SDK, no `adb`, no Xcode and no CocoaPods. What *was* verified here is everything up to the
native compiler: config resolution, prebuild, autolinking, Expo Doctor, and a full Metro + Hermes
bundle for both `android` and `ios`. The compile, link and run steps are still unproven.

---

## 1. Workflow: Continuous Native Generation (CNG)

`ios/` and `android/` are **generated build output, not source**, and they stay in `.gitignore`.

```
npx expo prebuild --clean     # rebuild ./ios and ./android from app.json
```

Everything the app needs from the native projects is expressible in `app.json` today — the permission
clean-up in section 3 was done entirely there, and `prebuild --clean` reproduces it byte for byte.
Committing the two folders would freeze the RN 0.86 / Expo SDK 57 template into the repo and turn
every SDK upgrade into a hand-merge of ~40 template files, for no benefit this project can currently
name.

**The rule that follows from this: never hand-edit anything under `ios/` or `android/`.** The next
`prebuild` silently discards it. If a native change is genuinely needed, write a [config
plugin](https://docs.expo.dev/config-plugins/introduction/) under `plugins/` and add it to
`app.json`. Revisit the decision to commit only if a dependency ever requires a native edit that no
plugin can express.

Prebuild output is small (~1.5 MB across both folders before any build). Gradle and CocoaPods caches
(`android/build`, `android/.gradle`, `ios/Pods`, `DerivedData`) all land *inside* those ignored
folders, and the generated `android/.gitignore` / `ios/.gitignore` cover them too, so nothing
build-sized can ever reach a commit.

---

## 2. What prebuild produced

`npx expo prebuild --platform all` succeeded with no warnings and no errors. CocoaPods was skipped
because the host is not macOS — that is the only step that did not run.

| | |
| --- | --- |
| App name / slug | Station Spark · `station-spark` |
| Bundle ID / package | `com.stationspark.app` (both platforms) |
| Version | `0.1.0` · iOS `CFBundleVersion` 1 · Android `versionCode` 1 |
| Scheme | `stationspark://` (plus `com.stationspark.app://` on iOS) |
| Orientation | Portrait, locked — iPhone, iPad *and* Android tablets |
| iOS deployment target | 16.4 · arm64 only · `UIRequiresFullScreen` true |
| Android SDK levels | min 24 (Android 7) · target/compile 36 (Android 16) |
| Engine | Hermes, both platforms |
| Architecture | New Architecture / Fabric — `newArchEnabled=true` |
| Edge-to-edge | `edgeToEdgeEnabled=true` (Android default from SDK 54) |
| Icons | 1024² iOS AppIcon (no alpha — App-Store safe) · Android adaptive icon at 6 densities |
| Splash | `expo-splash-screen`, `contain` on `#4FB3F6`, both platforms |

### Native modules — all 30 autolink

Expo modules (20): `expo`, `expo-asset`, `expo-audio`, `expo-constants`, `expo-file-system`,
`expo-font`, `expo-gl`, `expo-haptics`, `expo-keep-awake`, `expo-linear-gradient`, `expo-linking`,
`expo-modules-core`, `expo-router`, `expo-speech`, `expo-splash-screen`, `expo-status-bar`,
`expo-system-ui`, `@expo/dom-webview`, `@expo/log-box`, `@expo/ui`.

React Native modules (10): `@react-native-async-storage/async-storage`,
`@react-native-masked-view/masked-view`, `@shopify/react-native-skia`, `react-native-gesture-handler`,
`react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`,
`react-native-svg`, `react-native-worklets`, `expo`.

Every module the app actually calls — `expo-audio`, `expo-speech`, `expo-haptics`, `expo-gl`, Skia —
is present. All of them ship New Architecture support at these versions; nothing in the tree needs the
legacy interop layer.

`expo-keep-awake` is linked but **never called** anywhere in `src/` or `app/`. It costs a few KB and
nothing else, but a mini-game that a child reads for two minutes is exactly where you would want
`useKeepAwake()`, so it is probably a missing call rather than a stray dependency.

---

## 3. Permissions — what the app asks for, and what it no longer asks for

A kids' app that asks for anything surprising is a real problem, and the default prebuild asked for
several. The final manifest is now this, and **nothing here triggers a runtime permission dialog**:

| Permission | Why |
| --- | --- |
| `INTERNET` | Required by React Native itself (Metro in dev). |
| `MODIFY_AUDIO_SETTINGS` | `expo-audio` sets the audio session so sfx play with the ringer off. |
| `VIBRATE` | `expo-haptics`. |

iOS requests **no** usage-description permissions at all.

### What was removed, and why it mattered

`expo-audio`'s config plugin defaults assume you might record audio and play in the background.
Neither is true here — `src/services/audio.ts` only plays bundled `.wav` one-shots and loops, and
never sets `shouldPlayInBackground`. Left at defaults, the first prebuild produced:

- `android.permission.RECORD_AUDIO` — **microphone access on a children's app.** Play Store review,
  the Designed for Families programme and any parent reading the store listing would all have had a
  question about this. Removed with `recordAudioAndroid: false`.
- `NSMicrophoneUsageDescription` — the iOS half of the same thing. Removed with
  `microphonePermission: false`.
- `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, a `MediaSessionService` in the manifest,
  and `UIBackgroundModes: [audio]` — a background-playback media session the app never uses, and one
  that App Review does ask about. Removed with `enableBackgroundPlayback: false`.

The bare RN template also contributes three permissions marked "OPTIONAL, REMOVE WHATEVER YOU DO NOT
NEED", which prebuild copies in wholesale. All three are now blocked via `android.blockedPermissions`:

- `SYSTEM_ALERT_WINDOW` — "draw over other apps", a special app access. Blocked in release; the
  `debug`/`debugOptimized` source sets declare it themselves, so the RN dev overlay is unaffected.
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` (`maxSdkVersion=32`) — legacy storage the app
  never touches.

`android.blockedPermissions` emits `tools:node="remove"` entries, so this also protects the app from
any future dependency quietly reintroducing them.

### Other config fixes made in the same pass

- **`ios.infoPlist.UIRequiresFullScreen: true` was dead config.** `@expo/config-plugins` always writes
  `UIRequiresFullScreen` from `ios.requireFullScreen` (default `false`) *after* merging `infoPlist`,
  so the intent was being silently stomped and the app shipped as iPad-multitasking-enabled — which in
  turn forced all four landscape/portrait orientations into `UISupportedInterfaceOrientations~ipad`,
  contradicting the portrait lock everywhere else. Now set as `ios.requireFullScreen: true`; iPad is
  portrait-only, like the phone and like Android.
- Removed `expo.newArchEnabled` and the top-level `expo.splash` block — neither is a valid SDK 57
  config key any more (Expo Doctor flagged both). New Architecture is on regardless
  (`gradle.properties: newArchEnabled=true`), and the `expo-splash-screen` plugin, already configured
  with identical values, is what actually produces the splash.
- Added `expo-asset` as a direct dependency. It is a **required** peer of `expo-audio` (which resolves
  `require()`d `.wav` assets through it) and was only present transitively. Expo Doctor: *"Your app
  may crash outside of Expo Go without this dependency."*

### Expo Doctor

Before: 18/21. After: **21/21, no issues detected.**

The three failures were the two invalid `app.json` keys, the missing `expo-asset` peer, and a
`@types/jest` major-version mismatch (30 installed, SDK 57 expects 29). The last is a dev-only type
package with no native consequence and the test suite is green on it, so it is pinned out of the check
via `expo.install.exclude` in `package.json` rather than downgraded.

---

## 4. Running it on a device

### Prerequisites

| | Android | iOS |
| --- | --- | --- |
| OS | macOS, Linux or Windows | **macOS only** |
| Toolchain | Android Studio + SDK 36, `ANDROID_HOME` set | Xcode 16+, CocoaPods |
| JDK | 17 or 21 | — |
| Signing | none (debug keystore is generated) | a free Apple ID works for development |
| Node | 20+ (EAS profiles pin 22.14.0) | same |

### Local build — the fastest loop once you have the toolchain

```bash
npm install
npx expo prebuild --clean      # regenerate ios/ and android/
npm run android                # expo run:android  — device or emulator
npm run ios                    # expo run:ios      — simulator; add --device for hardware
```

`expo run:*` runs prebuild for you if the folder is missing, compiles, installs and starts Metro.
Rebuild natively only when a native dependency or `app.json` changes; JS changes reload over Metro.

### EAS Build — the sane path, and the only path without a Mac

`eas.json` defines four profiles.

```bash
npm i -g eas-cli
eas login
eas build:configure          # once, links the project to an EAS account

# an installable APK you can sideload or hand to a tester
eas build --profile preview --platform android

# an iOS build you can install on registered devices, from any OS
eas build --profile preview --platform ios

# store builds (AAB + IPA), with remote version auto-increment
eas build --profile production --platform all
```

| Profile | What it gives you |
| --- | --- |
| `development` | Debug build with `developmentClient: true` — **requires `npx expo install expo-dev-client` first**, which is not currently a dependency. Only add it if you want the dev-client loop. |
| `preview` | Internal distribution. Android → installable `.apk`; iOS → ad-hoc, needs device UDIDs registered (`eas device:create`). This is the "get it in a child's hands to test" profile. |
| `preview:simulator` | Same, but an iOS Simulator build (`.app`), no Apple account needed. |
| `production` | Store distribution — Android App Bundle + App Store IPA, `autoIncrement` on. |

`cli.appVersionSource` is `remote`, so EAS owns `versionCode` / `buildNumber` and `app.json` keeps
only the human-facing `version`.

### Before the first store submission

- Set a real `version` (0.1.0 is a placeholder).
- Add `android.adaptiveIcon.monochromeImage` — without it, Android 13+ themed icons fall back to the
  full-colour icon.
- `app/dev/*` (`cast`, `gallery`, `icon`, `kit`, `splash`, `three`) are real routes in the production
  bundle and are reachable by deep link, e.g. `stationspark://dev/gallery`. Harmless, but decide
  deliberately whether they ship.
- Children's-app compliance (COPPA / Google Play Designed for Families / App Store Kids Category) is
  a separate exercise. The app collects nothing and talks to no server, which is the easy half.

---

## 5. Risks — highest likelihood of breaking on a device, first

Everything below was found by reading the code and by bundling for `android` and `ios` with Metro and
Hermes. Nothing below has been observed on hardware.

---

### 🔴 1. The native bundle does not build at all — `app/_layout.tsx:27`

**This is a hard blocker: `npx expo run:android`, `run:ios` and every EAS build fail today.**

```
Error: Unable to resolve module fs from node_modules/canvaskit-wasm/bin/full/canvaskit.js
Import stack:
  node_modules/canvaskit-wasm/bin/full/canvaskit.js  | import "fs"
  node_modules/@shopify/react-native-skia/lib/module/web/LoadSkiaWeb.js
  node_modules/@shopify/react-native-skia/lib/module/web/index.js
  app/_layout.tsx  | import "@shopify/react-native-skia/lib/module/web"
```

`useSkiaWeb()` guards the call with `if (Platform.OS !== 'web') return;`, but **Metro resolves
`import()` statically — a runtime guard does not remove the module from the graph.** So building for a
phone drags in CanvasKit's Emscripten glue, which `require`s the Node built-in `fs`, and Metro stops.

The guard is doing its job at *runtime*; the problem is purely that the specifier is visible to the
bundler. The fix is to make the specifier disappear on native by putting it behind a platform-resolved
module — the same mechanism `src/three/Stage.tsx` / `Stage.native.tsx` already uses:

```ts
// src/services/skiaWeb.ts        (web)
export async function loadSkiaWeb(): Promise<void> {
  const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
  await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
}

// src/services/skiaWeb.native.ts (iOS / Android)
export async function loadSkiaWeb(): Promise<void> {
  /* Skia links its own native library on device; there is no wasm to fetch. */
}
```

…and calling `loadSkiaWeb()` from `_layout.tsx` instead of importing the web entry point directly.

**Verified:** with exactly that change in place, `expo export --platform android` and
`--platform ios` both complete — 9.2 MB and 9.0 MB of Hermes bytecode plus 81 assets. The probe was
reverted; the repository still contains the failing version.

Do *not* "fix" this by hiding the specifier in a variable. That gets past Metro and then fails in
Hermes instead — `error: Invalid expression encountered ... await import(webEntry)` — because Hermes
only supports `import()` with a literal specifier. Platform files are the only clean route.

Everything else in the app bundles cleanly for both platforms. Nothing else in `src/` reaches a
web-only module.

---

### 🔴 2. The first sound of the session is silent on a locked-ringer iPhone — `src/services/audio.ts:92-94, 126-132`

```ts
async function init() {
  if (initialized) return;
  initialized = true;                                   // set before the await
  await setAudioModeAsync({ playsInSilentMode: true, ... });
}

play(name) {
  void init();                                          // fire-and-forget
  ...
  p.play();                                             // runs first
}
```

`init()` sets `initialized = true` *before* awaiting, and `play()` never waits for it. On the first
tap, `p.play()` runs a turn of the event loop before the audio session is configured. On iOS with the
physical ringer switch on silent — which is how a great many phones live — `playsInSilentMode` has not
been applied yet and **the first sound of the session is dropped.** Every later sound is fine, so this
is invisible in any test that plays more than one sound.

On web the audio session concept does not exist, which is why it has never shown up.

Awaiting `init()` before the first `play()` (or calling `sfx.init()` from `_layout.tsx` alongside
`sfx.setEnabled`) fixes it.

---

### 🟠 3. One `AudioPlayer` per sound means rapid taps cut each other off — `src/services/audio.ts:104-105, 132`

`players` holds exactly one `AudioPlayer` per `SfxName`, and a repeat play is `seekTo(0)` then
`play()`. Two consequences on device that web does not share:

- **No overlap.** Two children's taps 80 ms apart do not produce two `tap` sounds; the second restarts
  the first. In a drag-and-drop game with a `pop` per token this reads as dropped audio.
- **`seekTo` is genuinely asynchronous on native.** `void p.seekTo(0); p.play();` starts playback
  before the seek has necessarily landed, so a rapid re-trigger can play from the old position or not
  audibly restart at all. On web the same call is effectively synchronous.

A pool of 2–3 players per name, round-robined, is the usual shape. Also note that players are created
lazily and **never released** — 33 native player objects accumulate for the life of the process,
which is survivable but is a real ExoPlayer/AVAudioPlayer cost on a low-end Android device.

---

### 🟠 4. `es-MX` speech is never checked for, and may not exist on the device — `src/services/speech.ts:36-46`

`Speech.speak(text, { language: 'es-MX' })` is called unconditionally. On device:

- **Android** needs the Spanish (Mexico) voice data actually installed for the TTS engine. If it is
  not, the utterance is silently dropped or spoken by the default engine with English phonology —
  "el camión" read as English. There is no callback that distinguishes this from success.
- **iOS** returns no voice for an unavailable language and falls back to the system voice, again with
  English pronunciation.

The app never calls `Speech.getAvailableVoicesAsync()`, so it cannot know. Given that Spanish
vocabulary is a *taught* part of the curriculum, mispronounced Spanish is worse than silent Spanish.
Probing once at startup and falling back to `es-US` / `es-ES` / muting the Spanish half would make the
failure honest.

---

### 🟠 5. `Speech.stop()` immediately before `Speech.speak()` drops the new line on Android — `src/services/speech.ts:39-40`

```ts
Speech.stop();          // returns a Promise; not awaited
Speech.speak(text, {...});
```

`stop()` is asynchronous. On Android the stop can be processed *after* the speak has been queued,
cancelling the utterance that was just requested. The symptom is intermittent silence when dialogue
lines change quickly — exactly what `useCaptainLine` does when a child taps through a brief.

The same pattern makes `speech.sayWord()` (`speech.ts:59`) fragile: the Spanish half is scheduled from
`onDone`, so if the English half is cancelled rather than completed, the Spanish word may never be
spoken at all. `onStopped` is wired as a safety net, but Android does not always fire it.

---

### 🟠 6. A font that fails to load hangs the app on the splash forever — `app/_layout.tsx:42-53`

```ts
const [fontsLoaded] = useFonts({ ... });   // the error is discarded
const ready = fontsLoaded && skiaReady;
```

`useFonts` returns `[loaded, error]`. The error is dropped, so if any of the six TTFs fails to
register natively, `fontsLoaded` stays `false` for the lifetime of the process and the child sits on
`<AnimatedSplash/>` with no way forward. On web the fonts come from CSS and effectively cannot fail
this way; on device it is a real (if uncommon) first-launch hang, and it is invisible to QA because it
only happens when something has already gone wrong.

Rendering the app on `fontsLoaded || fontError` — the system font is a poor look but a working app —
removes the dead end.

Related, and cheap: **22 TTF files are bundled but the app uses 6.** Importing named weights from
`@expo-google-fonts/fredoka` / `/nunito` pulls in the packages' index modules, which `require()` every
weight *and every italic* they ship — roughly 2 MB of dead font in the binary. Importing the specific
sub-paths (e.g. `@expo-google-fonts/nunito/700Bold`) drops it. Embedding the six faces at build time
through the `expo-font` plugin's `fonts` option would also remove the runtime-load failure above
entirely.

---

### 🟡 7. `webgl.ts` returns `true` on native, so the 3D path is always attempted, untested — `src/three/webgl.ts:22`

```ts
if (Platform.OS !== 'web') return true;   // "expo-gl provides the context"
```

`WEBGL_AVAILABLE` is what makes `ThreeBoundary` start already tripped. Returning `true`
unconditionally means that on every phone the boundary starts *un*-tripped, so the Garage turntable,
the badge flip and the Truck Run road all mount a real `expo-gl` context. That is the intended
behaviour — but it also means the whole `expo-gl` path is entered on device with no prior evidence
that it works, and the safety net behind it has never caught anything.

What is genuinely uncertain there:

- **three r185 dropped WebGL 1 support.** It needs a real WebGL 2 context. `expo-gl` types its context
  as `ExpoWebGLRenderingContext extends WebGL2RenderingContext`, and `@react-three/fiber/native` is
  built for exactly this pairing, so it *should* hold — but expo-gl's WebGL 2 surface is a shim, and
  gaps in it show up as a black canvas or a GL error, not a clean exception the boundary can catch.
- The boundary catches errors thrown **during React render**. Three throws while setting up the
  canvas, outside the render phase — the comment in `ThreeBoundary.tsx` says so explicitly. On web the
  up-front probe covers that case; on native nothing does. A device whose driver rejects the context
  gets an empty transparent canvas over the 2D backdrop, not the 2D fallback.
- `Stage.native.tsx` does not set `dpr` (correctly — expo-gl renders at device scale), so a 3× phone
  renders the road at full native resolution with no clamp. `Stage.tsx` clamps web to `[1, 2]`. This is
  the most likely source of a frame-rate difference between the two platforms.

Worth adding a real probe (`GLView.createContextAsync()` once at startup, or trusting the boundary but
also rendering the fallback on a context-lost event) before trusting 3D on device.

The good news: the platform split itself is sound. `@react-three/fiber` and `@react-three/fiber/native`
resolve to the *same* file on native (the package's `react-native` main field points into `native/`),
so `useFrame` in `Badge3D.tsx`/`TruckModel.tsx`/`TruckRunRoad.tsx` and `Canvas` from
`Stage.native.tsx` share one React context. That is the classic R3F-on-RN crash and this project does
not have it.

---

### 🟡 8. Skia allocates a new path per frame on the UI thread — `src/world/props/HoseRig.tsx:81`, `src/world/props/WaterGauge.tsx:32-90`

`Skia.Path.Make()` inside `useDerivedValue` worklets: `WaterGauge` builds three paths per frame,
`HoseRig` builds several more with 54 circles each. On web, reanimated's shim runs these on the JS
thread with V8's GC. **On native they run on a separate worklet runtime, and each `SkPath` is a JSI
host object holding C++ memory that is only freed when the worklet runtime's GC gets round to it.**

At 60 fps that is thousands of live Skia objects a second. This is a known pressure pattern rather
than a known bug, and it may well be fine — but the two components involved are the water spray and
the tank gauge, i.e. the parts a child holds their finger on for the longest. If Android jank or
memory growth shows up anywhere, look here first.

Both files correctly mark every worklet, and nothing captures a non-worklet function, so the
"tried to synchronously call a non-worklet function on the UI thread" class of native-only crash is
not present.

---

### 🟡 9. Safe area is handled well but has never met a notch or a gesture bar

`SafeAreaProvider` wraps the tree, 20 screens use `useSafeAreaInsets()`, and — the part that is
usually wrong — every screen that renders a `<BottomBar/>` passes `safeBottom={false}` to
`ScreenFrame`, so the inset is applied once, by the bar (`BottomBar.tsx:172`), not twice. `TopBar` is
rendered as `chrome`, outside the padded content view, so it does not double up either. This looks
right on inspection.

What is still unproven:

- **Android edge-to-edge is on** (`edgeToEdgeEnabled=true`, forced anyway at target SDK 36) and
  `AppTheme` makes both system bars transparent. Content therefore draws behind the gesture bar and
  the status bar, and correctness depends entirely on those inset reads being right at runtime. A
  three-button navigation bar (~48 dp) is a much bigger inset than a gesture pill (~24 dp) — worth
  checking both.
- `<StatusBar style="dark" />` over a `#4FB3F6` sky is a light-content-on-mid-blue judgement that has
  only been seen in a browser.
- `SafeAreaProvider` has no `initialMetrics`, so the very first frame renders with zero insets and
  then reflows. The animated splash covers this, but it is the reason not to be surprised by a jump.
- `useScaledLayout()` clamps `scale` to `[0.76, 1.42]` against a 390×844 design box. A 320 pt-wide
  device (iPhone SE 1st gen, small Androids) lands at the floor and content will be tight; a large
  tablet lands at the ceiling. Neither has been seen.

---

### 🟡 10. Store hydration is async on device in a way it never is on web — `src/state/store.ts:254-265`

`zustand/persist` over AsyncStorage. On web that is `localStorage` and resolves almost immediately; on
device it is a real disk read. `app/index.tsx:10` correctly guards the onboarding redirect with
`hydrated &&`, so a returning child is *not* sent back through onboarding — that trap is already
avoided.

What remains is cosmetic but visible: for the first frames after launch, `FirehouseScreen` renders
against `initialProgress`/`initialProfile` (no name, no badges, rank 1) and then swaps. Nothing gates
`SplashScreen.hideAsync()` or the animated splash on `hydrated`, so on a slow device the child may see
an empty station briefly. Adding `hydrated` to `ready` in `_layout.tsx:53` would close it.

---

### 🟢 11. `localeCompare` makes generated content locale- and engine-dependent — `src/learning/generators/rescue-route.ts:103, 230`, `src/learning/adaptive.ts:174`

These sort generator output with `String.prototype.localeCompare`. Hermes' implementation is backed by
platform ICU (Android) or `NSString` (iOS) and does **not** collate identically to V8. The generators
are otherwise carefully deterministic (seeded RNG), so this is the one place where the same seed can
produce a different puzzle on a phone than in the browser or in Jest — and the tests, which run on
Node, cannot catch it.

For ordering that only needs to be *stable*, plain `<`/`>` comparison is deterministic across engines.

---

### 🟢 12. Small things worth knowing

- `metro.config.js` adds `wasm` to `assetExts` for **all** platforms. Harmless — nothing `require`s a
  `.wasm` on native — but it is a web-only need.
- `public/canvaskit.wasm` (8 MB) is a web public asset. Nothing on native references it, and it is not
  embedded in an APK/IPA. It *does* get copied into `expo export --platform android/ios` output; that
  matters only if `expo-updates` is ever added.
- Hermes emits "variable not declared" warnings for `DOMParser`, `XRWebGLLayer`, `WritableStream`,
  `SVGImageElement`, `btoa` and friends when bundling. All are inside three.js and Skia code paths
  that never execute on native. They are not errors and can be ignored.
- `android:allowBackup="true"` (the template default) means Android auto-backup will carry the child's
  progress to a new device. Probably desirable here; just be aware it is on.
- `expo-file-system` and `@expo/dom-webview` autolink transitively and are never called.

---

## 6. What still needs real hardware

No amount of further work in this container can settle any of the following. Every one of them needs a
device or an emulator with the platform SDK installed.

1. **That it compiles at all.** Gradle has never run; CocoaPods has never run; no `.apk`, `.aab`,
   `.app` or `.ipa` has been produced. Native compilation of Skia, Reanimated, gesture-handler,
   expo-gl and `three`'s dependencies is entirely unproven. Metro + Hermes bundling *is* proven, once
   risk 1 is fixed.
2. **First launch.** Splash → fonts → store hydration → Firehouse, and whether anything in that chain
   hangs or crashes.
3. **The whole `expo-gl` 3D path** (risk 7) — Garage turntable, badge flip, Truck Run road — on both
   platforms and on at least one low-end Android device.
4. **Audio behaviour** (risks 2, 3): first sound with the ringer switch on silent, overlapping taps,
   the engine and spray loops, and behaviour on interruption (a phone call, another app's audio).
5. **Spanish speech** (risks 4, 5) on a device with and without the `es-MX` voice installed.
6. **Skia performance** (risk 8) on a low-end Android device: the hose spray and the water gauge under
   a sustained finger.
7. **Safe area** (risk 9) on a notched iPhone, on an iPad, on Android with gesture navigation, and on
   Android with three-button navigation.
8. **Haptics.** `src/services/haptics.ts` is a no-op on web, so *no* haptic in the app has ever fired.
   Every "motion + sfx + haptic" pairing in the design is unverified.
9. **Deep links**: `stationspark://` cold-start and warm-start into each route.
10. **Backgrounding and resume**: GL context loss, reanimated clocks, audio loops and the shift timer
    across a background/foreground cycle and a device rotation lock.
