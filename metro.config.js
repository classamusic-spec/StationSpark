const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Allow Skia's CanvasKit wasm to be bundled for the web target.
config.resolver.assetExts = Array.from(new Set([...config.resolver.assetExts, 'wasm']));

module.exports = config;
