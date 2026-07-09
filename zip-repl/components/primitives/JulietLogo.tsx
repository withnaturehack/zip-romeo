// RJ-APP/components/primitives/JulietLogo.tsx
// Uses the attached Juliet portrait as the primary brand image.
import { View, Image, Text, StyleSheet } from 'react-native';
import { useRJTheme } from '@/theme/useRJTheme';

const portrait = require('@/assets/juliet-portrait.png');

type Props = {
  size?: number;
  showLabel?: boolean;
  circle?: boolean;
  style?: object;
};

export function JulietLogo({ size = 120, showLabel = false, circle = false, style }: Props) {
  const { c, f } = useRJTheme();
  const radius = circle ? size / 2 : 0;

  return (
    <View style={[style]}>
      <View style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: `${c.forest}55`,
          backgroundColor: '#1a1a14',
          overflow: 'hidden',
        },
      ]}>
        <Image
          source={portrait}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontFamily: f.serifI, color: c.forest }]}>
          Juliet
        </Text>
      )}
    </View>
  );
}

// Larger framed portrait for hero sections
export function JulietHero({ width = 260, height = 300 }: { width?: number; height?: number }) {
  const { c, f } = useRJTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.heroFrame, {
        width, height,
        borderColor: `${c.forest}40`,
        backgroundColor: '#0d0d09',
      }]}>
        <Image
          source={portrait}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {/* Olive green bottom accent */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          backgroundColor: c.forest,
        }} />
      </View>
      <Text style={{ fontFamily: f.serifI, fontSize: 13, color: c.inkMuted, marginTop: 8, letterSpacing: 0.5 }}>
        Juliet &mdash; your matchmaker
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 5,
  },
  heroFrame: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
    elevation: 8,
  },
  label: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 16,
    fontStyle: 'italic',
  },
});
