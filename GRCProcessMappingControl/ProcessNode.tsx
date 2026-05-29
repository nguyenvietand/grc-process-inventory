
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
} from "@mui/material";

export default function ProcessNode(props) {
  const { data, positionAbsoluteX, positionAbsoluteY } = props;

  const mode = data.mode;
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleNodeDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const raw = e.dataTransfer.types.includes("application/reactflow");

    if (raw) {
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  };

  const handleNodeDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleNodeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragOver(false);

    const raw = e.dataTransfer.getData("application/reactflow");

    if (!raw) return;

    const item = JSON.parse(raw);

    if (item.nodeType === "riskNode") {
      if (data.onDropRisk) {
        data.onDropRisk(
          data._id,
          {
            x: positionAbsoluteX,
            y: positionAbsoluteY,
          },
          item
        );
      }
    } else if (item.nodeType === "controlNode") {
      if (data.showError) {
        data.showError("Control items must be dropped onto a Risk node");
      }
    }
  };

  return (
    <>
      <Card
        onDragOver={handleNodeDragOver}
        onDragLeave={handleNodeDragLeave}
        onDrop={handleNodeDrop}
        sx={{
          width: 400,
          height: 250,
          borderRadius: "10px",
          border: isDragOver
            ? "2px dashed #d32f2f"
            : "1px solid #B4D6FA80",
          backgroundColor: isDragOver ? "#fff5f5" : "#ffffff",
          transition: "border 0.2s, background-color 0.2s",
        }}
      >
        <CardContent
          sx={{
            p: "20px",
            pb: "16px",
            textAlign: "left",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={(theme) => ({
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1.2,
                mb: 1.5,
                color: "#1a1a1a",
                fontFamily: theme.typography.fontFamily,
              })}
            >
              {data.title}
            </Typography>

            <Typography
              variant="body2"
              sx={(theme) => ({
                color: "#555",
                mb: 0.5,
                fontSize: "0.9rem",
                fontFamily: theme.typography.fontFamily,
              })}
            >
              {data.department}
            </Typography>

            <Typography
              variant="body2"
              sx={(theme) => ({
                color: "#555",
                fontSize: "0.8rem",
                fontFamily: theme.typography.fontFamily,
              })}
            >
              OWNER: {data.owner}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box>
            <Divider sx={{ mb: 2, borderColor: "#f0f0f0" }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {mode === "edit" && (
                <Typography
                  onClick={() => {
                    if (data.onOpenPanel) {
                      data.onOpenPanel("riskNode");
                    }
                  }}
                  variant="body2"
                  sx={(theme) => ({
                    color: "#d32f2f",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-block",
                    width: "fit-content",
                    fontFamily: theme.typography.fontFamily,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  })}
                >
                  + Add Risk
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "transparent",
          border: "none",
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "transparent",
          border: "none",
        }}
      />
    </>
  );
}
