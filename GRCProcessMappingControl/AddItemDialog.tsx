/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Select,
  FormControl,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

const defaultRiskForm = {
  name: "",
  description: "",
  category: "",
  owner: "",
  likelihood: "",
  impact: "",
  status: "",
};

const defaultControlForm = {
  name: "",
  description: "",
  category: "",
  owner: "",
  status: "",
};

export default function AddItemDialog({ open, onClose, nodeType, onSubmit, initialData }) {
  const isRisk = nodeType === "riskNode";
  const [form, setForm] = useState(isRisk ? defaultRiskForm : defaultControlForm);

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setForm(isRisk
          ? { ...defaultRiskForm, name: initialData.title || initialData.name || "", description: initialData.description || "", category: initialData.category || "", owner: initialData.owner || "", likelihood: initialData.likelihood || "", impact: initialData.impact || "", status: initialData.status || "" }
          : { ...defaultControlForm, name: initialData.title || initialData.name || "", description: initialData.description || "", category: initialData.category || "", owner: initialData.owner || "", status: initialData.status || "" }
        );
      } else {
        setForm(isRisk ? defaultRiskForm : defaultControlForm);
      }
    }
  }, [open, isRisk, initialData]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData ? (isRisk ? "Edit Risk" : "Edit Control") : (isRisk ? "Add New Risk" : "Add New Control")}</DialogTitle>
      <DialogContent sx={{ padding: "24px" }}>
        <form
          onSubmit={handleSubmit}
          id="add-item-form"
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              {isRisk ? "Risk Name *" : "Control Name *"}
            </Typography>
            <TextField
              autoFocus
              required
              name="name"
              label={isRisk ? "e.g., Data Breach" : "e.g., Firewall Policy"}
              fullWidth
              variant="outlined"
              value={form.name}
              onChange={handleChange("name")}
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              Description *
            </Typography>
            <TextField
              required
              name="description"
              label={isRisk ? "Describe the risk" : "Describe the control"}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={form.description}
              onChange={handleChange("description")}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid size={isRisk ? 6 : 4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                Category *
              </Typography>
              <FormControl fullWidth>
                <Select
                  variant="outlined"
                  sx={{ borderRadius: "8px", height: "42px" }}
                  value={form.category}
                  onChange={handleChange("category")}
                >
                  <MenuItem value="Security">Security</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Compliance">Compliance</MenuItem>
                  <MenuItem value="Financial">Financial</MenuItem>
                  {isRisk ? (
                    <MenuItem value="Strategic">Strategic</MenuItem>
                  ) : (
                    <MenuItem value="HR">HR</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={isRisk ? 6 : 4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                Owner *
              </Typography>
              <TextField
                required
                name="owner"
                label={isRisk ? "e.g., CISCO" : "e.g., NetOps Team"}
                fullWidth
                variant="outlined"
                value={form.owner}
                onChange={handleChange("owner")}
              />
            </Grid>
            {isRisk && (
              <>
                <Grid size={4}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                    Likelihood *
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      variant="outlined"
                      sx={{ borderRadius: "8px", height: "42px" }}
                      value={form.likelihood}
                      onChange={handleChange("likelihood")}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={4}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                    Impact *
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      variant="outlined"
                      sx={{ borderRadius: "8px", height: "42px" }}
                      value={form.impact}
                      onChange={handleChange("impact")}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            <Grid size={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                Status *
              </Typography>
              <FormControl fullWidth>
                <Select
                  variant="outlined"
                  sx={{ borderRadius: "8px", height: "42px" }}
                  value={form.status}
                  onChange={handleChange("status")}
                >
                  {isRisk ? (
                    [
                      <MenuItem key="open" value="Open">Open</MenuItem>,
                      <MenuItem key="mitigated" value="Mitigated">Mitigated</MenuItem>,
                      <MenuItem key="closed" value="Closed">Closed</MenuItem>,
                    ]
                  ) : (
                    [
                      <MenuItem key="active" value="Active">Active</MenuItem>,
                      <MenuItem key="inactive" value="Inactive">Inactive</MenuItem>,
                    ]
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ margin: "0px 5px 10px 10px" }}>
        <Button
          type="submit"
          form="add-item-form"
          sx={{
            flex: 1,
            color: "white",
            backgroundColor: isRisk ? "#e7000b" : "#1976d2",
          }}
        >
          {initialData ? "Save changes" : "Submit request"}
        </Button>
        <Button
          onClick={onClose}
          sx={{ flex: 1, color: "black", backgroundColor: "#f6f3f4" }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
