/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, Typography, Box, Divider, Button } from "@mui/material";
import AddItemDialog from "./AddItemDialog";

export default function RiskNode(props) {
    // Helper to truncate description
    function truncateDescription(desc) {
      if (!desc) return '';
      return desc.length > 150 ? desc.slice(0, 150) + '...' : desc;
    }
  const { id, data, positionAbsoluteX, positionAbsoluteY } = props;
  const mode = data.mode;
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const handleNodeDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const hasData = e.dataTransfer.types.includes("application/reactflow");
    if (hasData) {
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
    if (item.nodeType !== "controlNode") {
      if (item.nodeType === "riskNode" && data.showError) {
        data.showError("Risk items must be dropped onto a Process node");
      }
      return;
    }
    if (data.onDropControl) {
      data.onDropControl(data._id, { x: positionAbsoluteX, y: positionAbsoluteY }, item);
    }
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "transparent", border: "none" }}
      />

      <Card
        onDragOver={handleNodeDragOver}
        onDragLeave={handleNodeDragLeave}
        onDrop={handleNodeDrop}
        sx={{
          //minWidth: 280,
          //maxWidth: 320,
          width: 400,
          borderRadius: "10px",
          border: isDragOver ? "2px dashed #1976d2" : "1px solid #FFC9C9",
          backgroundColor: isDragOver ? "#f0f7ff" : "#FFF7F7",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          transition: "border 0.2s, background-color 0.2s",
        }}>
        <CardContent sx={{ p: "20px", pb: "16px", textAlign: "left" }}>
          <Box
            sx={(theme) => ({
              backgroundColor: "#ffedd4",
              color: "#9f2d00",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              display: "inline-block",
              mb: 1.5,
              textTransform: "uppercase",
              fontFamily: theme.typography.fontFamily,
            })}
          >
            Risk
          </Box>

          <Typography
            variant="h6"
            sx={(theme) => ({
              fontWeight: 700,
              fontSize: "1.1rem",
              lineHeight: 1.2,
              mb: 1,
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
              mb: 2,
              fontSize: "0.9rem",
              fontFamily: theme.typography.fontFamily
            })}
          >
            {truncateDescription(data.description)}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            <Box
              sx={(theme) => ({
                backgroundColor: data.likelihood?.toLowerCase() === "high" ? "#ffe2e2" :
                  data.likelihood?.toLowerCase() === "medium" ? "#fef9c2" : "#dcfce7",
                color: data.likelihood?.toLowerCase() === "high" ? "#9f0712" :
                  data.likelihood?.toLowerCase() === "medium" ? "#894b00" : "#016630",
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "4px",
                fontFamily: theme.typography.fontFamily,
              })}
            >
              Likelihood: {data.likelihood}
            </Box>

            <Box
              sx={(theme) => ({
                backgroundColor: data.impact?.toLowerCase() === "high" ? "#ffe2e2" :
                  data.impact?.toLowerCase() === "medium" ? "#fef9c2" : "#dcfce7",
                color: data.impact?.toLowerCase() === "high" ? "#9f0712" :
                  data.impact?.toLowerCase() === "medium" ? "#894b00" : "#016630",
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "4px",
                fontFamily: theme.typography.fontFamily,
              })}
            >
              Impact: {data.impact}
            </Box>

            <Box
              sx={(theme) => ({
                backgroundColor: data.status?.toLowerCase() === "retired" ? "#ffe2e2" : "#dcfce7",
                color: data.status?.toLowerCase() === "retired" ? "#9f0712" : "#016630",
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "4px",
                fontFamily: theme.typography.fontFamily,
              })}
            >
              {data.status}
            </Box>
          </Box>

          <Divider sx={{ mb: 1.5, mt: 1, borderColor: "#f0f0f0" }} />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {mode === 'edit' && (
                <Typography
                  variant="body2"
                  onClick={() => {
                    if (data.onOpenPanel) data.onOpenPanel("controlNode");
                  }}
                  sx={(theme) => ({
                    color: "#1976d2",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-block",
                    width: "fit-content",
                    fontFamily: theme.typography.fontFamily,
                    "&:hover": { textDecoration: "underline" },
                  })}
                >
                  + Add Control
                </Typography>
              )}
              <Typography
                variant="body2"
                onClick={() => { if (data.onNodeAction) data.onNodeAction("risk", data.originalRiskId || data.RiskID || id, "info"); }}
                sx={(theme) => ({
                  color: "#2771c2",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-block",
                  width: "fit-content",
                  fontFamily: theme.typography.fontFamily,
                  "&:hover": { textDecoration: "underline" },
                })}
              >
                [ i ] Info
              </Typography>
            </Box>
            {mode === 'edit' && (
              <Typography
                variant="body2"
                onClick={() => { if (data.onNodeAction) data.onNodeAction("risk", data.originalRiskId || data.RiskID || id, "edit"); }}
                sx={(theme) => ({
                  color: "#2771c2",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-block",
                  width: "fit-content",
                  fontFamily: theme.typography.fontFamily,
                  "&:hover": { textDecoration: "underline" },
                })}
              >
                Edit
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "transparent", border: "none" }}
      />

      <AddItemDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        nodeType="riskNode"
        initialData={data}
        onSubmit={(formData) => data.onEditNode?.(id, formData)}
      />
    </>
  );
}
