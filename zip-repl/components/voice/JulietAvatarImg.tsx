import { Image, ImageStyle } from 'react-native';
const juliet = require('@/assets/juliet.png');

export function JulietAvatarImg({ size = 32, style }: { size?: number; style?: ImageStyle }) {
  return <Image source={juliet} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} resizeMode="cover" />;
}
