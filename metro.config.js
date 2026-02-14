const { getDefaultConfig } = require('expo/metro-config');

// 1. Load the standard Expo config
const config = getDefaultConfig(__dirname);

// 2. Add 'glb' and 'gltf' to the list of known asset types
config.resolver.assetExts.push('glb', 'gltf');

// 3. (Crucial for Expo Router) Enable context modules
config.transformer.unstable_allowRequireContext = true;

module.exports = config;