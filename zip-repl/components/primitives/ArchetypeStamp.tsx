// RJ-APP/components/primitives/ArchetypeStamp.tsx
import { Image, ImageStyle } from 'react-native';
import { Archetype } from '@/lib/archetypes';
import { useRJTheme } from '@/theme/useRJTheme';

const ASPECT = 431 / 579;

export function ArchetypeStamp({
  archetype, height = 110, color, style,
}: { archetype: Archetype; height?: number; color?: string; style?: ImageStyle }) {
  const { c } = useRJTheme();
  const tintColor = color ?? c.forest;
  return (
    <Image
      source={archetype.image}
      accessibilityLabel={archetype.name}
      style={[{ width: height * ASPECT, height, tintColor }, style]}
      resizeMode="contain"
    />
  );
}
