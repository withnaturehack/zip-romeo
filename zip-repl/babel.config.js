module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin is required even though no screen calls
    // Reanimated APIs directly: expo-router, react-native-gesture-handler,
    // and react-native-screens all transitively depend on
    // react-native-reanimated/react-native-worklets. With newArchEnabled:true
    // their worklets runtime initializes at native startup regardless, and
    // without this plugin that crashes the app on real iOS/Android devices
    // (though not in the web preview, which doesn't use the native JSI
    // worklets runtime). Must be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
