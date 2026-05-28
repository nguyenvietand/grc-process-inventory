/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState, useImperativeHandle, forwardRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Divider,
  Stack,
  Slide,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddItemDialog from "./AddItemDialog";

const kanbanColumns = [
  {
    id: "col-process",
    title: "Processes",
    color: "#388e3c",
    bgColor: "#f1f8e9",
    nodeType: "processNode",
    items: [
      {
        id: "kb-root-1",
        name: "HR Governance",
        title: "HR Governance",
        description: "Human resources policies and compliance",
        department: "Human Resources",
        owner: "Jane Doe",
      },
      {
        id: "kb-root-2",
        name: "Cybersecurity Program",
        title: "Cybersecurity Program",
        description: "Enterprise-wide cybersecurity governance",
        department: "Information Security",
        owner: "John Smith",
      },
    ],
  },
  {
    id: "col-risk",
    title: "Risks",
    color: "#d32f2f",
    bgColor: "#fff5f5",
    nodeType: "riskNode",
    items: [
      {
        id: "kb-risk-1",
        name: "Data Leak",
        description: "Potential data leak via third-party API",
        category: "Security",
        owner: "SecOps",
        likelihood: "High",
        impact: "High",
        status: "Open",
      },
      {
        id: "kb-risk-2",
        name: "Vendor Lock-in",
        description: "Over-reliance on single cloud provider",
        category: "Strategic",
        owner: "CTO Office",
        likelihood: "Medium",
        impact: "Medium",
        status: "Open",
      },
    ],
  },
  {
    id: "col-control",
    title: "Controls",
    color: "#1976d2",
    bgColor: "#f0f7ff",
    nodeType: "controlNode",
    items: [
      {
        id: "kb-ctrl-1",
        name: "MFA Enforcement",
        description: "Multi-factor authentication for all users",
        category: "Security",
        owner: "IAM Team",
        status: "Active",
      },
      {
        id: "kb-ctrl-2",
        name: "Monthly Audit",
        description: "Monthly compliance audit cycle",
        category: "Compliance",
        owner: "Audit Team",
        status: "Active",
      },
    ],
  },
];

function DraggableItem({ item, nodeType, color, onDelete }) {
  const handleDragStart = (e) => {
    const payload = JSON.stringify({ ...item, nodeType });
    e.dataTransfer.setData("application/reactflow", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  const statusText = item.status || "Active";

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      sx={(theme) => ({
        cursor: "grab",
        bgcolor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        boxShadow: "none",
        mb: 1.2,
        fontFamily: theme.typography.fontFamily,
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          borderColor: "#cbd5e1"
        },
        transition: "all 0.2s ease",
      })}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, textAlign: "left" }}>

        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "#333333",
            mb: 0.5,
            fontSize: "0.825rem",
            lineHeight: 1.3,
            fontFamily: "inherit"
          }}
        >
          {item.name}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#4b5c6b",
            fontSize: "0.75rem",
            lineHeight: 1.4,
            mb: nodeType === "controlNode" ? 1.5 : 0,
            fontFamily: "inherit"
          }}
        >
          {item.description}
        </Typography>

        {nodeType === "controlNode" && (
          <Box
            sx={(theme) => ({
              marginTop: "8px",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr auto auto",
              alignItems: "center",
              columnGap: "10px",
              fontSize: "0.6rem",
              color: "#7d8fa5",
              fontFamily: theme.typography.fontFamily,
            })}
          >
            <Box sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              CATEGORY: {item.category || "N/A"}
            </Box>

            <Box sx={{ color: "#7d8fa5", userSelect: "none" }}>-</Box>

            <Box sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              OWNER: {item.owner || "N/A"}
            </Box>

            <Box sx={{ color: "#7d8fa5", userSelect: "none" }}>-</Box>

            <Box
              sx={(theme) => ({
                backgroundColor: statusText?.toLowerCase() === "retired" ? "#ffe2e2" : "#e6f9e6",
                color: statusText?.toLowerCase() === "retired" ? "#9f0712" : "#26a251",
                px: 0.75,
                py: 0.15,
                borderRadius: "3px",
                fontWeight: 700,
                fontSize: "0.5rem",
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                fontFamily: theme.typography.fontFamily,
                justifySelf: "end",
              })}
            >
              {statusText}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

const KanbanPanel = forwardRef(function KanbanPanel({ open, onClose, filterType, controlItems, riskItems, onNodeAction }, ref) {
  const initialColumns = kanbanColumns.map((col) =>
    col.nodeType === 'controlNode' && controlItems && controlItems.length > 0
      ? { ...col, items: controlItems }
      : col.nodeType === 'riskNode' && riskItems && riskItems.length > 0
        ? { ...col, items: riskItems }
        : col
  );
  const [columns, setColumns] = useState(initialColumns);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogNodeType, setDialogNodeType] = useState(null);
  const [dialogColId, setDialogColId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    if (!controlItems || controlItems.length === 0) return;
    setColumns((prev) =>
      prev.map((col) =>
        col.nodeType === "controlNode" ? { ...col, items: controlItems } : col
      )
    );
  }, [controlItems]);

  React.useEffect(() => {
    if (!riskItems || riskItems.length === 0) return;
    setColumns((prev) =>
      prev.map((col) =>
        col.nodeType === "riskNode" ? { ...col, items: riskItems } : col
      )
    );
  }, [riskItems]);

  useImperativeHandle(ref, () => ({
    removeItem: (itemId) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          items: col.items.filter((item) => item.id !== itemId),
        }))
      );
    },
    addItem: (nodeType, item) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.nodeType === nodeType
            ? { ...col, items: [...col.items, item] }
            : col
        )
      );
    },
  }));

  const handleDeleteKanbanItem = (itemId) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items.filter((item) => item.id !== itemId),
      }))
    );
  };

  const handleAddItem = (formData) => {
    if (!dialogColId) return;
    const col = columns.find((c) => c.id === dialogColId);
    if (!col) return;
    setColumns((prev) =>
      prev.map((c) =>
        c.id === dialogColId
          ? {
            ...c,
            items: [
              ...c.items,
              {
                id: `kb-${Date.now()}`,
                ...formData,
                ...(col.nodeType === "processNode" && {
                  title: formData.name,
                  department: formData.department || "General",
                }),
              },
            ],
          }
          : c
      )
    );
  };

  return (
    <>
      <Slide direction="left" in={open} timeout={300} unmountOnExit>
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: 2,
            bottom: 2,
            right: 0,
            borderRadius: "10px 0 0 10px",
            width: "min(360px, 100%)",
            bgcolor: "#fafafa",
            borderLeft: "1px solid #ddd",
            borderTop: "1px solid #ddd",
            borderBottom: "1px solid #ddd",
            zIndex: 1300,
            display: "flex",
            flexDirection: "column",
            boxShadow: "-4px 0 12px rgba(0,0,0,0.08)",
            fontFamily: theme.typography.fontFamily
          })}
        >
          {/* Header Panel */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              pt: 2
            }}
          >
            <Typography variant="h6" sx={(theme) => ({ fontWeight: 700, fontFamily: theme.typography.fontFamily })}>
              {filterType === "riskNode"
                ? "Add Risk"
                : filterType === "controlNode"
                  ? "Add Control"
                  : "Add Item"}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Search Box */}
          <Box sx={{ px: 2, pt: 0.5, pb: 0.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={filterType === "controlNode" ? "Search control" : "Search risk"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={(theme) => ({
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#f1f5f9",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontFamily: theme.typography.fontFamily,

                  "& fieldset": { border: "none" },
                  "&:hover fieldset": { border: "none" },
                  "&.Mui-focused fieldset": { border: "none" },
                },
                "& input": {
                  py: 1,
                  color: "#334155",
                  fontFamily: theme.typography.fontFamily,
                  "&::placeholder": {
                    color: "#94a3b8",
                    opacity: 1,
                    fontFamily: theme.typography.fontFamily
                  },
                },
              })}
            />
          </Box>

          {/* List Cards */}
          <Box sx={{ flex: 1, overflow: "auto", pb: 2, px: 2 }}>
            {columns.filter((col) => !filterType || col.nodeType === filterType).map((col) => {
              const filteredItems = col.items.filter((item) =>
                !searchQuery ||
                (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
              );
              return (
                <Box key={col.id} sx={{ mb: 3, textAlign: "left" }}>
                  <Typography
                    variant="body2"
                    onClick={() => {
                      const itemType = filterType === "controlNode" ? "control" : "risk";
                      if (onNodeAction) {
                        onNodeAction(itemType, "", "create", "");
                      }
                    }}
                    sx={(theme) => ({
                      color: filterType === "controlNode" ? "#1976d2" : "#d32f2f",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-block",
                      width: "fit-content",
                      fontFamily: theme.typography.fontFamily,
                      mt: 1,
                      mb: 1.5,
                      fontSize: "0.825rem",
                      "&:hover": { textDecoration: "underline" },
                    })}
                  >
                    {filterType === "controlNode" ? "+ Create new control" : "+ Create new risk"}
                  </Typography>
                  <Stack spacing={1}>
                    {filteredItems.map((item) => (
                      <DraggableItem
                        key={item.id}
                        item={item}
                        nodeType={col.nodeType}
                        color={col.color}
                        onDelete={handleDeleteKanbanItem}
                      />
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Slide>

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        nodeType={dialogNodeType}
        onSubmit={handleAddItem}
      />
    </>
  );
});

export default KanbanPanel;