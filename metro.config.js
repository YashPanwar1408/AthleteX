const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable support for "exports" field so Metro picks the browser build
config.resolver = {
  ...(config.resolver || {}),
  unstable_enablePackageExports: true,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules || {}),
    // Map the "async-require" shim to Expo's provided implementation
    'async-require': require.resolve('@expo/metro-config/build/async-require.js'),
  },
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
