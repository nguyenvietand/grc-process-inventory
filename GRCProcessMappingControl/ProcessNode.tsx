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

export default function ProcessNode({ data, positionAbsoluteX, positionAbsoluteY }) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const processRisks = Array.isArray(data.risks) ? data.risks : [];

  console.log("Rendering ProcessNode with data:", data);

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
        data.onDropRisk(data._id, { x: positionAbsoluteX, y: positionAbsoluteY }, item);
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
          minWidth: 240,
          borderRadius: "12px",
          border: isDragOver ? "2px dashed #d32f2f" : "1px solid #b9b9b9",
          backgroundColor: isDragOver ? "#fff5f5" : "#ffffff",
          transition: "border 0.2s, background-color 0.2s",
        }}>
        <CardContent sx={{ p: "20px" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "1.1rem",
              lineHeight: 1.2,
              mb: 1.5,
              color: "#1a1a1a",
            }}>
            {data.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "#555", mb: 0.5, fontSize: "1rem" }}>
            {data.department}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "#555", mb: 2, fontSize: "1rem" }}>
            Owner: {data.owner}
          </Typography>

          <Divider sx={{ mb: 2, borderColor: "#f0f0f0" }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              onClick={() => {
                if (data.onOpenPanel) data.onOpenPanel("riskNode");
              }}
              variant="body2"
              sx={{
                color: "#d32f2f",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-block",
                width: "fit-content",
                "&:hover": { textDecoration: "underline" },
              }}>
              + Add Risk
            </Typography>
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
