/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, Typography, Box, Divider, Button } from "@mui/material";
import NodeFooter from "./NodeFooter";
import AddItemDialog from "./AddItemDialog";

export default function ControlNode(props) {
  const { id, data } = props;
  // Always get mode from props first, fallback to data.mode
  const mode = props.mode || data.mode;
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
          borderRadius: "10px",
          border: "1px solid #e5eefd",
          backgroundColor: "#F7FAFF",
        }}>
        <CardContent>
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
              mb: 1,
              fontSize: "0.9rem",
              fontWeight: 700,
              fontFamily: theme.typography.fontFamily,
            })}
          >
            {data.description}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            <Box>
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: "#555",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  fontFamily: theme.typography.fontFamily,
                })}
              >
                CATEGORY: {data.category} -
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: "#555",
                  mb: 2,
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  fontFamily: theme.typography.fontFamily,
                })}
              >
                OWNER: {data.owner} -
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: "#555",
                  mb: 2,
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  fontFamily: theme.typography.fontFamily,
                })}
              >
                CONTROLLER: {" "}
                <Box
                  component="span"
                  sx={(theme) => ({
                    backgroundColor: "#c3eeb0d0",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontFamily: theme.typography.fontFamily,
                  })}
                >
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
                onClick={() => { if (data.onNodeAction) data.onNodeAction("control", data.originalControlId || data.ControlID || id, "info"); }}
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
              <Button
                size="small"
                onClick={() => { if (data.onNodeAction) data.onNodeAction("control", data.originalControlId || data.ControlID || id, "edit"); }}
                sx={(theme) => ({
                  textTransform: "none",
                  color: "#2771c2",
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
            )}
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
