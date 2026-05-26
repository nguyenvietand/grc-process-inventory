import { createTheme } from '@mui/material/styles';
import baseTheme from './theme';

export default function createDynamicTheme(fontFamily?: string) {
  return createTheme({
    ...baseTheme,
    typography: {
      ...baseTheme.typography,
      fontFamily: fontFamily || baseTheme.typography.fontFamily,
    },
  });
}
