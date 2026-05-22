/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import isEqual from "lodash/isEqual";
import {
  ReactFlow,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Snackbar, Alert } from "@mui/material";

import ProcessNode from "./ProcessNode";
import RiskNode from "./RiskNode";
import ControlNode from "./ControlNode";
import KanbanPanel from "./KanbanPanel";
import { layoutNodes } from "./layoutNodes";

import { mockProcessNodes, mockRiskNodes, mockControlNodes } from "./mockData";

const nodeTypes = {
  processNode: ProcessNode,
  riskNode: RiskNode,
  controlNode: ControlNode,
};

function getProcessRiskEdgeStyle(processRiskStatus) {
  const normalizedStatus = String(processRiskStatus || "").toLowerCase();
  if (normalizedStatus === "retired") {
    return {
      stroke: "#f0b100",
      strokeWidth: 1.5,
      strokeDasharray: "6 4",
    };
  }

  return {
    // Using a valid 6-digit equivalent for the requested active color.
    stroke: "#00cc95",
    strokeWidth: 1.5,
  };
}

function getRiskControlEdgeStyle(riskControlStatus) {
  const normalizedStatus = String(riskControlStatus || "").toLowerCase();
  if (normalizedStatus === "retired") {
    return {
      stroke: "#f0b100",
      strokeWidth: 1.5,
      strokeDasharray: "6 4",
    };
  }

  return {
    stroke: "#00cc95",
    strokeWidth: 1.5,
  };
}

function buildFlowData(processData, rootData, riskData, controlData) {
  // Pass all process fields into node data
  const rootSource = (processData && processData.length > 0)
    ? processData.map((item) => ({
        _id: item.id,
        title: item.title,
        department: item.department,
        owner: item.owner,
        risks: item.risks || [],
        HeraclesProcessActivityID: item.HeraclesProcessActivityID || "",
        Index: item.Index || "",
        ProcessStatus: item.ProcessStatus || "",
      }))
    : rootData;

  const rootNodes = rootSource.map((item, index) => ({
    id: item._id,
    type: "processNode",
    position: { x: 0, y: index * 250 },
    data: { ...item },
  }));

  console.log("Process nodes built:", rootNodes);

  const riskNodes = [];
  const riskEdges = [];
  const riskMapping = {}; // { riskId -> processId[] } for tracking relationships
  const nestedControls = []; // Collect controls from nested risk data

  // Extract nested risks from processData
  if (processData && processData.length > 0) {
    processData.forEach((process) => {
      if (process.risks && process.risks.length > 0) {
        process.risks.forEach((nestedRisk) => {
          // Track which processes this risk belongs to
          if (!riskMapping[nestedRisk.RiskID]) {
            riskMapping[nestedRisk.RiskID] = [];
          }
          riskMapping[nestedRisk.RiskID].push({
            processId: process.id,
            status: nestedRisk.ProcessRiskStatus,
            riskObject: nestedRisk.RiskObject,
          });
        });
      }
    });

    // Build risk nodes from nested risks
    const uniqueRiskIds = Object.keys(riskMapping);
    
    riskNodes.push(
      ...uniqueRiskIds.map((riskId, index) => {
        const riskDetail = riskData?.find((r) => r.id === riskId);
        const mappedRisk = riskMapping[riskId][0];
        const riskObject = mappedRisk?.riskObject || {};
        
        // Collect controls from nested risk data
        const nestedRiskFromProcess = processData?.[0]?.risks?.find(r => r.RiskID === riskId);
        const controls = nestedRiskFromProcess?.Controls || [];
        
        return {
          id: riskId,
          type: "riskNode",
          position: { x: 400, y: index * 250 },
          data: {
            _id: riskId,
            title: riskObject.RiskShortName || riskDetail?.name || riskId,
            name: riskObject.RiskShortName || riskDetail?.name || riskId,
            description: riskObject.Description || riskDetail?.description,
            parentId: mappedRisk.processId,
            likelihood: riskObject.Likelihood,
            impact: riskObject.Impact,
            status: riskObject.RiskStatus || mappedRisk.status,
            processRiskStatus: mappedRisk.status,
            controls: controls,
          },
        };
      })
    );
    
    // Collect all controls from risks for node creation
    riskNodes.forEach((riskNode) => {
      if (riskNode.data.controls && riskNode.data.controls.length > 0) {
        riskNode.data.controls.forEach((control) => {
          nestedControls.push({
            ...control,
            riskId: riskNode.id,
          });
        });
      }
    });

    // Build edges from processes to nested risks
    Object.entries(riskMapping).forEach(([riskId, processes]) => {
      processes.forEach((proc) => {
        riskEdges.push({
          id: `edge-${proc.processId}-to-${riskId}`,
          source: proc.processId,
          target: riskId,
          type: "default",
          style: getProcessRiskEdgeStyle(proc.status),
        });
      });
    });
  } else if (riskData && riskData.length > 0) {
    // Fallback to riskData if no processData
    riskNodes.push(
      ...riskData.map((item, index) => ({
        id: item._id,
        type: "riskNode",
        position: { x: 400, y: index * 250 },
        data: { ...item, title: item.name },
      }))
    );

    riskEdges.push(
      ...riskData
        .filter((item) => item.parentId)
        .map((item) => ({
          id: `edge-${item.parentId}-to-${item._id}`,
          source: item.parentId,
          target: item._id,
          type: "default",
          style: { stroke: "#d32f2f", strokeWidth: 1.5 },
        }))
    );
  }

  const controlNodes = [];
  const controlEdges = [];
  // Each risk-control is a separate node, even if ControlID is the same
  if (nestedControls && nestedControls.length > 0) {
    nestedControls.forEach((control, index) => {
      // Create a unique id for each risk-control
      const uniqueId = `${control.ControlID}__${control.riskId}`;
      controlNodes.push({
        id: uniqueId,
        type: "controlNode",
        position: { x: 800, y: index * 250 },
        data: {
          _id: uniqueId,
          title: control.ControlName,
          name: control.ControlName,
          description: control.ControlDesc,
          category: control.ControlCategory,
          owner: control.ControlOwner,
          status: control.ControlStatus,
          parentId: control.riskId,
          originalControlId: control.ControlID,
          RiskControlStatus: control.RiskControlStatus || "",
        },
      });
      controlEdges.push({
        id: `edge-${control.riskId}-to-${uniqueId}`,
        source: control.riskId,
        target: uniqueId,
        style: getRiskControlEdgeStyle(control.RiskControlStatus),
      });
    });
  }

  // Do not add control nodes from controlData anymore (only take from nestedControls)

  // Combine all edges
  const edges = [...riskEdges, ...controlEdges];

  return { nodes: [...rootNodes, ...riskNodes, ...controlNodes], edges };
}

let idCounter = 100;

function FlowBoard({ processItems, controlItems, riskItems, processDatasetFlat, onNodeAction, onProcessDatasetChange }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelFilter, setPanelFilter] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const { screenToFlowPosition, fitView } = useReactFlow();
  const setNodesRef = useRef(null);
  const setEdgesRef = useRef(null);
  const edgesRef = useRef([]);
  const nodesRef = useRef([]);
  const kanbanRef = useRef(null);
  const handleDeleteNodeRef = useRef(null);
  const handleEditNodeRef = useRef(null);

  const positionNewNode = useCallback((newNodeId) => {
    setTimeout(() => {
      setNodesRef.current((prevNodes) => {
        const newNode = prevNodes.find((n) => n.id === newNodeId);
        if (!newNode) return prevNodes;

        const currentEdges = edgesRef.current;
        let parentId = null;
        let isLeftSide = false;

        const incomingEdge = currentEdges.find((e) => e.target === newNodeId);
        const outgoingToRoot = currentEdges.find((e) => e.source === newNodeId);

        if (incomingEdge) {
          parentId = incomingEdge.source;
        } else if (outgoingToRoot) {
          parentId = outgoingToRoot.target;
          isLeftSide = true;
        }

        if (!parentId) return prevNodes;

        const parentNode = prevNodes.find((n) => n.id === parentId);
        if (!parentNode) return prevNodes;

        let siblings;
        if (isLeftSide) {
          const siblingIds = currentEdges
            .filter((e) => e.target === parentId && e.source !== newNodeId)
            .map((e) => e.source);
          siblings = prevNodes.filter((n) => siblingIds.includes(n.id));
        } else {
          const siblingIds = currentEdges
            .filter((e) => e.source === parentId && e.target !== newNodeId)
            .map((e) => e.target);
          siblings = prevNodes.filter((n) => siblingIds.includes(n.id));

          const grandchildIds = [];
          for (const sib of siblings) {
            const childIds = currentEdges
              .filter((e) => e.source === sib.id)
              .map((e) => e.target);
            grandchildIds.push(...childIds);
          }
          const grandchildren = prevNodes.filter((n) => grandchildIds.includes(n.id));
          siblings = [...siblings, ...grandchildren];
        }

        let newY;
        if (siblings.length > 0) {
          const maxY = Math.max(...siblings.map((s) => s.position.y));
          newY = maxY + ROW_GAP;
        } else {
          newY = parentNode.position.y;
        }

        const newX = isLeftSide ? -450 : (newNode.type === "riskNode" ? 450 : 900);

        return prevNodes.map((n) =>
          n.id === newNodeId ? { ...n, position: { x: newX, y: newY } } : n
        );
      });
    }, 0);
  }, []);

  const ROW_GAP = 280;

  const handleDropControl = useCallback((parentId, parentPosition, controlItem) => {
    const newId = `control-drop-${++idCounter}`;
    const currentNodes = nodesRef.current;
    const parentNode = currentNodes?.find((n) => n.id === parentId);
    const isRootParent = parentNode && parentNode.type === "processNode";

    // Always pass originalControlId if available
    setNodesRef.current((prev) => [
      ...prev,
      {
        id: newId,
        type: "controlNode",
        position: { x: isRootParent ? -450 : parentPosition.x + 400, y: parentPosition.y },
        data: { ...controlItem, title: controlItem.name, _id: newId, originalControlId: controlItem.originalControlId || controlItem.ControlID || controlItem.id, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onNodeAction },
      },
    ]);

    if (isRootParent) {
      setEdgesRef.current((prev) => [
        ...prev,
        {
          id: `edge-${newId}-to-${parentId}`,
          source: newId,
          target: parentId,
          type: "default",
          style: { stroke: "#00cc95", strokeWidth: 1.5 },
        },
      ]);
    } else {
      setEdgesRef.current((prev) => [
        ...prev,
        {
          id: `edge-${parentId}-to-${newId}`,
          source: parentId,
          target: newId,
          type: "default",
          style: { stroke: "#00cc95", strokeWidth: 1.5 },
        },
      ]);
    }

    kanbanRef.current?.removeItem(controlItem.id);
    positionNewNode(newId);
  }, [positionNewNode, onNodeAction]);

  const handleAddRisk = useCallback((parentRootId, riskData) => {
    const newId = `risk-new-${++idCounter}`;
    setNodesRef.current((prev) => {
      const riskCount = prev.filter((n) => n.type === "riskNode").length;
      return [
        ...prev,
        {
          id: newId,
          type: "riskNode",
          position: { x: 400, y: riskCount * 250 },
          data: { ...riskData, title: riskData.name, _id: newId, originalRiskId: riskData.originalRiskId || riskData.RiskID || riskData.id, onDropControl: handleDropControl, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onOpenPanel: openPanel, showError, onNodeAction },
        },
      ];
    });
    setEdgesRef.current((prev) => [
      ...prev,
      {
        id: `edge-${parentRootId}-to-${newId}`,
        source: parentRootId,
        target: newId,
        type: "default",
        style: { stroke: "#00cc95", strokeWidth: 1.5 },
      },
    ]);
    positionNewNode(newId);
  }, [handleDropControl, onNodeAction]);

  const handleAddControl = useCallback((parentRootId, controlData) => {
    const newId = `control-new-${++idCounter}`;
    setNodesRef.current((prev) => {
      const controlCount = prev.filter((n) => n.type === "controlNode").length;
      return [
        ...prev,
        {
          id: newId,
          type: "controlNode",
          position: { x: -450, y: controlCount * 250 },
          data: { ...controlData, title: controlData.name, _id: newId, originalControlId: controlData.originalControlId || controlData.ControlID || controlData.id, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onNodeAction },
        },
      ];
    });
    setEdgesRef.current((prev) => [
      ...prev,
      {
        id: `edge-${newId}-to-${parentRootId}`,
        source: newId,
        target: parentRootId,
        type: "default",
        style: { stroke: "#00cc95", strokeWidth: 1.5 },
      },
    ]);
    positionNewNode(newId);
  }, [positionNewNode, onNodeAction]);

  const handleDropRisk = useCallback((parentRootId, parentPosition, riskItem) => {
    const newId = `risk-drop-${++idCounter}`;
    setNodesRef.current((prev) => [
      ...prev,
      {
        id: newId,
        type: "riskNode",
        position: { x: parentPosition.x + 400, y: parentPosition.y },
        data: { ...riskItem, title: riskItem.name, _id: newId, originalRiskId: riskItem.originalRiskId || riskItem.RiskID || riskItem.id, onDropControl: handleDropControl, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onOpenPanel: openPanel, showError, onNodeAction },
      },
    ]);
    setEdgesRef.current((prev) => [
      ...prev,
      {
        id: `edge-${parentRootId}-to-${newId}`,
        source: parentRootId,
        target: newId,
        type: "default",
        style: { stroke: "#00cc95", strokeWidth: 1.5 },
      },
    ]);
    kanbanRef.current?.removeItem(riskItem.id);
    positionNewNode(newId);
  }, [handleDropControl, positionNewNode, onNodeAction]);

  const initialData = useMemo(
    () => buildFlowData(processItems, mockProcessNodes, riskItems, controlItems),
    [processItems, riskItems, controlItems],
  );

  const showError = useCallback((msg) => setErrorMsg(msg), []);

  const openPanel = useCallback((filterType) => {
    setPanelFilter(filterType);
    setPanelOpen(true);
  }, []);

  const handleDeleteNode = useCallback((nodeId, nodeData) => {
    setNodesRef.current((prev) => prev.filter((n) => n.id !== nodeId));
    setEdgesRef.current((prev) =>
      prev.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    const nodeType = nodeData.likelihood !== undefined ? "riskNode" : "controlNode";
    kanbanRef.current?.addItem(nodeType, {
      id: `kb-${Date.now()}`,
      name: nodeData.title || nodeData.name,
      description: nodeData.description || "",
      category: nodeData.category,
      owner: nodeData.owner,
      ...(nodeType === "riskNode" && {
        likelihood: nodeData.likelihood,
        impact: nodeData.impact,
        status: nodeData.status,
      }),
      ...(nodeType === "controlNode" && {
        status: nodeData.status,
      }),
    });
  }, []);

  handleDeleteNodeRef.current = handleDeleteNode;

  const handleEditNode = useCallback((nodeId, formData) => {
    setNodesRef.current((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, title: formData.name, ...formData } }
          : n
      )
    );
  }, []);

  handleEditNodeRef.current = handleEditNode;

  // Only reset nodes/edges when input data actually changes
  const prevDataRef = useRef({ processItems, controlItems, riskItems });

  // Create nodesWithCallbacks only when input data actually changes
  const nodesWithCallbacks = useMemo(() => {
    return initialData.nodes.map((node) => {
      if (node.type === "processNode") {
        return {
          ...node,
          data: {
            ...node.data,
            onAddRisk: handleAddRisk,
            onAddControl: handleAddControl,
            onDropRisk: handleDropRisk,
            onDropControl: handleDropControl,
            onOpenPanel: openPanel,
            showError,
          },
        };
      }
      if (node.type === "riskNode") {
        return {
          ...node,
          data: {
            ...node.data,
            onDropControl: handleDropControl,
            onDeleteNode: handleDeleteNode,
            onEditNode: handleEditNode,
            onOpenPanel: openPanel,
            showError,
            onNodeAction,
            originalRiskId: node.data.originalRiskId || node.data.RiskID || node.data.id,
          },
        };
      }
      if (node.type === "controlNode") {
        return {
          ...node,
          data: {
            ...node.data,
            onDeleteNode: handleDeleteNode,
            onEditNode: handleEditNode,
            onNodeAction,
            originalControlId: node.data.originalControlId || node.data.ControlID || node.data.id,
          },
        };
      }
      return {
        ...node,
        data: {
          ...node.data,
          onDeleteNode: handleDeleteNode,
          onEditNode: handleEditNode,
          onNodeAction,
        },
      };
    });
    // eslint-disable-next-line
  }, [initialData.nodes, handleAddRisk, handleAddControl, handleDropRisk, handleDropControl, handleDeleteNode, handleEditNode, showError, openPanel]);


  const [nodes, setNodes] = useState(() => layoutNodes(nodesWithCallbacks, initialData.edges));
  const [edges, setEdges] = useState(initialData.edges);

  // Helper: flatten process, risk, control into flat array (like ProcessDataset)
  function flattenProcessDatasetFromGraph(nodes, edges) {
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const processNodes = nodes.filter(n => n.type === 'processNode');
    const rows = [];

    // Build a set of (RiskID, ControlID) pairs from the original input ProcessDataset (flat, from processDatasetFlat)
    const inputRows = Array.isArray(processDatasetFlat) ? processDatasetFlat : [];
    const inputPairs = new Set(
      inputRows.map(row => `${row.RiskID || ''}|||${row.ControlID || ''}`)
    );

    processNodes.forEach(proc => {
      const riskEdges = edges.filter(e => e.source === proc.id && nodeMap[e.target]?.type === 'riskNode');
      // Extract all process fields, fallback to empty string if missing
      const processFields = {
        CoreProcessID: proc.id,
        HeraclesProcessActivityID: proc.data.HeraclesProcessActivityID || "",
        Index: proc.data.Index || "",
        Owner: proc.data.owner || "",
        ProcessActivityName: proc.data.title || proc.data.ProcessActivityName || "",
        ProcessStatus: proc.data.ProcessStatus || "",
        DepartmentName: proc.data.department || "",
      };
      if (riskEdges.length === 0) {
        // Process without risk
        rows.push({
          ...processFields,
          // Risk fields empty
          RiskID: "",
          ProcessRiskStatus: "",
          RiskShortName: "",
          RiskDescription: "",
          RiskLikelihood: "",
          RiskImpact: "",
          RiskStatus: "",
          // Control fields empty
          ControlID: "",
          RiskControlStatus: "",
          ControlName: "",
          ControlDesc: "",
          ControlCategory: "",
          ControlOwner: "",
          ControlStatus: "",
          // Marker fields
          ProcessRiskMarker: "",
          RiskControlMarker: "",
        });
      } else {
        riskEdges.forEach(e => {
          const riskNode = nodeMap[e.target];
          const riskId = riskNode.data.RiskID || riskNode.data.originalRiskId || riskNode.id;
          const controlEdges = edges.filter(ed => ed.source === riskNode.id && nodeMap[ed.target]?.type === 'controlNode');
          if (controlEdges.length === 0) {
            // Risk without control
            const pairKey = `${riskId || ''}|||`;
            const isNew = !inputPairs.has(pairKey);
            rows.push({
              ...processFields,
              RiskID: riskId,
              ProcessRiskStatus: riskNode.data.processRiskStatus || riskNode.data.status || "",
              RiskShortName: riskNode.data.name || riskNode.data.title || "",
              RiskDescription: riskNode.data.description || "",
              RiskLikelihood: riskNode.data.likelihood || "",
              RiskImpact: riskNode.data.impact || "",
              RiskStatus: riskNode.data.status || "",
              // Control fields empty
              ControlID: "",
              RiskControlStatus: "",
              ControlName: "",
              ControlDesc: "",
              ControlCategory: "",
              ControlOwner: "",
              ControlStatus: "",
              // Marker fields
              ProcessRiskMarker: isNew ? "add" : "",
              RiskControlMarker: "",
            });
          } else {
            // Determine if the risk itself is new (for ProcessRiskMarker)
            const riskPairKey = `${riskId || ''}|||`;
            const isNewRisk = !inputPairs.has(riskPairKey);
            controlEdges.forEach(ce => {
              const ctrl = nodeMap[ce.target];
              const controlId = ctrl.data.ControlID || ctrl.data.originalControlId || ctrl.id || "";
              const pairKey = `${riskId || ''}|||${controlId || ''}`;
              const isNewControl = !inputPairs.has(pairKey);
              rows.push({
                ...processFields,
                RiskID: riskId,
                ProcessRiskStatus: riskNode.data.processRiskStatus || riskNode.data.status || "",
                RiskShortName: riskNode.data.name || riskNode.data.title || "",
                RiskDescription: riskNode.data.description || "",
                RiskLikelihood: riskNode.data.likelihood || "",
                RiskImpact: riskNode.data.impact || "",
                RiskStatus: riskNode.data.status || "",
                ControlID: controlId,
                RiskControlStatus: ctrl.data.RiskControlStatus || "",
                ControlName: ctrl.data.name || ctrl.data.title || "",
                ControlDesc: ctrl.data.description || "",
                ControlCategory: ctrl.data.category || "",
                ControlOwner: ctrl.data.owner || "",
                ControlStatus: ctrl.data.status || "",
                // Marker fields
                ProcessRiskMarker: isNewRisk && isNewControl ? "add" : "",
                RiskControlMarker: isNewControl ? "add" : "",
              });
            });
          }
        });
      }
    });
    return rows;
  }

  // Call onProcessDatasetChange whenever nodes or edges change (init and after edits)
  useEffect(() => {
    if (typeof onProcessDatasetChange === 'function') {
      const flatRows = flattenProcessDatasetFromGraph(nodes, edges);
      onProcessDatasetChange(flatRows);
    }
    // eslint-disable-next-line
  }, [nodes, edges]);

  useEffect(() => {
    const prev = prevDataRef.current;
    if (
      !isEqual(prev.processItems, processItems) ||
      !isEqual(prev.controlItems, controlItems) ||
      !isEqual(prev.riskItems, riskItems)
    ) {
      // Data actually changed, reset nodes/edges
      const nextNodes = layoutNodes(nodesWithCallbacks, initialData.edges);
      setNodes(nextNodes);
      setEdges(initialData.edges);
      nodesRef.current = nextNodes;
      edgesRef.current = initialData.edges;
      prevDataRef.current = { processItems, controlItems, riskItems };
    } else {
      // If only callback changes, do nothing
    }
    // eslint-disable-next-line
  }, [processItems, controlItems, riskItems, nodesWithCallbacks, initialData.edges]);

  setNodesRef.current = setNodes;
  setEdgesRef.current = (updater) => {
    setEdges((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      edgesRef.current = next;
      return next;
    });
  };
  edgesRef.current = edges;
  nodesRef.current = nodes;

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) return;
      const item = JSON.parse(raw);

      if (item.nodeType === "riskNode") {
        setErrorMsg("Risk items must be dropped onto a Process node");
        return;
      }
      if (item.nodeType === "controlNode") {
        setErrorMsg("Control items must be dropped onto a Risk node");
        return;
      }
      if (item.nodeType !== "processNode") return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newId = `root-drop-${++idCounter}`;

      setNodes((prev) => [
        ...prev,
        {
          id: newId,
          type: "processNode",
          position,
          data: {
            ...item,
            _id: newId,
            onAddRisk: handleAddRisk,
            onAddControl: handleAddControl,
            onDropRisk: handleDropRisk,
            onDropControl: handleDropControl,
            onOpenPanel: openPanel,
          },
        },
      ]);
      kanbanRef.current?.removeItem(item.id);
    },
    [screenToFlowPosition, handleAddRisk, handleAddControl, handleDropRisk, handleDropControl, openPanel],
  );

  const relayout = useCallback(() => {
    const resetNodes = layoutNodes(nodesWithCallbacks, initialData.edges);
    setNodes(resetNodes);
    setEdges(initialData.edges);
    nodesRef.current = resetNodes;
    edgesRef.current = initialData.edges;
    setTimeout(() => fitView({ padding: 0.1 }), 50);
  }, [nodesWithCallbacks, initialData.edges, fitView]);

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#fdfdfd", position: "relative" }}>
      <button
        onClick={relayout}
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          padding: "8px 16px",
          backgroundColor: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}
      >
        Reset
      </button>
      <ReactFlow
        key={nodes.map(n => n.id).join('-')}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e0e0e0" />
        <Controls />
      </ReactFlow>

      <KanbanPanel
        ref={kanbanRef}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filterType={panelFilter}
        controlItems={controlItems}
        riskItems={riskItems}
      />

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={3000}
        onClose={() => setErrorMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setErrorMsg("")} severity="warning" variant="filled">
          {errorMsg}
        </Alert>
      </Snackbar>
    </div>
  );
}

export { FlowBoard };

export default function GRCReactFlow() {
  return (
    <ReactFlowProvider>
      <FlowBoard />
    </ReactFlowProvider>
  );
}
