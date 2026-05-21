/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  const rootSource = (processData && processData.length > 0)
    ? processData.map((item) => ({
        _id: item.id,
        title: item.title,
        department: item.department,
        owner: item.owner,
        risks: item.risks || [],
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
  // Mỗi risk-control là một node riêng biệt, kể cả khi ControlID giống nhau
  if (nestedControls && nestedControls.length > 0) {
    nestedControls.forEach((control, index) => {
      // Tạo id duy nhất cho mỗi risk-control
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

  // Không thêm node control từ controlData nữa (chỉ lấy từ nestedControls)

  // Combine all edges
  const edges = [...riskEdges, ...controlEdges];

  return { nodes: [...rootNodes, ...riskNodes, ...controlNodes], edges };
}

let idCounter = 100;

function FlowBoard({ processItems, controlItems, riskItems, onNodeAction }) {
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

    setNodesRef.current((prev) => [
      ...prev,
      {
        id: newId,
        type: "controlNode",
        position: { x: isRootParent ? -450 : parentPosition.x + 400, y: parentPosition.y },
        data: { ...controlItem, title: controlItem.name, _id: newId, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current },
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
  }, [positionNewNode]);

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
          data: { ...riskData, title: riskData.name, _id: newId, onDropControl: handleDropControl, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onOpenPanel: openPanel, showError },
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
  }, [handleDropControl]);

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
          data: { ...controlData, title: controlData.name, _id: newId, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current },
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
  }, [positionNewNode]);

  const handleDropRisk = useCallback((parentRootId, parentPosition, riskItem) => {
    const newId = `risk-drop-${++idCounter}`;
    setNodesRef.current((prev) => [
      ...prev,
      {
        id: newId,
        type: "riskNode",
        position: { x: parentPosition.x + 400, y: parentPosition.y },
        data: { ...riskItem, title: riskItem.name, _id: newId, onDropControl: handleDropControl, onDeleteNode: handleDeleteNodeRef.current, onEditNode: handleEditNodeRef.current, onOpenPanel: openPanel, showError },
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
  }, [handleDropControl, positionNewNode]);

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

  const nodesWithCallbacks = useMemo(
    () =>
      initialData.nodes.map((node) => {
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
      }),
    [initialData.nodes, handleAddRisk, handleAddControl, handleDropRisk, handleDropControl, handleDeleteNode, handleEditNode, showError, openPanel, onNodeAction],
  );

  const [nodes, setNodes] = useState(() => layoutNodes(nodesWithCallbacks, initialData.edges));
  const [edges, setEdges] = useState(initialData.edges);

  useEffect(() => {
    const nextNodes = layoutNodes(nodesWithCallbacks, initialData.edges);
    setNodes(nextNodes);
    setEdges(initialData.edges);
    nodesRef.current = nextNodes;
    edgesRef.current = initialData.edges;
  }, [nodesWithCallbacks, initialData.edges]);

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
