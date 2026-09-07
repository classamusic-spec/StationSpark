# Station Spark — what is missing before the App Store

Written against the state of the repo at the time of the AAA polish pass. Every
claim here was checked against the code, not assumed. Where something is already
done I say so, because knowing what you *don't* have to build is half of a
launch plan.

---

## 1. Audio — the biggest content gap by some distance

### SFX — done, and genuinely good
33 sound effects live in `assets/sfx/` (2 MB). They are **procedurally
synthesised** by `tools/sfx/build-sfx.mjs` from a seeded PRNG, so a rebuild is
byte-identical and the whole library regenerates with `npm run sfx:build`. House
style is enforced in the tool: bright, toy-like, short, major key, nothing that
reads as "you failed". Loops (`engine`, `water-spray`, `ticktock`) are handled
separately at half the sample rate.

This is finished work. Do not replace it.

### Music — **entirely absent**
There is no score, no ambience bed, no menu theme, no mission music. Between
sound effects the app is silent. For a children's game this is the single most
noticeable absence, and it is the thing that most separates "a good prototype"
from "a product a five-year-old wants to open again".

What you need:

| Cue | Length | Where |
| --- | --- | --- |
| Station theme (warm, hummable) | 60–90 s loop | Home, Locker, Badges |
| Activity bed (low, no melody competing with speech) | 60 s loop | inside a mini-game |
| Dispatch / urgency | 30 s loop | Dispatch board, travel cinematic |
| Kitchen | 60 s loop | Firehouse Kitchen |
| Win sting | 3–4 s | mission and recipe completion |

**The audio service cannot play music today.** `src/services/audio.ts` is a
one-shot + loop SFX service with a single master volume. Music needs: a separate
bus with its own volume, a crossfade between cues on navigation, and **ducking**
— music must drop under `speech.say()` and under any SFX, or Captain Bea becomes
unintelligible. That is real engineering work, not just assets.

Sourcing: license royalty-free kids' music, commission ~5 loops, or extend the
existing synth — it already makes melodic content in a major key (`bell`,
`sparkle`, `correct`), so a simple theme is within reach of the tool you have.

### Voice — TTS only, no recorded VO
Captain Bea and Rookie speak through `expo-speech` (on-device TTS) with a
pitch/rate signature per character. It is free, offline, and covers both
languages — a sound engineering choice for a prototype. It is **not** a shippable
character voice:

- It does not sound like a character. Cadence and emphasis are wrong for a
  five-year-old, and there is no performance.
- **Quality varies wildly by device.** The same line is a different "person" on
  an iPhone and a Pixel.
- **`es-MX` may simply not be installed** on the device. `src/services/speech.ts`
  never checks. When it is missing, the Spanish half of every vocabulary pair
  silently does nothing — the app stops teaching Spanish and says nothing about it.
  This is a real defect, not just a polish item.

For a premium feel, record the fixed lines: the greeting, mission briefs, recipe
steps, the three-rung hint ladder, celebration lines, and **every vocabulary word
in both languages**. Generated challenge text can stay on TTS. Budget roughly
600–900 lines for full coverage, or ~200 for the high-traffic set.

---

## 2. Native build and device testing

- The hard blocker recorded as risk #1 in `docs/NATIVE.md` — *the native bundle
  does not build at all* — **is fixed.** The Skia web loader is now split
  `src/services/skiaWeb.ts` / `.native.ts`, so Metro no longer drags Node `fs`
  into the native bundle. `docs/NATIVE.md` is stale on this point.
- Risk #5 (`Speech.stop()` immediately before `speak()` dropping the new line on
  Android) is also fixed.
- **Nobody has run this on a phone.** No iOS device run, no Android device run.
  The EAS config (`eas.json`) is correct and complete — development, preview and
  production profiles, AAB for Play, store distribution — but has never been run.
- **The 3D path has never executed on a device.** `src/three/webgl.ts` returns
  `true` on native unconditionally, so Truck Run and the Garage badge attempt
  react-three-fiber over `expo-gl` with no fallback and no evidence it works or
  performs. This is the highest-risk unknown in the app.
- Untested: audio focus, interruption by a phone call mid-mission,
  background/foreground transitions, and the iOS silent switch.

---

## 3. Store listing assets — none exist

Nothing in `assets/` is a store asset. You need:

**App Store** — screenshots at 6.7" and 6.5" iPhone, plus 12.9" iPad (you ship
iPad: `supportsTablet: true`), 3–10 per size. App preview video optional but it
converts well for kids' apps. Subtitle, keywords, promotional text, description.
Icon must be 1024×1024 **with no alpha channel** — check `assets/icon.png`.

**Google Play** — feature graphic 1024×500, phone screenshots, and 7" *and* 10"
tablet screenshots (required for the Designed for Families programme).

---

## 4. Legal and compliance — this is what actually blocks submission

The app targets under-13s, so it lands in the **App Store Kids Category** and
**Google Play Designed for Families**. Both have hard gates:

- **Privacy policy URL — mandatory, and there is none.** Not in the repo, not in
  `app.json`, not in the app. This alone blocks submission. You need it even
  though the app collects nothing.
- **Support URL** and a marketing URL.
- **Data safety form** (Play) and **Privacy Nutrition Label** (App Store). Your
  answer is "no data collected", and it is defensible: I searched the whole of
  `src/` and found **zero network calls** — no `fetch`, no WebSocket, no
  analytics, no ads, no IAP, no third-party SDKs. Every dependency is Expo,
  React Native, or a rendering library. That is unusually clean for a kids' app.
  Say so in the listing; it is a selling point.
- **COPPA** — the child's name lives in AsyncStorage on device and there is no
  code path that could transmit it.
- **Age rating questionnaire** — 4+ / Everyone.
- **Parental gate** — you have one (`src/screens/GrownUps/ParentGate.tsx`: a
  randomised arithmetic question behind a keypad). Apple requires it on anything
  that leaves the app or spends money. It currently guards the Grown-Ups area;
  when you add a privacy-policy link or a store link, it must guard those too.
- **iOS export compliance** — add `ITSAppUsesNonExemptEncryption: false` to
  `app.json` → `ios.infoPlist`, or you will be asked at every single submission.
- **Apple privacy manifest** (`PrivacyInfo.xcprivacy`) — required since May 2024.
  AsyncStorage uses a declared-reason API (`UserDefaults`). Expo generates a
  manifest during prebuild; verify it lists the right reason codes.
- `app.json` version is **`0.1.0`**.

---

## 5. Product gaps

- **Nothing tells a grown-up what this teaches.** `docs/CURRICULUM.md` exists and
  is good; none of it is surfaced in the app. A parent deciding whether to keep
  this installed has no answer.
- **No progress report.** The Grown-Ups screen has counters, not a "what did they
  practise this week" view. This is the #1 retention feature for a paid kids'
  learning app.
- **One profile.** Siblings share a save. Multi-profile is table stakes here.
- **No settings** for music volume vs SFX volume, speech on/off, text size, or an
  explicit reduce-motion toggle. Reduced motion *is* respected in 101 places in
  code — it just follows the OS and cannot be set in-app.
- **No "continue where you left off"** beyond the shift counter.

---

## 6. Accessibility

- 140 `accessibilityLabel` and 85 `accessibilityRole` across `src/` — decent
  coverage, but **no screen-reader pass has ever been run on a device**. Coverage
  is not correctness; VoiceOver order and focus traps are only findable by using it.
- Font scaling is capped per text variant via `maxFontSizeMultiplier` (1.05 for
  big numerals up to 1.5 for tiny text). A child using large-text settings may
  still be capped tighter than they need on the numeral variants.
- Tap targets are a documented house rule (≥ 56 px) and are broadly respected.

---

## 7. Testing

**Strong for a web/unit surface:**
- 1010 unit tests across 27 suites.
- A Playwright play-harness (`tools/qa/play.mjs`) drives all 27 mini-games, 3
  missions, 2 recipe runs and the whole shift flow to completion in headless
  Chromium — 33/33 passing with zero console issues.
- Character art is proven pixel-identical to the authored SVG by
  `npm run art:verify`.

**Entirely absent:**
- Native tests. Device tests. Screen-reader tests.
- Performance profiling on a low-end phone — the app draws a *lot* of SVG, and
  nobody has measured frame time on hardware.
- No CI. Nothing runs these checks automatically on push.

---

## Priority order if it were mine

1. **Privacy policy + support URL.** Cheapest thing on this list and it is a hard
   submission blocker.
2. **Run it on a real iPhone and a real Android phone.** Everything below is
   guesswork until this happens — especially the 3D path.
3. **Music, with a ducking bus.** Biggest felt improvement per unit of work.
4. **Recorded VO for the ~200 highest-traffic lines**, and fix the missing
   `es-MX` voice case so Spanish never silently stops.
5. **A grown-ups progress view** built from `docs/CURRICULUM.md`.
6. Store assets and listing.
7. Multi-profile.
