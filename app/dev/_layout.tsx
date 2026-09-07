import React from 'react';
import { Redirect, Stack } from 'expo-router';

/**
 * THE DEV GALLERY IS NOT PART OF THE SHIPPED APP.
 *
 * Every route under `app/dev/` was built for us, not for a child: a component
 * gallery, an icon sheet, a cast viewer, a Three.js scratchpad. They were all
 * going out in the production bundle and were deep-linkable, and one of them —
 * `/dev/gallery` — carries a one-tap **"Reset store"** that wipes a child's
 * entire save. The Grown-Ups screen guards the very same action behind a parent
 * gate and three confirmations, which is the standard this failed to meet.
 *
 * A layout is the right place for the guard rather than a check in each screen:
 * it covers the whole subtree, including any scratch route someone adds later
 * and forgets to remove. In a development build everything works exactly as
 * before; in a release build the entire tree is simply not reachable.
 */
export default function DevLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
