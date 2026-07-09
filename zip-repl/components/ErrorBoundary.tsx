import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { reloadAppAsync } from 'expo';

type State = { hasError: boolean; message: string; stack?: string };

function ErrorFallback({ message, stack }: { message: string; stack?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚠️ Error</Text>
      <Text style={[styles.msg, { color: '#cc0000', marginVertical: 16 }]}>{message}</Text>
      {stack && <Text style={[styles.msg, { color: '#999', fontSize: 10, maxHeight: 200 }]}>{stack.substring(0, 300)}</Text>}
      <Pressable style={styles.btn} onPress={() => reloadAppAsync()}>
        <Text style={styles.btnText}>Reload app</Text>
      </Pressable>
    </View>
  );
}

export class ErrorBoundary extends React.Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '', stack: '' };
    console.log('[ErrorBoundary] Mounted');
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message ?? String(error);
    const stack = error?.stack ?? 'no stack trace';
    console.error('[ErrorBoundary] getDerivedStateFromError:', msg);
    return { hasError: true, message: msg, stack };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] componentDidCatch - Message:', error?.message ?? String(error));
    console.error('[ErrorBoundary] componentDidCatch - Stack:', error?.stack ?? 'no stack');
    console.error('[ErrorBoundary] componentDidCatch - Component stack:', info?.componentStack ?? 'no component stack');
    // Update state with full stack info
    this.setState({ stack: error?.stack || '' });
  }

  render() {
    try {
      if (this.state.hasError) {
        return <ErrorFallback message={this.state.message} stack={this.state.stack} />;
      }
      return this.props.children;
    } catch (e) {
      // Fail-safe in case render itself fails
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error('[ErrorBoundary] render() failed:', errMsg);
      return (
        <View style={{ flex: 1, backgroundColor: '#990000', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>CRITICAL ERROR</Text>
          <Text style={{ color: '#fff', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{errMsg}</Text>
        </View>
      );
    }
  }
}

function WarningBoundary({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ color: '#ffaa00', fontSize: 18, fontWeight: '700', marginBottom: 10 }}>⚠️ Startup Issue</Text>
      <Text style={{ color: '#ffffff', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>{message}</Text>
      <Pressable style={{ marginTop: 24, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#4a4a4a', borderRadius: 6 }} onPress={() => reloadAppAsync()}>
        <Text style={{ color: '#ffaa00', fontWeight: '600', fontSize: 12 }}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF2E3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B2E22',
    textAlign: 'center',
  },
  msg: {
    fontSize: 12,
    color: '#5A5847',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  btn: {
    marginTop: 8,
    backgroundColor: '#2A2540',
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  btnText: {
    color: '#FBF2E3',
    fontSize: 13,
    fontWeight: '600',
  },
});
