/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    background: {
      default: '#f8fafc',
      paper: '#ffffff',   
    },
    text: {
      primary: '#0f172a', 
      secondary: '#1e293b',
    },
    
    primary: {
      light: '#e0e7ff',
      main: '#6366f1',  
      dark: '#3b35ae',
      contrastText: '#fff',
    },

    success: {
      main: '#22c55e',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, 
      },
    },
  },
});

export default theme;
