/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, Typography, Box, Divider, Button } from "@mui/material";
import NodeFooter from "./NodeFooter";
import AddItemDialog from "./AddItemDialog";

export default function ControlNode({ id, data }) {
  const [detailOpen, setDetailOpen] = React.useState(false);

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "transparent", border: "none" }}
      />
      <Card
        sx={{
          minWidth: 320,
          maxWidth: 320,
          borderRadius: "12px",
          border: "1px solid #333",
          backgroundColor: "#eff6ff",
        }}>
        <CardContent>
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
            sx={{
              color: "#555",
              mb: 1,
              fontSize: "0.9rem",
              fontWeight: 700,
            }}>
            {data.description}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#555",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}>
                CATEGORY: {data.category} -
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#555",
                  mb: 2,
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}>
                OWNER: {data.owner} -
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#555",
                  mb: 2,
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}>
                CONTROLLER:{" "}
                <Box
                  component="span"
                  sx={{
                    backgroundColor: "#c3eeb0d0",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}>
                  {data.status}
                </Box>
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 1.5, mt: 1, borderColor: "#f0f0f0" }} />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography
                variant="body2"
                onClick={() => { if (data.onNodeAction) data.onNodeAction("control", data.originalControlId || id, "info"); }}
                sx={{
                  color: "#888",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-block",
                  width: "fit-content",
                  "&:hover": { textDecoration: "underline" },
                }}>
                Info
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => { if (data.onNodeAction) data.onNodeAction("control", data.originalControlId || id, "edit"); }}
              sx={{ textTransform: "none", color: "#555", minWidth: "auto", p: "0 8px" }}>
              Edit
            </Button>
          </Box>
        </CardContent>
      </Card>

      <AddItemDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        nodeType="controlNode"
        initialData={data}
        onSubmit={(formData) => data.onEditNode?.(id, formData)}
      />

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "transparent", border: "none" }}
      />
    </>
  );
}
