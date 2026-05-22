/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import theme from './theme';
import { FlowBoard } from './FlowTest';

export default function ChartDemoApp({ processItems, controlItems, riskItems, processDatasetFlat, onNodeAction, onProcessDatasetChange }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReactFlowProvider>
        <FlowBoard
          processItems={processItems}
          controlItems={controlItems}
          riskItems={riskItems}
          processDatasetFlat={processDatasetFlat}
          onNodeAction={onNodeAction}
          onProcessDatasetChange={onProcessDatasetChange}
        />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
