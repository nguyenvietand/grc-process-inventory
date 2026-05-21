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

const RISK_TEMPLATES = [
  { name: "Data Breach",             description: "Unauthorized access to sensitive customer data",          category: "Security",    owner: "CISO",          likelihood: "High",   impact: "High",   status: "Open"      },
  { name: "System Downtime",         description: "Unplanned outage affecting critical services",            category: "Operations",  owner: "SRE Team",      likelihood: "Medium", impact: "High",   status: "Mitigated" },
  { name: "Phishing Attack",         description: "Credential theft via targeted phishing campaigns",        category: "Security",    owner: "SOC Team",      likelihood: "High",   impact: "Medium", status: "Open"      },
  { name: "Vendor Lock-in",          description: "Over-reliance on a single cloud provider",               category: "Strategic",   owner: "CTO Office",    likelihood: "Medium", impact: "Medium", status: "Review"    },
  { name: "Insider Threat",          description: "Malicious or negligent actions by internal staff",       category: "Security",    owner: "HR & Security", likelihood: "Low",    impact: "High",   status: "Open"      },
  { name: "Compliance Violation",    description: "Failure to meet regulatory requirements",                category: "Compliance",  owner: "Legal Team",    likelihood: "Medium", impact: "High",   status: "Open"      },
  { name: "Supply Chain Attack",     description: "Compromise via third-party software or hardware",        category: "Security",    owner: "Procurement",   likelihood: "Low",    impact: "High",   status: "Review"    },
  { name: "Data Loss",               description: "Accidental or deliberate destruction of critical data",  category: "Operations",  owner: "IT Ops",        likelihood: "Low",    impact: "High",   status: "Mitigated" },
  { name: "Legacy System Risk",      description: "Vulnerabilities from unsupported legacy systems",        category: "Technology",  owner: "Platform Team", likelihood: "High",   impact: "Medium", status: "Open"      },
  { name: "API Exposure",            description: "Sensitive data exposed through unsecured APIs",          category: "Security",    owner: "Dev Team",      likelihood: "Medium", impact: "High",   status: "Open"      },
  { name: "DDoS Attack",             description: "Distributed denial-of-service disrupting availability",  category: "Security",    owner: "NetOps Team",   likelihood: "Medium", impact: "High",   status: "Mitigated" },
  { name: "Ransomware Infection",    description: "Malware encrypting critical business data for ransom",   category: "Security",    owner: "CISO",          likelihood: "High",   impact: "High",   status: "Open"      },
  { name: "Cloud Misconfiguration",  description: "Improper cloud settings exposing internal resources",    category: "Technology",  owner: "Cloud Team",    likelihood: "High",   impact: "Medium", status: "Review"    },
  { name: "Identity Theft",          description: "Fraudulent use of employee or customer credentials",     category: "Security",    owner: "IAM Team",      likelihood: "Medium", impact: "High",   status: "Open"      },
  { name: "Business Continuity Gap", description: "Inadequate recovery procedures for major incidents",     category: "Operations",  owner: "BCM Team",      likelihood: "Low",    impact: "High",   status: "Review"    },
];

const CONTROL_PAIRS = [
  [
    { name: "Firewall Policy",            description: "Network firewall rules and monitoring",                   category: "Security",    owner: "NetOps Team",   status: "Active" },
    { name: "Access Control Review",      description: "Quarterly review of user access permissions",            category: "Security",    owner: "IAM Team",      status: "Active" },
  ],
  [
    { name: "Disaster Recovery Plan",     description: "Automated failover and backup procedures",               category: "Operations",  owner: "SRE Team",      status: "Active" },
    { name: "Incident Response Policy",   description: "Documented steps for handling critical incidents",       category: "Operations",  owner: "IT Ops",        status: "Active" },
  ],
  [
    { name: "MFA Enforcement",            description: "Multi-factor authentication for all user accounts",      category: "Security",    owner: "IAM Team",      status: "Active" },
    { name: "Security Awareness",         description: "Regular phishing simulations and training",              category: "Security",    owner: "HR & Security", status: "Active" },
  ],
  [
    { name: "Vendor Assessment",          description: "Periodic third-party vendor risk evaluations",           category: "Procurement", owner: "Risk Team",     status: "Review" },
    { name: "Contract Review",            description: "Legal review of SLAs and exit clauses",                  category: "Legal",       owner: "Legal Team",    status: "Active" },
  ],
  [
    { name: "Privileged Access Mgmt",     description: "Controls for privileged account access and audit",       category: "Security",    owner: "IAM Team",      status: "Active" },
    { name: "Background Checks",          description: "Pre-employment screening for sensitive roles",           category: "HR",          owner: "HR Team",       status: "Active" },
  ],
  [
    { name: "Compliance Monitoring",      description: "Continuous monitoring of regulatory obligations",        category: "Compliance",  owner: "Legal Team",    status: "Active" },
    { name: "Audit Trail Logging",        description: "Immutable logs for all critical system events",          category: "Compliance",  owner: "SecOps",        status: "Active" },
  ],
  [
    { name: "Software Bill of Materials", description: "Inventory and vetting of third-party dependencies",      category: "Technology",  owner: "Dev Team",      status: "Review" },
    { name: "Dependency Scanning",        description: "Automated scanning for vulnerable packages",             category: "Technology",  owner: "DevSecOps",     status: "Active" },
  ],
  [
    { name: "Data Backup Policy",         description: "Automated daily backups with off-site replication",      category: "Operations",  owner: "IT Ops",        status: "Active" },
    { name: "Data Classification",        description: "Labelling and handling rules for sensitive data",        category: "Compliance",  owner: "Data Team",     status: "Active" },
  ],
  [
    { name: "Patch Management",           description: "Regular patching schedule for all systems",              category: "Technology",  owner: "Platform Team", status: "Active" },
    { name: "EOL System Inventory",       description: "Tracking and remediation of end-of-life systems",        category: "Technology",  owner: "IT Ops",        status: "Review" },
  ],
  [
    { name: "API Gateway Security",       description: "Rate limiting and auth enforcement on all API endpoints",category: "Security",    owner: "Dev Team",      status: "Active" },
    { name: "API Penetration Testing",    description: "Regular pen-tests targeting API attack surfaces",        category: "Security",    owner: "SecOps",        status: "Review" },
  ],
];

export const mockRiskNodes = Array.from({ length: 150 }, (_, i) => {
  const template = RISK_TEMPLATES[i % RISK_TEMPLATES.length];
  const cycle = Math.floor(i / RISK_TEMPLATES.length);
  const suffix = cycle > 0 ? ` ${cycle + 1}` : "";
  return {
    _id: `risk-${i + 1}`,
    parentId: "root-1",
    name: `${template.name}${suffix}`,
    description: template.description,
    category: template.category,
    owner: template.owner,
    likelihood: template.likelihood,
    impact: template.impact,
    status: template.status,
  };
});

export const mockControlNodes = Array.from({ length: 150 }, (_, i) => {
  const pair = CONTROL_PAIRS[i % CONTROL_PAIRS.length];
  const cycle = Math.floor(i / CONTROL_PAIRS.length);
  const suffix = cycle > 0 ? ` ${cycle + 1}` : "";
  return pair.map((ctrl, j) => ({
    _id: `control-${i * 2 + j + 1}`,
    parentId: `risk-${i + 1}`,
    parentModel: "Risk",
    name: `${ctrl.name}${suffix}`,
    description: ctrl.description,
    category: ctrl.category,
    owner: ctrl.owner,
    status: ctrl.status,
  }));
}).flat();
