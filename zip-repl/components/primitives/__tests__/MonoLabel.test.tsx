// RJ-APP/components/primitives/__tests__/MonoLabel.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { MonoLabel } from '../MonoLabel';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('MonoLabel', () => {
  it('applies uppercase + tracked styling', () => {
    const { getByText } = render(
      <ThemeProvider dark={false} density="comfortable">
        <MonoLabel>by referral</MonoLabel>
      </ThemeProvider>
    );
    const node = getByText('by referral');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style)
      : node.props.style;
    expect(flat.textTransform).toBe('uppercase');
    expect(flat.fontSize).toBe(9);
  });
});
