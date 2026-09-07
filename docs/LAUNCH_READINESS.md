# Station Spark — Launch Readiness

**What is missing before this can go on the App Store and Google Play.**

Read-only audit of `claude/station-spark-redesign`, 7 September 2026. Every claim
below was checked against the code or the generated native projects, not against
another document. Where an earlier doc is stale, I say so.

This replaces the previous draft of this file. It builds on `docs/AUDIT.md`
(29 correctness findings) and `docs/NATIVE.md` (12 device risks) rather than
repeating them — where an item here overlaps, the reference is given.

---

## The verdict, on one page

**Station Spark is a finished-feeling *product* attached to a project that has
never been built for a phone and has no store presence whatsoever.**

The content is real and it is a lot: 17 missions, 27 mini-games, 18 recipes, 291
bilingual vocabulary words, 90,000 lines of strict TypeScript, 1,000+ unit tests
across 34 suites, a Playwright harness that plays every activity to completion,
and character art proven pixel-identical to the authored SVG. Zero network calls anywhere in `src/`
— no analytics, no ads, no IAP, no third-party SDK. For a children's app that is
an unusually clean sheet and it is the single biggest asset you have going into
review.

What is missing is not more game. It is the last 15% that turns a working app
into a submittable one, and it is almost entirely *outside* `src/`:

| Layer | State |
| --- | --- |
| Gameplay, content, art | Done. Genuinely good. |
| Logic correctness | Tested harder than most shipped apps. |
| Sound effects | Done — 33 procedural cues, well used. |
| **Music** | **Does not exist. Not one bar.** |
| **Voice** | Robot TTS only. Acceptable as a prototype, not as a product. |
| **Native build** | Never attempted. No `.ipa`, no `.aab`, no Gradle run, no `pod install`. |
| **Store listing** | Nothing exists. No screenshots, no copy, no icons uploaded, no policy URL. |
| **Compliance paperwork** | Not started. This is where kids' apps get rejected. |
| **Crash visibility** | None. A crash in release is a white screen you never hear about. |

### The five things that actually block a submission

1. **Nobody has ever built this for a device.** `eas.json` is correct and
   complete, and has never been run. Gradle has never run; CocoaPods has never
   run. Skia, Reanimated 4 + worklets, gesture-handler, `expo-gl` and `three`
   have all been *bundled* (Metro + Hermes, both platforms, proven) but never
   *compiled*. Until a build exists there is nothing to submit and every other
   estimate on this page is a guess. **3–5 days**, most of it credential setup
   and the first round of native compile failures.

2. **There is no privacy policy, no support URL, and no in-app link to either.**
   App Store Connect and Play Console both refuse to accept a submission without
   a privacy policy URL, and Apple guideline 5.1.1(i) additionally requires the
   link *inside* the app. For a Kids Category app that link must sit behind the
   parental gate — which you already have and which already works. **1 day**
   including a hosted page.

3. **The store listing does not exist in any form.** No screenshots at any size,
   no feature graphic, no description, no keywords, no age-rating
   questionnaires, no Data Safety form, no Apple privacy label, no Play "target
   audience and content" declaration, no Families self-certification. All of it
   is required, none of it is started. **4–6 days**, and it depends on (1)
   because you cannot screenshot a build that does not exist.

4. **The app claims tablet support it cannot honour, on both platforms.**
   `app.json` sets `ios.supportsTablet: true` and `orientation: "portrait"`, and
   the generated Android manifest locks `screenOrientation="portrait"` at
   `targetSdk 36`. Android 16 **ignores** orientation and resizability
   restrictions on displays ≥ 600 dp, so every Android tablet and foldable will
   run this app in landscape and in arbitrary window sizes. iPadOS 26 has
   deprecated `UIRequiresFullScreen` the same way. The layout has never been
   seen in landscape by anybody; `layout.landscape` from `useScaledLayout()` is
   consulted in exactly **one** file in the entire codebase
   (`src/screens/Mission/MissionBrief.tsx:229`). You must either make 20 screens
   and 27 activities survive a landscape window, or drop tablet support. **1 day
   to drop it; 4–6 days to do it properly.**

5. **A crash on any screen outside a mission beat is a white screen, silently.**
   There is a `BeatErrorBoundary` for mission beats and a `ThreeBoundary` for
   3D, and nothing else. A throw in Firehouse, Dispatch, Map, Training, Kitchen,
   Badges, Locker or Grown-Ups drops a five-year-old onto a blank screen with no
   route out, and there is no crash reporting of any kind, so you would never
   learn it happened. **1 day** for a root boundary plus wiring up the free,
   zero-SDK crash channels.

Everything else on this page is real, but those five are the gate.

**Realistic time to a submittable build: 5–7 weeks** with one engineer and a
designer/producer sharing the store work. See the timeline at the end.

---

# BLOCKERS

*Cannot submit without these.*

### B1 · No native build has ever been produced
**What:** No `.ipa`, `.aab`, `.apk` or `.app` exists. `npx expo prebuild` has run
(the generated `ios/` and `android/` trees are present and correct, though
git-ignored as build output) but nothing has compiled. `eas.json` declares
`development` / `preview` / `production` profiles correctly, including an AAB
for Play and store distribution, and has never been invoked.

**Why it blocks:** obvious. Also: everything native in this app is unproven.
`@shopify/react-native-skia` 2.6.2, `react-native-reanimated` 4.5.1 with
`react-native-worklets` 0.10.1, `expo-gl` + `@react-three/fiber` 9 + `three`
0.185 on the New Architecture (`newArchEnabled=true`, Hermes, `minSdk 24`,
`targetSdk 36`, `IPHONEOS_DEPLOYMENT_TARGET 16.4`). That is a stack that
compiles fine when it compiles and eats two days when it doesn't.

**Cost:** 3–5 days. Apple Developer Program enrolment (\$99/yr, 24–48 h for an
individual, longer for a company needing a D-U-N-S number) and a Google Play
developer account (\$25 one-off, plus identity verification which now takes days)
are on the critical path and should be started **today** — they are the only
items here with an external wait you cannot compress.

**Files:** `eas.json`, `android/app/build.gradle`, `ios/Podfile`

---

### B2 · Privacy policy, support URL, and the in-app link
**What:** There is no privacy policy anywhere — not in the repo, not in
`app.json`, not in the app. No support URL. No marketing URL.

**Why it blocks:** both stores require a privacy policy URL as a submission
field, and Apple 5.1.1(i) requires the link to be reachable *from inside the
app*. This is true even though the app collects nothing.

**What to write:** the honest version is short and it is a selling point.
I searched all of `src/` and `app/`: **there is not one `fetch`, `XMLHttpRequest`,
`WebSocket`, `Linking.openURL` or `WebView` in the codebase.** The child's name,
avatar, age band and progress live in one AsyncStorage key
(`station-spark-v1`, `src/state/store.ts:336`) and there is no code path that
could transmit them. Say exactly that.

**Where the link goes:** inside the Grown-Ups area, which is already behind the
parental gate. Apple's Kids Category rule (1.3 / 5.1.4) is that a Made-for-Kids
app may not link out of the app *at all* except behind a parental gate — the
privacy policy link included. You already have the mechanism; you just have to
put the link behind it and use `Linking.openURL`.

**Cost:** 1 day (0.5 for the policy text + hosting, 0.25 for the in-app link and
gate wiring, 0.25 for the support page).

**Files:** `src/screens/GrownUps/GrownUpsScreen.tsx` (add a LINKS sheet),
`src/screens/GrownUps/ParentGate.tsx` (already fit for purpose)

---

### B3 · The entire store listing
**What:** `assets/` contains four PNGs (app icon, adaptive foreground, splash,
favicon) and 33 WAVs. There is not a single store asset.

**Needed, App Store:**
- Screenshots at the current required iPhone size (6.9", 1320×2868 / 1290×2796),
  3–10 of them; Apple down-scales for smaller phones.
- **iPad 13" screenshots are mandatory while `supportsTablet: true`** — see B4.
- Icon: `assets/icon.png` is **already correct** — 1024×1024, `colorType=2`
  (RGB, no alpha channel). Apple rejects alpha; you don't have any. Nothing to
  do here. The generated `ios/StationSpark/Images.xcassets/AppIcon.appiconset/`
  correctly uses the modern single-size asset.
- Subtitle (30 chars), keywords (100 chars), promotional text, description,
  what's new. None drafted.
- App preview video: optional, and for a kids' app it converts well enough to be
  worth the day it costs.

**Needed, Google Play:**
- Feature graphic 1024×500 — required, no exceptions.
- Phone screenshots (min 2, they want 4–8).
- 7" **and** 10" tablet screenshots — required to be listed as tablet-capable,
  and required for Designed for Families. See B4 before shooting these.
- Short description (80 chars), full description (4000).

**Cost:** 4–6 days including copywriting and a designer's pass on the frames.
You have `tools/qa/shoot.mjs` which already drives the web build headlessly and
shoots at an arbitrary viewport — that is a real head start for the raw frames,
but store screenshots want composed marketing frames, not raw captures.

---

### B4 · Tablet support is claimed but not honoured — decide, then act
**What:** `app.json` sets `ios.supportsTablet: true`, `orientation: "portrait"`,
`ios.requireFullScreen: true`. The generated `AndroidManifest.xml` carries
`android:screenOrientation="portrait"` at `targetSdkVersion 36`.

**Why it breaks:**
- **Android 16 / API 36 ignores orientation, resizability and aspect-ratio
  restrictions on any display whose smallest width is ≥ 600 dp.** The app targets
  36. Every Android tablet and unfolded foldable will therefore run Station Spark
  in landscape and in resizable windows regardless of what the manifest says.
- **iPadOS 26 deprecated `UIRequiresFullScreen`.** The direction of travel is the
  same: iPad apps are resizable.
- The app has never been laid out for landscape. `useScaledLayout()` scales a
  390×844 design box and *does* expose `landscape` and `wide` — but `landscape`
  is read in exactly one file
  (`src/screens/Mission/MissionBrief.tsx:229`). In a 1280×800 window the scale
  formula resolves to ~1.03, so nothing will be comically wrong, but 20 screens
  and 27 activities laid out as a vertical stack in a short, wide window is not
  something you want a reviewer or a parent to see first.

**Why it blocks:** you cannot produce the iPad screenshots App Store Connect will
demand, and Play's automated pre-launch report shoots tablets. It is also the
fastest route to a wave of 1-star tablet reviews.

**The two honest options:**
- **Drop tablets for v1.** `ios.supportsTablet: false`, exclude large-screen
  devices in the Play device catalogue. **1 day.** You lose the iPad market and
  the Designed-for-Families tablet story, and you will want to come back to it.
- **Support them properly.** Audit every screen in a 1280×800 and 1024×1366
  window. `ActivityFrame` already has a side-rail layout past
  `activity.sideLayoutMinWidth`, so the activities are the *easier* half;
  Firehouse, Map, Dispatch, Kitchen, Locker, Badges and Grown-Ups are the work.
  **4–6 days**, plus a device.

**Files:** `app.json`, `src/screens/shared/useScaledLayout.ts`,
`src/ui/kit/ActivityFrame.tsx`

---

### B5 · No root error boundary, no crash reporting
**What:** `src/screens/Mission/BeatErrorBoundary.tsx` catches throws inside a
mission beat and `src/three/ThreeBoundary.tsx` catches 3D. There is no boundary
above the router. In a release build a React throw does not show a redbox — it
shows a blank screen and, on iOS, frequently takes the process down.

There is also no crash reporting of any kind. No Sentry, no Crashlytics, no
Bugsnag (`@sentry/react-native` appears in `jest.config.js`'s
`transformIgnorePatterns` but is not a dependency).

**Why it blocks:** it doesn't block the *upload*. It blocks shipping something
you can stand behind: a five-year-old who hits a throw on the Badge Wall has no
way back to the station, and you will never learn it happened.

**What to do:**
- **Root boundary.** `expo-router` supports `export function ErrorBoundary` in a
  route file — put one in `app/_layout.tsx` that shows Captain Bea, "Let's go
  back to the station", and one big button to `router.replace('/')`. **3 hours.**
- **Crash reporting for a Kids app.** Apple guideline 1.3 forbids third-party
  analytics in the Kids Category, and Firebase Crashlytics has drawn rejections
  for kids' apps. The safe answer costs nothing and needs no SDK: **App Store
  Connect → Organizer crash reports** and **Play Console → Android vitals**.
  Both are free, both are already collecting the moment you ship, and neither
  touches your "Data Not Collected" declaration. You give up breadcrumbs and
  opt-out coverage; for v1 that is the right trade. If you later want stack
  traces with context, Sentry configured with `sendDefaultPii: false` and IP
  scrubbing is the least-bad third party — but declare it, and expect questions.
- **Hermes source maps must be uploaded** or every stack trace is minified
  garbage. EAS does this for you if configured; verify on the first build.

**Cost:** 1 day total.

---

### B6 · Compliance paperwork — the part that gets kids' apps rejected
None of the below is started. None of it is hard. All of it is required, and
getting one answer wrong costs a review cycle (2–5 days each).

**Apple**
- **Kids Category.** Opting in is what forces the rules below. It also forces an
  age band, and you must pick **one**: *5 and under*, *6–8*, *9–11*. Station
  Spark's own bands are A (5–6), B (7–8), C (9–10), which straddles two of
  Apple's. **Pick 6–8** and say "5–10" in the description.
- **Age rating questionnaire** (the expanded 2025 version, mandatory since
  31 Jan 2026). Answer 4+. Be ready for the "does your app contain content that
  may frighten young children" question — it's a fire-station game; the answer is
  no, and `src/screens/GrownUps/parts/SafetyPoster.tsx` is exactly the artefact
  to point at if a reviewer asks.
- **Privacy Nutrition Label:** *Data Not Collected*. Defensible — zero network
  calls, verified.
- **`ITSAppUsesNonExemptEncryption` is missing** from `app.json` and from the
  generated `ios/StationSpark/Info.plist`. Without it App Store Connect prompts
  you at every single upload. Add
  `ios.infoPlist.ITSAppUsesNonExemptEncryption: false`. **5 minutes.**
- **`PrivacyInfo.xcprivacy`: you probably do not need one.** The earlier draft of
  this document listed it as a to-do; I checked. Ten privacy manifests already
  ship inside your pods — `@react-native-async-storage/async-storage`,
  `react-native` core, `expo-constants`, `expo-system-ui`, `expo-file-system`,
  boost/glog/Folly. Your own code calls no required-reason API directly. An
  app-level manifest is only needed if that changes. Verify on the first upload;
  do not spend a day on it up front.
- **Parental gate — yours is good.** `src/screens/GrownUps/gateQuestion.ts`
  generates a fresh two-digit × two-digit multiplication (both factors 13–88, so
  the product always exceeds the app's own 12×12 syllabus ceiling) behind a
  keypad. That is a stronger gate than most shipped kids' apps use, it is
  randomised so it cannot be memorised, and it is deliberately outside the
  curriculum. Nothing to fix. Just make sure the privacy-policy link from B2 and
  any future store link sits behind it.

**Google Play**
- **Target audience and content declaration** → children included → Families
  policy applies.
- **Families self-certification**: privacy policy, SDK disclosure (you have none
  to disclose), ads declaration (none).
- **Data Safety form**: "no data collected or shared" — *but see B7 on
  `allowBackup` before you write that in marketing copy.*
- **`AD_ID` permission**: correctly absent. Declare "no advertising ID".
- **`INTERNET` permission is declared** in the manifest (React Native adds it)
  while the app makes zero network calls. Not a violation, but a Families
  reviewer may ask. You can strip it from release builds with a manifest-merger
  `tools:node="remove"` in a config plugin if you want the cleanest possible
  declaration. Optional, ~2 hours.
- **Teacher Approved** programme: optional, free, and a strong badge for this
  app. Apply after launch.

**Cost:** 2–3 days of form-filling and copy, spread across the submission window.
Budget one rejection cycle regardless; everyone gets one.

---

### B7 · Android auto-backup sends the child's name to Google Drive
**What:** the generated manifest has `android:allowBackup="true"` (the template
default). Android Auto Backup will therefore copy the `station-spark-v1`
AsyncStorage blob — which contains the child's typed name, avatar and full
progress — to the parent's Google Drive.

**Why it matters:** it is almost certainly *fine* under Play policy (Google
treats Auto Backup as a platform feature and does not require it declared on the
Data Safety form) and it is arguably a feature: progress survives a new phone.
But it means the sentence "nothing ever leaves the device" is **not true**, and
that sentence is exactly the marketing line this app has earned everywhere else.
`docs/NATIVE.md §5.12` notes the flag; it does not connect it to the claim.

**Decide deliberately:**
- Keep it, and phrase the privacy policy as "stored on your device and, if you
  have Android backup enabled, in your own Google account."
- Or set `android.allowBackup: false` in `app.json` and say the stronger thing.

**Cost:** 15 minutes either way. It is the *decision* that has to happen before
the policy is written.

**Files:** `app.json`, `android/app/src/main/AndroidManifest.xml` (generated)

---

### B8 · Version, build number, and the hardcoded version string
`app.json` says `"version": "0.1.0"`; `Info.plist` carries
`CFBundleShortVersionString 0.1.0` / `CFBundleVersion 1`; `build.gradle` carries
`versionName "0.1.0"` / `versionCode 1`. Ship as `1.0.0`.

`eas.json` uses `appVersionSource: "remote"` with `autoIncrement: true` on the
production profile, so EAS will manage build numbers once the version is right.

Separately: `src/screens/GrownUps/GrownUpsScreen.tsx` prints
`"Station Spark 0.1.0"` as a **hardcoded string** in the DEVICE sheet. Read it
from `expo-constants` (`Constants.expoConfig.version`) or it will be wrong within
a week of launch. **30 minutes.**

---

# REQUIRED FOR A GOOD LAUNCH

*You can submit without these. It will hurt.*

## Audio — the biggest content gap by a wide margin

### SFX: done, and better than it needs to be. Leave it alone.
33 cues in `assets/sfx/` (1.6 MB), procedurally synthesised by
`tools/sfx/build-sfx.mjs` (1,091 lines, no dependencies, seeded PRNG so a
rebuild is byte-identical). One-shots at 44.1 kHz, loops and noise beds at
22.05 kHz, everything normalised to −1.5 dBFS. House style is enforced in the
tool: bright, toy-like, short, major key, nothing that reads as failure.

Usage is dense and mostly right — 205 `sfx.play()` call sites. The busiest cues
are `tap-soft` (24), `wrong-soft` (23), `pop` (17), `correct` (16), `success`
(14), `tap` (13). Every mini-game has a feedback sound, either its own or through
`useDragToSlot` / the shared `AskQuestion` / `useKitchenGame`. Where a game looks
like it is missing `correct` it is usually because it plays something *diegetic*
instead — HydrantMatch plays `clank` then `splash` as the hose connects, which
is better design, not a gap.

Two small real gaps:
- **`ticktock` is declared in `LOOPS` and `startLoop('ticktock')` is never
  called anywhere.** A dead cue. (Also noted as `AUDIT.md` L11.)
- **The animated splash is silent.** `src/screens/Splash/` contains no `sfx`
  call at all. The first moment of the app — the badge springing in — makes no
  sound. A single `bell` or `sparkle` there is the cheapest emotional win in the
  codebase. **15 minutes.**
- Roughly half of the 21 `router.push` call sites play a `whoosh`; the rest are
  silent. Not wrong, just inconsistent. **2 hours** to make navigation sound
  uniform.

### Music: **there is none, and the plumbing to play it does not exist**
`settings.music` exists in the store (`src/state/store.ts:57, 153`), defaults to
`true`, is written by nothing, is read by nothing, and is not shown in the
Grown-Ups settings sheet. It is a dead field. There is no `.mp3`, `.m4a`, `.ogg`
or `.aac` anywhere in the repo.

For a children's game this is the single most noticeable absence. Between sound
effects the app is silent, and silence is what separates "a very good prototype"
from "a thing a five-year-old asks to open again".

**What you need — five cues:**

| Cue | Length | Where | Character |
| --- | --- | --- | --- |
| Station theme | 60–90 s loop | Firehouse, Locker, Badges, Progress | warm, hummable, the thing they remember |
| Activity bed | 60 s loop | inside any mini-game | low, no melody competing with speech |
| Dispatch / travel | 30 s loop | Dispatch board, travel cinematic | forward motion, gentle urgency |
| Kitchen | 60 s loop | Firehouse Kitchen | lighter, domestic, different instrumentation |
| Win sting | 3–4 s one-shot | mission + recipe completion | resolves into the station theme's key |

**The engineering is the harder half.** `src/services/audio.ts` is a one-shot +
loop SFX service with a single module-level `masterVolume`. To play music you
need:
- a **separate music bus** — its own `AudioPlayer`, its own volume, independent
  of the SFX mute;
- **crossfade** between cues on navigation (a hard cut between the Firehouse
  theme and the Kitchen theme is worse than no music);
- **ducking** — the music must drop ~12 dB under `speech.say()` and under the
  loud SFX, or Captain Bea becomes unintelligible. `speech.ts` already has an
  epoch mechanism to know when a line starts and stops; the music bus can hang
  off it;
- **`settings.music` finally wired** into `app/_layout.tsx` alongside
  `sfx.setEnabled` / `haptics.setEnabled` / `speech.setEnabled`.

**Format matters and the current pipeline gets it wrong for music.** The SFX
pipeline emits 16-bit PCM WAV. Five 60-second stereo WAV loops would be ~53 MB.
Encode music as AAC (`.m4a`) at 96–128 kbps — the same five loops are ~4.5 MB.
`expo-audio` plays both.

**Sourcing, honestly:**
- **Royalty-free library** (Epidemic, Artlist, Soundstripe, AudioJungle): cheap,
  fast, and the licence is the trap. Most "content creator" tiers explicitly do
  **not** cover embedding in software. You need an app/game-embedding or
  "Extended"/"Music Broadcast" licence. Budget **\$200–\$600** for five tracks
  with the right licence, and read the licence.
- **Commission a game composer:** \$300–\$800 per loop → **\$1.5k–\$4k** for
  five. This is what makes a kids' app feel like a brand.
- **Extend your own synth:** free. `build-sfx.mjs` already has a MIDI note table
  and envelope generators and makes melodic content in a major key (`bell`,
  `sparkle`, `correct`, `fanfare`). It could produce a serviceable chiptune bed
  for the *activity* cue, which must be unobtrusive anyway. It will not produce a
  station theme anyone hums. Do not pretend otherwise.

**Cost:** 2 days engineering (bus + crossfade + ducking + settings) + \$200–\$4k
and 1–3 weeks lead time for the assets, depending on route.

### Voice: TTS is not a shippable character voice
Captain Bea, Rookie and the neighbours speak through `expo-speech` with a
pitch/rate signature each (`src/services/speech.ts:10-14`). It is free, offline,
covers both languages, and the module itself is well built — the "utterance
epoch" mechanism that stops a cancelled line reappearing over the next screen is
a genuinely good piece of engineering.

It is still not a character voice:
- **It does not perform.** No cadence, no warmth, no timing. For a five-year-old
  the voice *is* the character, and a synthetic read makes Captain Bea furniture.
- **It is a different person on every device.** iOS Siri voices, Android's
  bundled engine, and a Samsung device's own TTS produce three different Beas.
  You cannot art-direct that.
- **The Spanish may silently not be Spanish.** `Speech.speak(text, { language:
  'es-MX' })` is called unconditionally and
  `Speech.getAvailableVoicesAsync()` is never called anywhere. On Android without
  the es-MX voice data installed the utterance is dropped or read with English
  phonology — "el camión" pronounced as English. Spanish is a *taught subject*
  here; mispronounced Spanish is worse than silent Spanish. **This is a defect,
  not a polish item.** (`NATIVE.md §5.4`, still open.) Probe once at startup,
  fall back `es-MX → es-US → es-ES`, and if none exists, tell the parent in the
  Grown-Ups sheet rather than teaching a child the wrong word. **1 day.**

**What recorded VO would cost.** Counted from the content:

| Source | Lines |
| --- | --- |
| Mission dialogue (`src/content/missions/*.ts`, 17 missions) | **402** |
| Recipe dialogue (`src/content/recipes.ts`, 18 recipes) | **93** |
| Vocabulary, both languages (291 words × 2) | **582** |
| Onboarding, celebrations, fixed hint lines | ~50 |
| **Total fixed, recordable** | **~1,130** |

Generated task lines (the `TaskBar` instruction, which embeds numbers from the
challenge) cannot be pre-recorded as fixed clips and should stay on TTS, or be
built concatenatively. Roughly 20 activity screens feed that bar.

Rates: a competent non-union game VO artist records 150–250 short lines per hour
and charges \$250–\$600/hour plus a buyout. Three voices (Bea, Rookie, and a
native es-MX speaker for the Spanish half — do **not** have an English speaker
read the Spanish).

- **Full coverage (~1,130 clips):** \$4k–\$9k, 5–8 studio hours across three
  artists, 2–3 weeks including casting and revisions.
- **High-traffic set (~350 clips):** onboarding, the ~40 most-heard Bea
  reactions and hints, all 291 vocabulary words in Spanish only (the half that
  teaches), and the first six missions. **\$1.5k–\$3k.** This is the right first
  purchase.

Plus **2–3 days engineering**: a `voice.ts` that plays a clip when one exists for
a line id and falls back to TTS otherwise, a manifest generated from the content
files, and a lint that flags a recorded line whose text has since changed.
Bundle cost is small: 1,130 clips at ~1.5 s, 48 kbps mono AAC ≈ 10 MB.

### Volume, mute, and the audio session
- **There is no volume control anywhere.** `sfx.setVolume()` exists at
  `src/services/audio.ts:132` and is **called from nothing**. The Grown-Ups sheet
  offers on/off toggles only: Sound effects, Character voices, Haptics, Reduce
  motion. Separate SFX / music / voice sliders are table stakes for a kids' app
  a parent sits next to. **0.5 day** once the music bus exists.
- **Silent switch:** `setAudioModeAsync({ playsInSilentMode: true })` is correct
  for a game, and `NATIVE.md §5.2` — which lists "the first sound of the session
  is dropped on a locked-ringer iPhone" as an open red risk — **is stale**. The
  code now holds the audio-mode promise in `ready` and chains every one-shot
  behind it (`audio.ts:100-110, 136-157`). That risk is fixed.
- **Background audio:** `shouldPlayInBackground` defaults to `false` and is not
  overridden. Correct — Apple rejects unnecessary background audio.
- **Interruptions are the real hole.** The session is configured
  `interruptionMode: 'mixWithOthers'`. expo-audio's own documentation says of
  that mode: *"On Android, this means no audio focus is requested… note that
  your app won't receive audio focus loss callbacks (for example, during phone
  calls) when using this mode."* For SFX-only that is the right, polite choice —
  a parent's podcast keeps playing. **The moment you add music it is the wrong
  choice**: your station theme will play on top of their podcast, and on Android
  you get no callback when a phone call starts. Music needs `duckOthers`, or a
  deliberate split (SFX mix, music duck).
- **There is no `AppState` listener anywhere in the codebase.** Not one. So:
  nothing re-applies the audio session when the app returns from a phone call
  (on iOS the session is deactivated by the interruption and expo-audio does not
  reliably reactivate it — the classic symptom is *all sound is dead for the rest
  of the session*); nothing stops the `engine` / `water-spray` loops on
  background; nothing stops `expo-speech` mid-line; the shift timer keeps
  running while the app is closed. `NATIVE.md §6.10` lists backgrounding as
  needing hardware — worth being blunt that there is no code to test.
  **1 day** for an `AppState` handler that re-inits audio on foreground, stops
  loops and speech on background, and pauses the mission clock.

**Files:** `src/services/audio.ts`, `src/services/speech.ts`, `app/_layout.tsx`,
`src/state/store.ts:57`, `src/screens/GrownUps/GrownUpsScreen.tsx`

---

## Engineering

### E1 · A cold-start deep link skips onboarding entirely
`hydrated` is read in exactly one place: `app/index.tsx:10`. Every other route —
including `app/mission/[id].tsx`, `app/training/[kind].tsx`, `app/kitchen/[recipe].tsx`
— renders immediately. So `stationspark://mission/clock-tower-cat` on a fresh
install drops a child straight into a mission, generated for the **default** age
band B (7–8) against a profile named "Rookie", and then the store hydrates
underneath. Both schemes are registered on both platforms
(`Info.plist` `CFBundleURLSchemes`, `AndroidManifest` intent-filter) and neither
has ever been tested.

**Fix:** a shared `useRequireOnboarding()` guard, or an `onboarded`/`hydrated`
check in `app/_layout.tsx` that holds the router until the store is ready.
**3 hours.**

### E2 · A shift that is interrupted stays "active" forever
`shift` is persisted (`store.ts` `partialize`), and `FirehouseScreen.tsx:112`
reads `shift.active` from the store. The XState shift actor is a module-level
singleton that resets on process start. Kill the app mid-shift and the Firehouse
shows an active shift while the machine is idle, permanently, until a shift
happens to complete. (`AUDIT.md` H4 fixed the *completion* path; this is the
*restart* path.) **Fix:** clear `shift` in `onRehydrateStorage`, or derive
`active` from the machine. **1 hour.**

### E3 · Persistence is sound. Corrupt saves lose data quietly.
I read `mergePersisted` (`src/state/store.ts:173-207`) closely and it is
genuinely well built: every slice is re-based over the fresh defaults, arrays are
type-checked before they are trusted, and a missing field falls back to what a
new player would have. `version: 1` and a `migrate` hook are in place. This will
survive schema changes.

Two notes:
- If the stored JSON is *malformed* (not just old), zustand's parse throws,
  `onRehydrateStorage` still sets `hydrated: true`, and the app runs on defaults.
  That is the right failure mode — no crash — but the child silently loses every
  badge with no message. A one-line "we couldn't find your progress" card would
  be kind. **2 hours.**
- `mergePersisted` lines 180–181 have `...current, ...current` — harmless duplication,
  but it reads like an unfinished edit.

### E4 · Accessibility: broad coverage, never once tested with a screen reader
Measured across `src/`: 151 `accessibilityLabel`, 89 `accessibilityRole`, 14
`accessibilityState`, **9** `accessibilityHint`, **0** `accessibilityLiveRegion`,
**0** `announceForAccessibility`. Reduced motion is done properly — one process-
wide `AccessibilityInfo` listener behind `useSyncExternalStore`
(`src/hooks/useReducedMotion.ts`), respecting both the OS setting and the in-app
toggle, consumed in ~100 places.

What is missing:
- **Nobody has run VoiceOver or TalkBack on this app.** Coverage is not
  correctness; focus order, focus traps and the reading of a drag-and-drop board
  are only findable by using it. Apple does check.
- **Nothing is announced.** Score changes, progress dots, "correct!", the hint
  bubble appearing — a screen-reader user gets no notification of any of it. That
  is what `accessibilityLiveRegion` / `announceForAccessibility` are for.
- **Dynamic Type is capped per variant** (`src/ui/Text.tsx:26`,
  `fontScaleCap`), 1.05 for big numerals up to 1.5 for tiny text. Reasonable, but
  a child on the largest accessibility text size is capped tighter than they may
  need on exactly the variants that carry the maths.
- **No contrast audit has been run** over the palette. `AUDIT.md` verified that
  state is never colour-alone; it did not measure ratios.

**Cost:** 3–5 days for a proper device pass on both platforms.

### E5 · Performance risks on a low-end Android tablet
Nothing here has been measured; all of it is reasoning from the code.
- **Skia allocates per frame on the UI thread.** `Skia.Path.Make()` inside
  `useDerivedValue` worklets in `src/world/props/WaterGauge.tsx` (three paths per
  frame) and `src/world/props/HoseRig.tsx` (several, 54 circles each). On native
  these run on the worklet runtime where each `SkPath` is a JSI host object
  holding C++ memory. These are the two components a child holds a finger on
  longest. (`NATIVE.md §5.8`.)
- **The 3D path is entered on every device with no evidence it works.**
  `src/three/webgl.ts:22` returns `true` unconditionally on native, so
  `ThreeBoundary` starts un-tripped and the Garage turntable, the badge flip and
  the Truck Run road all mount a real `expo-gl` context. `three` r185 requires
  WebGL 2; `expo-gl`'s WebGL 2 surface is a shim and gaps in it show up as a
  black canvas, not a catchable exception. Add a real
  `GLView.createContextAsync()` probe at startup. (`NATIVE.md §5.7`.)
- **`Stage.native.tsx` sets no `dpr` clamp** while `Stage.tsx` clamps web to
  `[1, 2]`. A 3× phone renders the Truck Run road at full native resolution.
  This is the most likely single cause of an iOS/Android frame-rate gap.
- **33 `AudioPlayer` objects accumulate for the process lifetime** and are never
  released, and one player per sound means two taps 80 ms apart cut each other
  off rather than overlapping. A pool of 2–3 round-robined players per name is
  the usual shape. (`NATIVE.md §5.3`, `AUDIT.md` L11 — still open.)
- **~2 MB of dead font ships in the binary.** `app/_layout.tsx` imports named
  weights from the `@expo-google-fonts/fredoka` and `/nunito` package roots,
  which `require()` every weight *and every italic* the packages contain
  (`nunito` alone is 4 MB on disk). Import the specific sub-paths, or embed the
  six faces at build time via the `expo-font` plugin's `fonts` option — which
  also removes the runtime font-load failure path entirely. **2 hours.**
  (`NATIVE.md §5.6`; note the *hang* half of that risk is already **fixed** —
  `_layout.tsx:62` now renders on `fontsLoaded || fontError`.)

### E6 · Nothing has ever run on hardware
`docs/NATIVE.md §6` lists ten things that need a device. All ten are still open,
and the two that matter most are: **no haptic in this app has ever fired**
(`services/haptics.ts` is a no-op on web, so every "motion + sfx + haptic"
pairing in the design is unverified end to end), and **the entire `expo-gl` 3D
path is unexecuted**.

Add to that list, now that the code has moved: **audio interruption recovery**
and **landscape** (B4).

### E7 · Stale risk registers
`docs/NATIVE.md` marks risks 2 (first sound dropped on a silent iPhone) and 6
(font failure hangs the splash) as open. **Both are fixed in the current code**
— `audio.ts:100-110` chains behind the audio-mode promise, `_layout.tsx:62`
renders on `fontsLoaded || fontError`. Risks 3, 4, 7, 8, 9, 10 and 11 remain
genuinely open. A risk register that is wrong in the safe direction is how
someone gets hurt; someone should do a pass. **1 hour.**

---

## Product

### P1 · Nothing in the app tells a grown-up what it teaches
`docs/CURRICULUM.md` is 17,000 words of well-organised curriculum design and
**none of it is surfaced in the app**. The Grown-Ups Report Card
(`src/screens/GrownUps/parts/ReportCard.tsx`, 153 lines) shows five counters,
skill bars and mission stars. That is a scoreboard, not an answer to "what is my
child actually learning, and is this worth keeping installed?"

This is the highest-leverage retention feature in the whole product for a paid
kids' learning app, and the mastery data behind it is now trustworthy enough to
build on (it was arithmetically a constant until `AUDIT.md` H2 was fixed).

**Build:** a "this week" view — skills practised, words learned with their
Spanish, the missions played, and one plain sentence per skill area explaining
what it is for. **3–4 days.**

### P2 · The UI is English-only, in a bilingual app
There is no i18n infrastructure of any kind — no `expo-localization`, no i18n
library, no string catalogue. Every UI string is a hardcoded English literal.

The app *teaches* Spanish. The families most likely to buy a bilingual
English/Spanish learning app are Spanish-speaking families, and they get an
English-only interface, English-only onboarding, and an English-only parent
dashboard. It also means one market: US/UK/AU/CA English.

**Cost:** extracting the strings is the work — call it **5–8 days** for
extraction + a catalogue + `expo-localization` wiring, plus translation (~\$0.10–
0.20/word; the UI is maybe 4,000 words → \$400–\$800). This is post-launch work,
but it is the single biggest expansion of addressable market available, and it
gets more expensive every week the string count grows.

### P3 · One profile per device
The store holds a single `profile` object under one AsyncStorage key. Siblings
share a save, an age band, a rank and a badge wall. At any premium price point
parents expect two or three profiles; a 6-year-old and a 9-year-old sharing one
age band is a bad experience for both.

**Cost:** 3–5 days — namespace the persisted slice by profile id, add a picker on
launch, migrate the existing single save into slot 1. Doing it *after* launch
means writing a migration for real users' data; doing it before is cheaper.

### P4 · Monetisation is undecided and unimplemented
There is no IAP code, no purchase library, no paywall, no price. This is a
decision, not a bug — but it has Kids-Category consequences:
- **Paid up front** is the cleanest fit for the Kids Category and needs **zero
  code**. Given the app has no accounts, no server and no recurring cost, this is
  the obvious v1. \$4.99–\$7.99 is the band for a title with this much content.
- **Free + IAP unlock**: allowed, but in the Kids Category every purchase flow
  must sit behind a parental gate (yours would qualify), and you take on
  StoreKit/Play Billing, restore-purchases, and a family-sharing story.
  **5–8 days.**
- **Subscription**: hardest to justify with no server-side content pipeline, and
  the most scrutinised by both reviewers and parents.
- **Ads: not an option.** Kids Category and Families policy both effectively rule
  out the ad networks worth having.

### P5 · No screen-time controls and no session shape
There is nothing that ends a session, suggests a break, or reports time played.
Not a store requirement, but it is the first thing a considered parent looks for,
and it is a strong App Store editorial signal for a Made-for-Kids title.
`expo-keep-awake` is already a dependency and is **called from nowhere** —
a mini-game a child reads for two minutes is exactly where `useKeepAwake()`
belongs. **2 days** for a "play for 15/30/45 minutes then Captain Bea says
goodnight" setting.

---

# NICE TO HAVE

| Item | Why | Cost |
| --- | --- | --- |
| **Adaptive icon safe zone** — measured: the art in `assets/android-icon-foreground.png` is a 600×526 bbox in a 1024 canvas (58.6% wide, inside the 66.6% safe *square*), but its corners sit at radius 401 px against a **341 px** circular-mask radius. On a Pixel's circle mask the red badge's corners clip. Re-export at ~85% scale. | polish | 30 min |
| **Monochrome / themed icon** for Android 13+ (`android.adaptiveIcon.monochromeImage`). Absent, so themed launchers fall back to the colour icon. | polish | 1 h |
| **`expo-updates` / OTA** — not installed, and `expo.modules.updates.ENABLED=false` in the manifest, yet `eas.json` declares a `channel` on every profile. Without it every hotfix is a full store review (24 h–3 days). With it, a JS-only fix ships in minutes. Worth having before launch, not after. | ops | 0.5 day |
| **App preview video** — converts well for kids' apps; you already have a headless harness that can drive a full mission. | marketing | 1–2 days |
| **Progress export / email report** for parents. | retention | 2 days |
| **`globalThis.__SS_CHALLENGE__`** ships in production web builds (`AUDIT.md` L3) — gate on `__DEV__`. | hygiene | 15 min |
| **`app/dev/*` code still ships in the bundle** even though `app/dev/_layout.tsx` correctly redirects on `!__DEV__`. The guard is right; the dead weight is a few hundred KB. | hygiene | 2 h |
| **CI does not gate this branch.** `.github/workflows/ci.yml` runs typecheck, lint, tests and a web export — but only on `push` to `main` and on PRs. It runs no native build and no EAS build. | ops | 0.5 day |
| **`SplashScreen.hideAsync()` is not gated on `hydrated`** (`NATIVE.md §5.10`) — on a slow device the child sees an empty station for a few frames before their name and badges appear. One line in `_layout.tsx`. | polish | 15 min |
| **Mission title "Pizza Shop Panic"** is the most alarming word in the app's copy, on a dispatch slip a 5-year-old reads (`AUDIT.md` L10). "Pizza Shop Rush" costs nothing. | copy | 5 min |
| **Teacher Approved** (Play) submission after launch. | marketing | 0.5 day |

---

# Realistic timeline to a submittable build

One full-time engineer, plus a producer/designer for the store work, plus money
for audio. Weeks run in parallel where they can.

**Week 0 — start today, these have external waits**
- Apple Developer Program enrolment (\$99/yr) and Google Play developer account
  (\$25 + identity verification). Days of wait, not hours.
- Decide the tablet question (B4) and the monetisation question (P4). Everything
  downstream branches on both.
- Brief the music (5 loops) and, if you're doing it, cast the VO. 1–3 weeks lead.

**Weeks 1–2 — make it exist on a phone**
- First EAS build, both platforms. Budget the whole of week 1 for this and be
  pleasantly surprised if it takes two days. (B1)
- Device pass: first launch, audio with the ringer switch off, the `expo-gl` 3D
  path on a real Android, haptics, safe areas on a notched iPhone and on Android
  with three-button nav, deep links, background/foreground. (E6)
- Fix what that finds. Assume a week of it.
- Root error boundary, crash channels, source maps. (B5)
- `ITSAppUsesNonExemptEncryption`, version → 1.0.0, `allowBackup` decision,
  hardcoded version string. (B6, B7, B8)

**Weeks 2–3 — the tablet decision, executed**
- Either one day of config, or a week of landscape layout work across 20 screens.
  (B4)

**Weeks 3–4 — audio**
- Music bus, crossfade, ducking, `settings.music` wired, volume sliders. (2 days)
- `AppState` handler: audio session recovery, loop and speech teardown, mission
  clock pause. (1 day)
- `es-MX` voice probe and fallback. (1 day)
- Drop the music in when it arrives; splash sound; navigation sound consistency.
- Recorded VO, if bought, lands here — 2–3 days to wire the clip/TTS fallback.

**Week 4 — accessibility and the parent**
- VoiceOver and TalkBack pass on both platforms; live regions; hints. (3–5 days)
- The Grown-Ups progress view built from `CURRICULUM.md`. (3–4 days — this one
  can slip past launch if it must, but it shouldn't.)

**Weeks 4–5 — store, in parallel with the above**
- Screenshots at every required size, feature graphic, icon upload. (B3)
- Description, subtitle, keywords, what's new.
- Kids Category opt-in and age band; age rating questionnaire; privacy label.
- Play target-audience declaration, Families self-certification, Data Safety.
- Privacy policy and support pages published; in-app link behind the gate. (B2)

**Week 5 — beta**
- TestFlight internal, then external with 10–20 real families. Play internal
  testing track in parallel. This is the only way you find out whether a
  five-year-old can actually use it, and it takes a week you cannot compress.

**Week 6 — submit, and budget a rejection**
- First submission. Kids Category reviews are slower and stricter than average.
  Assume one round trip on something small — a missing gate, a description that
  implies data collection, an age-rating answer.

**Total: 5–7 weeks to a submitted build.** Compress to **3–4 weeks** by dropping
tablet support, shipping TTS with only the `es-MX` fix, and buying library music
instead of commissioning it — you would still have a real product, just a less
distinctive one.

The one thing not to compress: **week 5**. Everything in this document is
reasoned from source. None of it is a substitute for watching a child use it.
