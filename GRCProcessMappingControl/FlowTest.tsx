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
import ResetIcon from "./ResetIcon";

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

  const riskNodes = [];
  const riskEdges = [];
  const riskMapping = {};
  const nestedControls = [];

  if (processData && processData.length > 0) {
    processData.forEach((process) => {
      if (process.risks && process.risks.length > 0) {
        process.risks.forEach((nestedRisk) => {
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

    const uniqueRiskIds = Object.keys(riskMapping);

    riskNodes.push(
      ...uniqueRiskIds.map((riskId, index) => {
        const riskDetail = riskData?.find((r) => r.id === riskId);
        const mappedRisk = riskMapping[riskId][0];
        const riskObject = mappedRisk?.riskObject || {};

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
  if (nestedControls && nestedControls.length > 0) {
    nestedControls.forEach((control, index) => {
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

  const edges = [...riskEdges, ...controlEdges];
  return { nodes: [...rootNodes, ...riskNodes, ...controlNodes], edges };
}

let idCounter = 100;

function FlowBoard({ processItems, controlItems, riskItems, processDatasetFlat, onNodeAction, onProcessDatasetChange, mode }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelFilter, setPanelFilter] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const showError = useCallback((msg) => setErrorMsg(msg), []);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const setNodesRef = useRef(null);
  const setEdgesRef = useRef(null);
  const edgesRef = useRef([]);
  const nodesRef = useRef([]);
  const kanbanRef = useRef(null);
  const handleDeleteNodeRef = useRef(null);
  const handleEditNodeRef = useRef(null);

  const ROW_GAP = 280;

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

  const handleDropControl = useCallback((parentId, parentPosition, controlItem) => {
    const incomingControlId = controlItem.originalControlId || controlItem.ControlID || controlItem.id;
    const currentNodes = nodesRef.current || [];
    const parentNode = currentNodes.find((n) => n.id === parentId);
    const isRootParent = parentNode && parentNode.type === "processNode";

    let existingNode = null;
    let existingEdge = null;

    if (isRootParent) {
      const incomingEdges = edgesRef.current.filter((e) => e.target === parentId);
      for (const e of incomingEdges) {
        const sourceNode = currentNodes.find((n) => n.id === e.source);
        if (sourceNode && sourceNode.type === "controlNode") {
          const existingId = sourceNode.data?.originalControlId || sourceNode.data?.ControlID || sourceNode.id;
          if (existingId === incomingControlId) {
            existingNode = sourceNode;
            existingEdge = e;
            break;
          }
        }
      }
    } else {
      const outgoingEdges = edgesRef.current.filter((e) => e.source === parentId);
      for (const e of outgoingEdges) {
        const targetNode = currentNodes.find((n) => n.id === e.target);
        if (targetNode && targetNode.type === "controlNode") {
          const existingId = targetNode.data?.originalControlId || targetNode.data?.ControlID || targetNode.id;
          if (existingId === incomingControlId) {
            existingNode = targetNode;
            existingEdge = e;
            break;
          }
        }
      }
    }

    const shouldReactivateRisk = parentNode && parentNode.type === "riskNode" && String(parentNode.data?.processRiskStatus || parentNode.data?.status || "").toLowerCase() === "retired";

    if (existingNode) {
      const currentStatus = String(existingNode.data?.RiskControlStatus || existingNode.data?.status || "").toLowerCase();
      if (currentStatus === "retired") {
        setNodesRef.current((prev) => prev.map((n) => {
          if (n.id === existingNode.id) return { ...n, data: { ...n.data, RiskControlStatus: "Active", status: "Active" } };
          if (shouldReactivateRisk && n.id === parentId) return { ...n, data: { ...n.data, processRiskStatus: "Active", status: "Active" } };
          return n;
        }));
        setEdgesRef.current((prev) => prev.map((e) => {
          if (e.id === existingEdge.id) return { ...e, style: getRiskControlEdgeStyle("Active") };
          if (shouldReactivateRisk && e.target === parentId) return { ...e, style: getProcessRiskEdgeStyle("Active") };
          return e;
        }));
        kanbanRef.current?.removeItem(controlItem.id);
        return;
      }
      showError("This Control already exists in this Risk!");
      return;
    }

    const newId = `control-drop-${++idCounter}`;

    setNodesRef.current((prev) => {
      let nextNodes = prev;
      if (shouldReactivateRisk) {
        nextNodes = nextNodes.map((n) => n.id === parentId ? { ...n, data: { ...n.data, processRiskStatus: "Active", status: "Active" } } : n);
      }
      return [
        ...nextNodes,
        {
          id: newId,
          type: "controlNode",
          position: { x: isRootParent ? -450 : parentPosition.x + 400, y: parentPosition.y },
          data: { ...controlItem, title: controlItem.name, _id: newId, originalControlId: incomingControlId, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onNodeAction },
        },
      ];
    });

    setEdgesRef.current((prev) => {
      let nextEdges = prev;
      if (shouldReactivateRisk) {
        nextEdges = nextEdges.map((e) => e.target === parentId ? { ...e, style: getProcessRiskEdgeStyle("Active") } : e);
      }
      if (isRootParent) {
        return [...nextEdges, { id: `edge-${newId}-to-${parentId}`, source: newId, target: parentId, type: "default", style: { stroke: "#00cc95", strokeWidth: 1.5 } }];
      } else {
        return [...nextEdges, { id: `edge-${parentId}-to-${newId}`, source: parentId, target: newId, type: "default", style: { stroke: "#00cc95", strokeWidth: 1.5 } }];
      }
    });

    kanbanRef.current?.removeItem(controlItem.id);
    positionNewNode(newId);
  }, [positionNewNode, onNodeAction, showError]);

  const handleAddRisk = useCallback((parentRootId, riskData) => {
    const incomingRiskId = riskData.originalRiskId || riskData.RiskID || riskData.id;
    const currentNodes = nodesRef.current || [];

    const targetEdges = edgesRef.current.filter((e) => e.source === parentRootId);
    let existingNode = null;
    let existingEdge = null;

    for (const e of targetEdges) {
      const targetNode = currentNodes.find((n) => n.id === e.target);
      if (targetNode && targetNode.type === "riskNode") {
        const existingId = targetNode.data?.originalRiskId || targetNode.data?.RiskID || targetNode.id;
        if (existingId === incomingRiskId) {
          existingNode = targetNode;
          existingEdge = e;
          break;
        }
      }
    }

    if (existingNode) {
      const currentStatus = String(existingNode.data?.processRiskStatus || existingNode.data?.status || "").toLowerCase();
      if (currentStatus === "retired") {
        setNodesRef.current((prev) => prev.map((n) => n.id === existingNode.id ? { ...n, data: { ...n.data, processRiskStatus: "Active", status: "Active" } } : n));
        setEdgesRef.current((prev) => prev.map((e) => e.id === existingEdge.id ? { ...e, style: getProcessRiskEdgeStyle("Active") } : e));
        return;
      }
      showError("This Risk already exists in this Process!");
      return;
    }

    const newId = `risk-new-${++idCounter}`;
    setNodesRef.current((prev) => {
      const riskCount = prev.filter((n) => n.type === "riskNode").length;
      return [
        ...prev,
        {
          id: newId,
          type: "riskNode",
          position: { x: 400, y: riskCount * 250 },
          data: { ...riskData, title: riskData.name, _id: newId, originalRiskId: incomingRiskId, onDropControl: handleDropControl, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onOpenPanel: openPanel, showError, onNodeAction },
        },
      ];
    });
    setEdgesRef.current((prev) => [
      ...prev,
      { id: `edge-${parentRootId}-to-${newId}`, source: parentRootId, target: newId, type: "default", style: { stroke: "#00cc95", strokeWidth: 1.5 } },
    ]);
    positionNewNode(newId);
  }, [handleDropControl, onNodeAction, openPanel, showError, positionNewNode]);

  const handleAddControl = useCallback((parentRootId, controlData) => {
    const incomingControlId = controlData.originalControlId || controlData.ControlID || controlData.id;
    const currentNodes = nodesRef.current || [];
    const parentNode = currentNodes.find((n) => n.id === parentRootId);

    const incomingEdges = edgesRef.current.filter((e) => e.target === parentRootId);
    let existingNode = null;
    let existingEdge = null;

    for (const e of incomingEdges) {
      const sourceNode = currentNodes.find((n) => n.id === e.source);
      if (sourceNode && sourceNode.type === "controlNode") {
        const existingId = sourceNode.data?.originalControlId || sourceNode.data?.ControlID || sourceNode.id;
        if (existingId === incomingControlId) {
          existingNode = sourceNode;
          existingEdge = e;
          break;
        }
      }
    }

    const shouldReactivateRisk = parentNode && parentNode.type === "riskNode" && String(parentNode.data?.processRiskStatus || parentNode.data?.status || "").toLowerCase() === "retired";

    if (existingNode) {
      const currentStatus = String(existingNode.data?.RiskControlStatus || existingNode.data?.status || "").toLowerCase();
      if (currentStatus === "retired") {
        setNodesRef.current((prev) => prev.map((n) => {
          if (n.id === existingNode.id) return { ...n, data: { ...n.data, RiskControlStatus: "Active", status: "Active" } };
          if (shouldReactivateRisk && n.id === parentRootId) return { ...n, data: { ...n.data, processRiskStatus: "Active", status: "Active" } };
          return n;
        }));
        setEdgesRef.current((prev) => prev.map((e) => {
          if (e.id === existingEdge.id) return { ...e, style: getRiskControlEdgeStyle("Active") };
          if (shouldReactivateRisk && e.target === parentRootId) return { ...e, style: getProcessRiskEdgeStyle("Active") };
          return e;
        }));
        return;
      }
      showError("This Control already exists in this Risk!");
      return;
    }

    const newId = `control-new-${++idCounter}`;

    setNodesRef.current((prev) => {
      let nextNodes = prev;
      if (shouldReactivateRisk) {
        nextNodes = nextNodes.map((n) => n.id === parentRootId ? { ...n, data: { ...n.data, processRiskStatus: "Active", status: "Active" } } : n);
      }
      const controlCount = nextNodes.filter((n) => n.type === "controlNode").length;
      return [
        ...nextNodes,
        {
          id: newId,
          type: "controlNode",
          position: { x: -450, y: controlCount * 250 },
          data: { ...controlData, title: controlData.name, _id: newId, originalControlId: incomingControlId, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onNodeAction },
        },
      ];
    });

    setEdgesRef.current((prev) => {
      let nextEdges = prev;
      if (shouldReactivateRisk) {
        nextEdges = nextEdges.map((e) => e.target === parentRootId ? { ...e, style: getProcessRiskEdgeStyle("Active") } : e);
      }
      return [
        ...nextEdges,
        { id: `edge-${newId}-to-${parentRootId}`, source: newId, target: parentRootId, type: "default", style: { stroke: "#00cc95", strokeWidth: 1.5 } },
      ];
    });

    positionNewNode(newId);
  }, [positionNewNode, onNodeAction, showError]);

  const handleDropRisk = useCallback((parentRootId, parentPosition, riskItem) => {
    const incomingRiskId = riskItem.originalRiskId || riskItem.RiskID || riskItem.id;
    const currentNodes = nodesRef.current || [];

    const targetEdges = edgesRef.current.filter((e) => e.source === parentRootId);
    let existingNode = null;
    let existingEdge = null;

    for (const e of targetEdges) {
      const targetNode = currentNodes.find((n) => n.id === e.target);
      if (targetNode && targetNode.type === "riskNode") {
        const existingId = targetNode.data?.originalRiskId || targetNode.data?.RiskID || targetNode.id;
        if (existingId === incomingRiskId) {
          existingNode = targetNode;
          existingEdge = e;
          break;
        }
      }
    }

    if (existingNode) {
      const currentStatus = String(existingNode.data?.processRiskStatus || existingNode.data?.status || "").toLowerCase();
      if (currentStatus === "retired") {
        setNodesRef.current((prev) => prev.map((n) => n.id === existingNode.id ? { ...n, data: { ...n.data, processRiskStatus: "Active", status: "Active" } } : n));
        setEdgesRef.current((prev) => prev.map((e) => e.id === existingEdge.id ? { ...e, style: getProcessRiskEdgeStyle("Active") } : e));
        kanbanRef.current?.removeItem(riskItem.id);
        return;
      }
      showError("This Risk already exists in this Process!");
      return;
    }

    const newId = `risk-drop-${++idCounter}`;
    setNodesRef.current((prev) => [
      ...prev,
      {
        id: newId,
        type: "riskNode",
        position: { x: parentPosition.x + 400, y: parentPosition.y },
        data: { ...riskItem, title: riskItem.name, _id: newId, originalRiskId: incomingRiskId, onDropControl: handleDropControl, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onOpenPanel: openPanel, showError, onNodeAction },
      },
    ]);
    setEdgesRef.current((prev) => [
      ...prev,
      { id: `edge-${parentRootId}-to-${newId}`, source: parentRootId, target: newId, type: "default", style: { stroke: "#00cc95", strokeWidth: 1.5 } },
    ]);
    kanbanRef.current?.removeItem(riskItem.id);
    positionNewNode(newId);
  }, [handleDropControl, positionNewNode, onNodeAction, openPanel, showError]);

  const initialData = useMemo(
    () => buildFlowData(processItems, mockProcessNodes, riskItems, controlItems),
    [processItems, riskItems, controlItems],
  );

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

  const prevDataRef = useRef({ processItems, controlItems, riskItems });

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
            mode,
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
            mode,
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
            mode,
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
          mode,
        },
      };
    });
  }, [initialData.nodes, handleAddRisk, handleAddControl, handleDropRisk, handleDropControl, handleDeleteNode, handleEditNode, showError, openPanel, onNodeAction, mode]);

  const [nodes, setNodes] = useState(() => layoutNodes(nodesWithCallbacks, initialData.edges));
  const [edges, setEdges] = useState(initialData.edges);

  function flattenProcessDatasetFromGraph(nodes, edges) {
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const processNodes = nodes.filter(n => n.type === 'processNode');
    const rows = [];

    const inputRows = Array.isArray(processDatasetFlat) ? processDatasetFlat : [];

    processNodes.forEach(proc => {
      const riskEdges = edges.filter(e => e.source === proc.id && nodeMap[e.target]?.type === 'riskNode');
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
        rows.push({
          ...processFields,
          RiskID: "",
          ProcessRiskStatus: "",
          RiskShortName: "",
          RiskDescription: "",
          RiskLikelihood: "",
          RiskImpact: "",
          RiskStatus: "",
          ControlID: "",
          RiskControlStatus: "",
          ControlName: "",
          ControlDesc: "",
          ControlCategory: "",
          ControlOwner: "",
          ControlStatus: "",
          ProcessRiskMarker: "",
          RiskControlMarker: "",
        });
      } else {
        riskEdges.forEach(e => {
          const riskNode = nodeMap[e.target];
          const riskId = riskNode.data.RiskID || riskNode.data.originalRiskId || riskNode.id;

          const originalRiskRows = inputRows.filter(r =>
            (r.CoreProcessID === proc.id || r.HeraclesProcessActivityID === proc.data.HeraclesProcessActivityID) &&
            r.RiskID === riskId
          );

          let processRiskMarker = "";
          const currentRiskStatus = String(riskNode.data.processRiskStatus || riskNode.data.status || "").toLowerCase();

          if (originalRiskRows.length === 0) {
            processRiskMarker = "add";
          } else {
            const wasAllRiskRetired = originalRiskRows.every(r => String(r.ProcessRiskStatus || "").toLowerCase() === "retired");
            if (wasAllRiskRetired && currentRiskStatus !== "retired") {
              processRiskMarker = "reactive";
            }
          }

          const controlEdges = edges.filter(ed => ed.source === riskNode.id && nodeMap[ed.target]?.type === 'controlNode');

          if (controlEdges.length === 0) {
            rows.push({
              ...processFields,
              RiskID: riskId,
              ProcessRiskStatus: riskNode.data.processRiskStatus || riskNode.data.status || "",
              RiskShortName: riskNode.data.name || riskNode.data.title || "",
              RiskDescription: riskNode.data.description || "",
              RiskLikelihood: riskNode.data.likelihood || "",
              RiskImpact: riskNode.data.impact || "",
              RiskStatus: riskNode.data.status || "",
              ControlID: "",
              RiskControlStatus: "",
              ControlName: "",
              ControlDesc: "",
              ControlCategory: "",
              ControlOwner: "",
              ControlStatus: "",
              ProcessRiskMarker: processRiskMarker,
              RiskControlMarker: "",
            });
          } else {
            controlEdges.forEach(ce => {
              const ctrl = nodeMap[ce.target];
              const controlId = ctrl.data.ControlID || ctrl.data.originalControlId || ctrl.id || "";

              const originalControlRow = originalRiskRows.find(r => r.ControlID === controlId);

              let riskControlMarker = "";
              const currentControlStatus = String(ctrl.data.RiskControlStatus || ctrl.data.status || "").toLowerCase();

              if (!originalControlRow) {
                riskControlMarker = "add";
              } else {
                const wasControlRetired = String(originalControlRow.RiskControlStatus || "").toLowerCase() === "retired";
                if (wasControlRetired && currentControlStatus !== "retired") {
                  riskControlMarker = "reactive";
                }
              }

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
                ProcessRiskMarker: processRiskMarker,
                RiskControlMarker: riskControlMarker,
              });
            });
          }
        });
      }
    });
    return rows;
  }

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
      const nextNodes = layoutNodes(nodesWithCallbacks, initialData.edges);
      setNodes(nextNodes);
      setEdges(initialData.edges);
      nodesRef.current = nextNodes;
      edgesRef.current = initialData.edges;
      prevDataRef.current = { processItems, controlItems, riskItems };
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
      <ReactFlow
        nodesDraggable={mode === 'edit'}
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
        <Controls
          position="bottom-left"
          showInteractive={mode === 'edit'}
          showZoom={true}
          showFitView={true}
        >
          {mode === 'edit' && (
            <button
              type="button"
              className="react-flow__controls-button"
              title="Reset"
              onClick={relayout}
              tabIndex={0}
              aria-label="Reset"
            >
              <ResetIcon />
            </button>)}
        </Controls>
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