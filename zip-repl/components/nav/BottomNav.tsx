// RJ-APP/components/nav/BottomNav.tsx — Animated bottom navigation bar
import { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { LinearGradient } from 'expo-linear-gradient';

export const NAV_H = 58;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconHome({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
function IconJuliet({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth={1.4} />
      <Path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M5.6 5.6l1.4 1.4M16.9 16.9l1.4 1.4M5.6 18.4l1.4-1.4M16.9 7.1l1.4-1.4" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}
function IconEnvelope({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke={color} strokeWidth={1.4} />
      <Path d="M3 7l9 7 9-7" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function IconJournal({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3h14a1 1 0 011 1v16a1 1 0 01-1 1H4" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M4 3a2 2 0 000 4m0-4a2 2 0 010 4m0 0v14" stroke={color} strokeWidth={1.4} />
      <Path d="M8 8h7M8 12h7M8 16h4" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}
function IconProfile({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.4} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Tab definition ───────────────────────────────────────────────────────────
type Tab = {
  key: string;
  label: string;
  route: string;
  icon: (color: string, size?: number) => React.ReactNode;
  matchPaths: string[];
};

const TABS: Tab[] = [
  { key: 'home',    label: 'Home',    route: '/(main)/home',    icon: (c, s) => <IconHome    color={c} size={s} />, matchPaths: ['/(main)/home', '/home'] },
  { key: 'juliet',  label: 'Juliet',  route: '/(conversation)/voice',  icon: (c, s) => <IconJuliet  color={c} size={s} />, matchPaths: ['/(conversation)/voice', '/voice'] },
  { key: 'letters', label: 'Letters', route: '/(letter)/letter', icon: (c, s) => <IconEnvelope color={c} size={s} />, matchPaths: ['/(letter)/', '/letter', '/envelope'] },
  { key: 'journal', label: 'Journal', route: '/(main)/journal',  icon: (c, s) => <IconJournal color={c} size={s} />, matchPaths: ['/(main)/journal', '/journal'] },
  { key: 'profile', label: 'Profile', route: '/(main)/profile',  icon: (c, s) => <IconProfile color={c} size={s} />, matchPaths: ['/(main)/profile', '/profile'] },
];

// ─── Single tab button ────────────────────────────────────────────────────────
function TabButton({ tab, isActive, onPress }: { tab: Tab; isActive: boolean; onPress: () => void }) {
  const { c, f } = useRJTheme();
  const scale    = useRef(new Animated.Value(1)).current;
  const labelOp  = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const dotScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const iconTransY = useRef(new Animated.Value(isActive ? -2 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(labelOp,    { toValue: isActive ? 1 : 0, speed: 20, bounciness: 0, useNativeDriver: false }),
      Animated.spring(dotScale,   { toValue: isActive ? 1 : 0, speed: 22, bounciness: 4, useNativeDriver: false }),
      Animated.spring(iconTransY, { toValue: isActive ? -2 : 0, speed: 18, bounciness: 3, useNativeDriver: false }),
    ]).start();
  }, [isActive]);

  const handlePress = () => {
    Haptics.selectionAsync();
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, speed: 40, bounciness: 0, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1,    speed: 18, bounciness: 5, useNativeDriver: false }),
    ]).start();
    onPress();
  };

  const activeColor   = c.forest;
  const inactiveColor = c.inkMuted as string;
  const color = isActive ? activeColor : inactiveColor;

  return (
    <Pressable onPress={handlePress} style={styles.tabBtn}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }, { translateY: iconTransY }] }}>
        {tab.icon(color, 21)}
        <Animated.Text style={{
          fontFamily: f.mono, fontSize: 6.5, letterSpacing: 0.8,
          color: activeColor, textTransform: 'uppercase', marginTop: 4,
          opacity: labelOp,
        }}>
          {tab.label}
        </Animated.Text>
        <Animated.View style={{
          width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: activeColor,
          marginTop: 3,
          transform: [{ scale: dotScale }],
          opacity: dotScale,
        }} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Main BottomNav ───────────────────────────────────────────────────────────
export function BottomNav() {
  const { c } = useRJTheme();
  const insets  = useSafeAreaInsets();
  const path    = usePathname();
  const slideUp = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    Animated.spring(slideUp, {
      toValue: 0, speed: 14, bounciness: 5, useNativeDriver: false,
    }).start();
  }, []);

  const getActiveKey = () => {
    for (const tab of TABS) {
      if (tab.matchPaths.some(p => path?.includes(p.replace('/(main)','').replace('/(conversation)','').replace('/(letter)','')))) {
        return tab.key;
      }
    }
    return 'home';
  };
  const activeKey = getActiveKey();

  const navigate = (tab: Tab) => {
    router.push(tab.route as never);
  };

  return (
    <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
      <LinearGradient
        colors={[`${c.bg}00`, c.bg]}
        style={{ height: 14, pointerEvents: 'none' }}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <View style={[styles.nav, {
        backgroundColor: c.bgCard,
        borderTopColor: c.ruleSoft,
        paddingBottom: Math.max(insets.bottom, 10),
        height: NAV_H + Math.max(insets.bottom, 10),
      }]}>
        {/* Subtle top line */}
        <View style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 0.5, backgroundColor: c.gold, opacity: 0.18 }} />
        {TABS.map(tab => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={activeKey === tab.key}
            onPress={() => navigate(tab)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingTop: 10,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2,
  },
});
