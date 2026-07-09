import { useContext } from 'react';
import { RJThemeContext } from './ThemeProvider';

export const useRJTheme = () => useContext(RJThemeContext);
