/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React from "react";
import { Box, Button } from "@mui/material";

export default function NodeFooter({ onEdit, onDelete }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        borderTop: "1px solid #eee",
        pt: 1,
        mt: 2,
      }}>
      <Box>
        <Button
          size="small"
          onClick={onEdit}
          sx={(theme) => ({
            textTransform: "none",
            color: "#555",
            minWidth: "auto",
            p: "0 8px",
            fontFamily: theme.typography.fontFamily,
            fontWeight: 600,
            fontSize: '0.95rem',
            letterSpacing: 0.1,
          })}
        >
          Edit
        </Button>
        {/* Delete button hidden temporarily */}
      </Box>
    </Box>
  );
}
