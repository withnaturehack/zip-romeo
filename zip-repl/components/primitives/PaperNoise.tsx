// RJ-APP/components/primitives/PaperNoise.tsx
import { Image, StyleSheet } from 'react-native';
const noise = require('@/assets/paper-noise.png');

export function PaperNoise() {
  return (
    <Image
      source={noise}
      style={styles.noise}
      resizeMode="repeat"
    />
  );
}

const styles = StyleSheet.create({
  noise: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.05,
    pointerEvents: 'none',
  },
});
