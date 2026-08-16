// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix: framer-motion (and other ESM packages that use tslib) fail on the
// Expo web bundler because Metro's CommonJS wrapper expects `tslib.default`
// to be defined, but tslib's CJS build exposes its exports at the top level.
// We resolve `tslib` to its explicit CJS entry point so Metro can wrap it.
config.resolver = config.resolver ?? {};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return {
      filePath: require.resolve("tslib/tslib.js"),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
