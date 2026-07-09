import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../ThemeProvider';
import { useRJTheme } from '../useRJTheme';

function Probe() {
  const { c, d, dark } = useRJTheme();
  return <Text testID="probe">{dark ? 'dark' : 'light'}|{c.bg}|{d.pad}</Text>;
}

describe('ThemeProvider', () => {
  it('provides light tokens by default', () => {
    const { getByTestId } = render(
      <ThemeProvider dark={false} density="comfortable">
        <Probe />
      </ThemeProvider>
    );
    expect(getByTestId('probe').props.children.join('')).toBe('light|#FBF2E3|20');
  });

  it('switches to dark tokens when dark=true', () => {
    const { getByTestId } = render(
      <ThemeProvider dark={true} density="compact">
        <Probe />
      </ThemeProvider>
    );
    expect(getByTestId('probe').props.children.join('')).toBe('dark|#1A1612|16');
  });
});
