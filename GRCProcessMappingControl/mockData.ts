/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export const mockProcessNodes = [
  {
    _id: "root-1",
    title: "IT Governance",
    department: "Information Technology",
    owner: "Alice Johnson",
  },
];

export const mockRiskNodes = [
  {
    _id: "risk-1",
    parentId: "root-1",
    name: "Data Breach",
    description: "Unauthorized access to sensitive customer data",
    category: "Security",
    owner: "CISCO",
    likelihood: "High",
    impact: "High",
    status: "Open",
  },
  {
    _id: "risk-2",
    parentId: "root-1",
    name: "System Downtime",
    description: "Unplanned outage affecting critical services",
    category: "Operations",
    owner: "AWS Team",
    likelihood: "Medium",
    impact: "High",
    status: "Mitigated",
  },
];

export const mockControlNodes = [
  {
    _id: "control-1",
    parentId: "risk-1",
    parentModel: "Risk",
    name: "Firewall Policy",
    description: "Network firewall rules and monitoring",
    category: "Security",
    owner: "NetOps Team",
    status: "Active",
  },
  {
    _id: "control-2",
    parentId: "risk-1",
    parentModel: "Risk",
    name: "Access Control Review",
    description: "Quarterly review of user access permissions",
    category: "Security",
    owner: "IAM Team",
    status: "Active",
  },
  {
    _id: "control-3",
    parentId: "risk-2",
    parentModel: "Risk",
    name: "Disaster Recovery Plan",
    description: "Automated failover and backup procedures",
    category: "Operations",
    owner: "SRE Team",
    status: "Active",
  },
];
