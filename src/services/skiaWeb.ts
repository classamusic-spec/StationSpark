/**
 * Load Skia's WebAssembly runtime — WEB.
 *
 * This exists as a platform-split module for one reason: a `Platform.OS` check
 * around the import is not enough. Metro resolves `import()` **statically**, so
 * a bare `await import('@shopify/react-native-skia/lib/module/web')` inside a
 * web-only branch still pulls canvaskit's Emscripten glue into the *native*
 * bundle, and that glue `require`s Node's `fs`. Metro then refuses to build, so
 * `expo run:android`, `expo run:ios` and every EAS build fail — the whole app,
 * on both phones, over one line that never runs there.
 *
 * Splitting the specifier into `.ts` / `.native.ts` makes it disappear from the
 * native graph entirely, the same way `Stage.tsx` / `Stage.native.tsx` do for
 * the 3D canvas. Do not "fix" this by hiding the specifier in a variable: that
 * gets past Metro and then dies inside Hermes instead.
 */
export async function loadSkia(): Promise<void> {
  const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
  await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
}
