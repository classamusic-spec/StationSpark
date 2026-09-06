/**
 * Load Skia's WebAssembly runtime — NATIVE: there isn't one.
 *
 * On a phone Skia is a linked native library, ready the moment the app starts.
 * The whole point of this file is that the web loader's module specifier is
 * absent from the native bundle — see `skiaWeb.ts` for why that matters.
 */
export async function loadSkia(): Promise<void> {
  /* nothing to load */
}
