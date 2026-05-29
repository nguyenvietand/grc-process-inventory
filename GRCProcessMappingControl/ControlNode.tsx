/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
} from "@mui/material";

import AddItemDialog from "./AddItemDialog";

export default function ControlNode(props) {
  const { id, data } = props;

  const mode = data.mode;

  const [detailOpen, setDetailOpen] = React.useState(false);

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "transparent",
          border: "none",
        }}
      />

      <Card
        sx={{
          width: 400,
          height: 250,
          borderRadius: "10px",
          border: "1px solid #e5eefd",
          backgroundColor: "#F7FAFF",
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
              noWrap
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
                fontFamily: theme.typography.fontFamily,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                height: "4.2em",
                lineHeight: 1.4,
              })}
            >
              {data.description}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={(theme) => ({
                    color: "#555",
                    fontSize: "0.8rem",
                    fontFamily:
                      theme.typography.fontFamily,
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
                    fontFamily:
                      theme.typography.fontFamily,
                  })}
                >
                  OWNER: {data.owner} -
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
              }}
            >
              <Box
                sx={(theme) => ({
                  backgroundColor:
                    data.status?.toLowerCase() === "retired"
                      ? "#ffe2e2"
                      : "#dcfce7",

                  color:
                    data.status?.toLowerCase() === "retired"
                      ? "#9f0712"
                      : "#016630",

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
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box>
            <Divider
              sx={{
                mb: 1.5,
                mt: 1,
                borderColor: "#f0f0f0",
              }}
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  onClick={() => {
                    if (data.onNodeAction) {
                      data.onNodeAction(
                        "control",
                        data.originalControlId ||
                          data.ControlID ||
                          id,
                        "info",
                        data.Index ?? data.index
                      );
                    }
                  }}
                  sx={(theme) => ({
                    color: "#2771c2",
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
                  [ i ] Info
                </Typography>
              </Box>

              {mode === "edit" && (
                <Typography
                  variant="body2"
                  onClick={() => {
                    if (data.onNodeAction) {
                      data.onNodeAction(
                        "control",
                        data.originalControlId ||
                          data.ControlID ||
                          id,
                        "edit",
                        data.Index ?? data.index
                      );
                    }
                  }}
                  sx={(theme) => ({
                    color: "#2771c2",
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
                  Edit
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <AddItemDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        nodeType="controlNode"
        initialData={data}
        onSubmit={(formData) =>
          data.onEditNode?.(id, formData)
        }
      />

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "transparent",
          border: "none",
        }}
      />
    </>
  );
}
