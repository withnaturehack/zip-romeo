import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Archetype } from '@/lib/archetypes';
import { ArchetypeStamp } from '@/components/primitives/ArchetypeStamp';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { useRJTheme } from '@/theme/useRJTheme';

export type ArchetypeReading = {
  archetype: Archetype;
  traits: string[];
  coreDesire: string;
  description: string;
  light: string[];
  shadow: string[];
  harmonisesWith: string[]; // names like 'The Grounded Builder'
};

export function ArchetypeCard({ reading }: { reading: ArchetypeReading }) {
  const { c, f } = useRJTheme();
  const { archetype, traits, coreDesire, description, light, shadow, harmonisesWith } = reading;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.header, { backgroundColor: c.forest }]}>
        <Text style={{ fontFamily: f.mono, color: c.bg, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
          Your archetype
        </Text>
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 8 }}>
        <ArchetypeStamp archetype={archetype} height={150} color={c.forest} />
        <Text style={{ fontFamily: f.serifI, fontSize: 30, color: c.ink, marginTop: 18, textAlign: 'center' }}>
          {archetype.name}
        </Text>
        <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, marginTop: 6, textAlign: 'center' }}>
          {archetype.sub}
        </Text>
      </View>

      <View style={[styles.pills, { paddingHorizontal: 22 }]}>
        {traits.map(t => (
          <View key={t} style={[styles.pill, { borderColor: c.gold }]}>
            <Text style={{ fontFamily: f.mono, fontSize: 9, color: c.gold, letterSpacing: 1.5, textTransform: 'uppercase' }}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 22, marginTop: 20 }}>
        <MonoLabel>Core desire</MonoLabel>
        <Text style={{ fontFamily: f.serif, fontSize: 22, color: c.ink, marginTop: 4, lineHeight: 30 }}>{coreDesire}</Text>
      </View>

      <View style={{ paddingHorizontal: 22, marginTop: 18 }}>
        <Text style={{ fontFamily: f.body, fontSize: 16, color: c.inkSoft, lineHeight: 24 }}>{description}</Text>
      </View>

      <View style={{ paddingHorizontal: 22, marginTop: 22 }}><OrnamentDivider /></View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 22, marginTop: 22, gap: 18 }}>
        <Column label="Light" items={light} color={c.forest} />
        <Column label="Shadow" items={shadow} color={c.wax} />
      </View>

      <View style={{ paddingHorizontal: 22, marginTop: 24 }}>
        <MonoLabel>Harmonises with</MonoLabel>
        <View style={[styles.pills, { marginTop: 8, paddingHorizontal: 0 }]}>
          {harmonisesWith.map(n => (
            <View key={n} style={[styles.pill, { borderColor: c.forest }]}>
              <Text style={{ fontFamily: f.mono, fontSize: 9, color: c.forest, letterSpacing: 1.5, textTransform: 'uppercase' }}>{n.replace(/^The /, '')}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Column({ label, items, color }: { label: string; items: string[]; color: string }) {
  const { c, f } = useRJTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: f.mono, color, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ marginTop: 8, gap: 4 }}>
        {items.map(it => (
          <Text key={it} style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkSoft, lineHeight: 22 }}>· {it}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: 12, alignItems: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  pill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
});
