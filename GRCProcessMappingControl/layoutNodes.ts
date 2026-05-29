/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
const COL_X = { directControl: -700, processNode: 0, riskNode: 700, controlNode: 1400 };
const ROW_GAP = 280;

export function layoutNodes(nodes, edges) {
  const childrenOf = {};
  for (const edge of edges) {
    if (!childrenOf[edge.source]) childrenOf[edge.source] = [];
    childrenOf[edge.source].push(edge.target);
  }

  const nodeMap = {};
  for (const n of nodes) nodeMap[n.id] = n;

  const roots = nodes.filter((n) => n.type === "processNode");
  const connectedIds = new Set(edges.map((e) => e.target));
  const rootIds = new Set(roots.map((r) => r.id));
  for (const edge of edges) {
    if (rootIds.has(edge.target)) {
      connectedIds.add(edge.source);
    }
  }
  const orphanRisks = nodes.filter((n) => n.type === "riskNode" && !connectedIds.has(n.id));
  const orphanControls = nodes.filter((n) => n.type === "controlNode" && !connectedIds.has(n.id));

  const positioned = {};
  let globalY = 0;

  for (const root of roots) {
    const risks = (childrenOf[root.id] || [])
      .map((id) => nodeMap[id])
      .filter((n) => n && n.type === "riskNode");

    const directControls = (childrenOf[root.id] || [])
      .map((id) => nodeMap[id])
      .filter((n) => n && n.type === "controlNode");

    const incomingControls = edges
      .filter((e) => e.target === root.id)
      .map((e) => nodeMap[e.source])
      .filter((n) => n && n.type === "controlNode");

    const allDirectControls = [...directControls, ...incomingControls];

    const riskGroups = risks.map((risk) => {
      const controls = (childrenOf[risk.id] || [])
        .map((id) => nodeMap[id])
        .filter((n) => n && n.type === "controlNode");
      return { risk, controls };
    });

    const riskRows = riskGroups.reduce((sum, g) => sum + Math.max(1, g.controls.length), 0);
    const subtreeRows = Math.max(1, riskRows, allDirectControls.length);

    const subtreeHeight = subtreeRows * ROW_GAP;
    positioned[root.id] = {
      ...root,
      position: { x: COL_X.processNode, y: globalY + (subtreeHeight - ROW_GAP) / 2 },
    };

    let riskY = globalY;
    for (const { risk, controls } of riskGroups) {
      const groupHeight = Math.max(1, controls.length) * ROW_GAP;
      positioned[risk.id] = {
        ...risk,
        position: { x: COL_X.riskNode, y: riskY + (groupHeight - ROW_GAP) / 2 },
      };

      let ctrlY = riskY;
      for (const ctrl of controls) {
        positioned[ctrl.id] = {
          ...ctrl,
          position: { x: COL_X.controlNode, y: ctrlY },
        };
        ctrlY += ROW_GAP;
      }
      riskY += groupHeight;
    }

    const directBlockHeight = allDirectControls.length * ROW_GAP;
    const directStartY = globalY + (subtreeHeight - directBlockHeight) / 2;
    for (let i = 0; i < allDirectControls.length; i++) {
      const ctrl = allDirectControls[i];
      positioned[ctrl.id] = {
        ...ctrl,
        position: { x: COL_X.directControl, y: directStartY + i * ROW_GAP },
      };
    }

    globalY += subtreeHeight;
  }

  for (const risk of orphanRisks) {
    if (!positioned[risk.id]) {
      positioned[risk.id] = {
        ...risk,
        position: { x: COL_X.riskNode, y: globalY },
      };
      globalY += ROW_GAP;
    }
  }

  for (const ctrl of orphanControls) {
    if (!positioned[ctrl.id]) {
      positioned[ctrl.id] = {
        ...ctrl,
        position: { x: COL_X.controlNode, y: globalY },
      };
      globalY += ROW_GAP;
    }
  }

  return nodes.map((n) => positioned[n.id] || n);
}
