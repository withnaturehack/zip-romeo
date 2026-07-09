module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin is omitted: no screen uses Reanimated APIs —
    // all animations use React Native's built-in Animated module. The plugin
    // was injecting worklets runtime init which crashes Expo Go.
    plugins: [],
  };
};
