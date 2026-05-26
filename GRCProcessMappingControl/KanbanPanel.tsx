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
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
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

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      sx={{
        cursor: "grab",
        border: `1px solid ${color}33`,
        "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
        "&:active": { cursor: "grabbing" },
        transition: "box-shadow 0.2s, transform 0.2s",
        position: "relative",
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" sx={(theme) => ({ fontWeight: 600, fontFamily: theme.typography.fontFamily })}>
          {item.name}
        </Typography>
        <Typography variant="caption" sx={(theme) => ({ color: "#666", fontFamily: theme.typography.fontFamily })}>
          {item.description}
        </Typography>
      </CardContent>
      {/* Delete (X) button hidden temporarily */}
    </Card>
  );
}

const KanbanPanel = forwardRef(function KanbanPanel({ open, onClose, filterType, controlItems, riskItems }, ref) {
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
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "min(360px, 100%)",
            height: "100%",
            bgcolor: "#fafafa",
            borderLeft: "1px solid #ddd",
            zIndex: 1300,
            display: "flex",
            flexDirection: "column",
            boxShadow: "-4px 0 12px rgba(0,0,0,0.08)",
          }}
        >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid #eee",
        }}
      >
        <Typography variant="h6" sx={(theme) => ({ fontWeight: 700, fontFamily: theme.typography.fontFamily })}>
          {filterType === "riskNode"
            ? "Drag risks to board"
            : filterType === "controlNode"
            ? "Drag controls to board"
            : "Drag items to board"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "#aaa" }} />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "#fff", borderRadius: 1 }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {columns.filter((col) => !filterType || col.nodeType === filterType).map((col) => {
          const filteredItems = col.items.filter((item) =>
            !searchQuery ||
            (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
          );
          return (
          <Box key={col.id} sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={(theme) => ({ fontWeight: 700, color: col.color, mb: 1, fontFamily: theme.typography.fontFamily })}
            >
              {col.title} {searchQuery && <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "#999", fontFamily: 'inherit' }}>({filteredItems.length})</span>}
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
            {/* Hide the '+ Add item' button in risk and control panels. Uncomment below to re-enable. */}
            {/*
            {col.nodeType !== "processNode" && (
              <Typography
                variant="body2"
                onClick={() => {
                  setDialogNodeType(col.nodeType);
                  setDialogColId(col.id);
                  setDialogOpen(true);
                }}
                sx={{
                  mt: 1,
                  cursor: "pointer",
                  color: col.color,
                  fontWeight: 600,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                + Add item
              </Typography>
            )}
            */}
            <Divider sx={{ mt: 2 }} />
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
