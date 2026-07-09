import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { useStatus } from '@/lib/hooks';

export default function Index() {
  const { c } = useRJTheme();
  const { loading, phase } = useStatus(0);
  console.log('[Index] loading:', loading, 'phase:', phase);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <PaperNoise />
        <WaxSeal size={96} pulse />
      </View>
    );
  }

  switch (phase) {
    case 'PROFILE': return <Redirect href="/(onboarding)/profile" />;
    case 'PENDING_APPROVAL': return <Redirect href="/(onboarding)/pending" />;
    case 'APPROVED':
    case 'CHATTING': return <Redirect href="/(conversation)/voice" />;
    case 'QUESTIONNAIRE_DONE':
    case 'WAITING': return <Redirect href="/(conversation)/questionnaire" />;
    case 'LETTER_READY': return <Redirect href="/(letter)/envelope" />;
    case 'CHAT':
    case 'COMPLETE': return <Redirect href="/(main)/home" />;
    case 'REJECTED': return <Redirect href="/(auth)/rejected" />;
    default: return <Redirect href="/(auth)/welcome" />;
  }
}
