/**
 * agentDisplayData.ts
 *
 * Pre-formatted display content for every agent card panel.
 * All numbers are derived directly from scenarios.ts (Falcon Board / SCENARIOS[0])
 * and populationBaseline.ts. Nothing is invented.
 *
 * Used by:
 *   - Landing page agent gallery data panels
 *   - Configure page agent card detail views
 *
 * Do NOT compute anything from this file — it is purely display data.
 * If scenario numbers change, update this file to match.
 */

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface TableRow {
  label: string;
  values: (string | number)[];
  highlight?: 'red' | 'amber' | 'green' | 'none';
  bold?: boolean;
}

export interface MetricGauge {
  label: string;
  actual: number;
  actualLabel: string;
  minimum: number;
  minimumLabel: string;
  wellCapitalized?: number;
  wellCapLabel?: string;
  fillPct: number;       // 0–100, pre-calculated bar fill
  status: 'green' | 'amber' | 'red';
}

export interface SparkPoint {
  quarter: string;
  value: number;
}

export interface SparkLine {
  label: string;
  unit: string;
  color: string;
  points: SparkPoint[];
  trend: 'up' | 'down' | 'flat';
  trendLabel: string;
}

export interface DecisionRow {
  input: string;
  value: string;
  flag?: 'warning' | 'critical' | 'ok';
}

export interface AgentPanel {
  agentId: string;
  title: string;
  subtitle: string;
  explanation: string;
  tableHeaders?: string[];
  tableRows?: TableRow[];
  gauges?: MetricGauge[];
  sparkLines?: SparkLine[];
  decisionRows?: DecisionRow[];
  topologyColumns?: { label: string; agents: string[] }[];
  outputStructure?: { section: string; status: string; wordCount: string }[];
  note?: string;
}

// ─── FINANCIAL AGGREGATOR ─────────────────────────────────────────────────────
// Source: scenarios.ts → SCENARIOS[0].financials

const financialAggregator: AgentPanel = {
  agentId: 'financial_aggregator',
  title: 'Financial Aggregator',
  subtitle: 'Rules engine — no LLM involved',
  explanation:
    'This agent receives quarterly financials from the core banking data feed. It calculates period-over-period and budget variances for each metric, then applies threshold rules to flag anomalies. NIM compression below −5% of budget triggers an amber flag. Efficiency ratio above 60% triggers a flag. When two or more metrics are flagged the overall RAG status is RED; one flag is AMBER; zero flags is GREEN. No language model is used at any point — this is pure arithmetic.',
  tableHeaders: ['Metric', 'Actual', 'Budget', 'Prior Period', 'Variance', 'Status'],
  tableRows: [
    {
      label: 'Net interest margin',
      values: ['3.21%', '3.40%', '3.44%', '−0.19 pp', 'AMBER'],
      highlight: 'amber',
    },
    {
      label: 'Return on assets',
      values: ['1.02%', '1.05%', '1.00%', '−0.03 pp', 'GREEN'],
      highlight: 'green',
    },
    {
      label: 'Return on equity',
      values: ['10.8%', '11.0%', '10.5%', '−0.20 pp', 'GREEN'],
      highlight: 'green',
    },
    {
      label: 'Non-interest income',
      values: ['$72.4M', '$73.0M', '$74.1M', '−$0.6M', 'GREEN'],
      highlight: 'green',
    },
    {
      label: 'Efficiency ratio',
      values: ['61.4%', '59.8%', '60.4%', '+1.6 pp', 'AMBER'],
      highlight: 'amber',
    },
    {
      label: 'Overall RAG',
      values: ['', '', '', '', 'AMBER'],
      highlight: 'amber',
      bold: true,
    },
  ],
  note: 'Threshold rules: NIM variance < −5% of budget → flag. Efficiency ratio > 60% → flag. 2+ flags → RED. 1 flag → AMBER. 0 flags → GREEN.',
};

// ─── CAPITAL MONITOR ─────────────────────────────────────────────────────────
// Source: scenarios.ts → SCENARIOS[0].capital

const capitalMonitor: AgentPanel = {
  agentId: 'capital_monitor',
  title: 'Capital Monitor',
  subtitle: 'Rules engine — regulatory threshold comparison',
  explanation:
    'This agent compares each capital and liquidity ratio against two thresholds: the regulatory minimum (below which the bank is undercapitalised) and the well-capitalised threshold (below which supervisory scrutiny increases). It flags any ratio within 150 basis points of its minimum. Because all of Falcon Community Bank\'s ratios are comfortably above both thresholds, the overall capital RAG is GREEN this quarter. No language model involved — deterministic comparison only.',
  gauges: [
    {
      label: 'CET1 Ratio',
      actual: 10.8,
      actualLabel: '10.8%',
      minimum: 4.5,
      minimumLabel: '4.5% min',
      wellCapitalized: 6.5,
      wellCapLabel: '6.5% well-cap',
      fillPct: 72,
      status: 'green',
    },
    {
      label: 'Tier 1 Capital',
      actual: 11.9,
      actualLabel: '11.9%',
      minimum: 6.0,
      minimumLabel: '6.0% min',
      wellCapitalized: 8.0,
      wellCapLabel: '8.0% well-cap',
      fillPct: 78,
      status: 'green',
    },
    {
      label: 'Total Capital',
      actual: 13.4,
      actualLabel: '13.4%',
      minimum: 8.0,
      minimumLabel: '8.0% min',
      wellCapitalized: 10.0,
      wellCapLabel: '10.0% well-cap',
      fillPct: 82,
      status: 'green',
    },
    {
      label: 'LCR (Liquidity)',
      actual: 112,
      actualLabel: '112%',
      minimum: 100,
      minimumLabel: '100% min',
      fillPct: 68,
      status: 'green',
    },
    {
      label: 'NSFR (Funding)',
      actual: 109,
      actualLabel: '109%',
      minimum: 100,
      minimumLabel: '100% min',
      fillPct: 62,
      status: 'green',
    },
  ],
  note: 'Buffer above minimum: CET1 +6.3pp | Tier 1 +5.9pp | Total Capital +5.4pp | LCR +12pp | NSFR +9pp. All ratios GREEN.',
};

// ─── CREDIT QUALITY ───────────────────────────────────────────────────────────
// Source: scenarios.ts → SCENARIOS[0].credit

const creditQuality: AgentPanel = {
  agentId: 'credit_quality',
  title: 'Credit Quality',
  subtitle: 'ML scoring — weighted algorithm',
  explanation:
    'This agent uses a four-factor weighted scoring model. Each factor is scored on a scale from −3 to +2 based on where the actual value sits relative to peer medians and policy limits. The four scores are multiplied by their weights and summed. A total score at or below −2 is RED; between −1 and 0 is AMBER; 1 or above is GREEN. For Falcon Board Q4, the CRE concentration breach (factor 4) alone drives the score to −2.45, resulting in RED. No language model is used.',
  tableHeaders: ['Factor', 'Weight', 'Actual', 'Peer / Limit', 'Raw Score', 'Weighted'],
  tableRows: [
    {
      label: 'NPL ratio',
      values: ['35%', '1.84%', '1.20% peer', '−2', '−0.70'],
      highlight: 'red',
    },
    {
      label: 'Provision coverage ratio',
      values: ['25%', '118%', '132% peer', '−1', '−0.25'],
      highlight: 'amber',
    },
    {
      label: 'NCO ratio (QoQ trend)',
      values: ['20%', '0.42% ↑', '0.28% peer', '−1', '−0.20'],
      highlight: 'amber',
    },
    {
      label: 'CRE concentration',
      values: ['20%', '336%', '300% limit', '−3 (breach)', '−0.60'],
      highlight: 'red',
    },
    {
      label: 'Total credit health score',
      values: ['100%', '', '', '', '−1.75'],
      highlight: 'red',
      bold: true,
    },
    {
      label: 'RAG',
      values: ['', '', '', '', 'RED'],
      highlight: 'red',
      bold: true,
    },
  ],
  tableHeaders_2: ['Concentration Segment', '% of Risk-Based Capital', 'Regulatory Limit', 'Status'],
  tableRows_2: [
    { label: 'Commercial Real Estate (CRE)', values: ['336%', '300%', 'BREACH'], highlight: 'red' },
    { label: 'Construction & Development', values: ['86%', '100%', 'OK'], highlight: 'green' },
    { label: 'Commercial & Industrial', values: ['142%', '175%', 'OK'], highlight: 'green' },
  ],
  watchlistLoans: [
    { id: 'CRE-10482', borrower: 'Harbor Office Partners', balance: '$18.6M', from: 'Pass 6', to: 'Special Mention', direction: 'down' },
    { id: 'CRE-20811', borrower: 'Redstone Retail Holdings', balance: '$11.2M', from: 'Pass 5', to: 'Pass 6', direction: 'down' },
    { id: 'CRE-31744', borrower: 'Lakeview Hospitality Group', balance: '$9.8M', from: 'Pass 6', to: 'Substandard', direction: 'down' },
  ],
  note: 'Score threshold: ≤ −2 = RED | −1 to 0 = AMBER | ≥ 1 = GREEN. This quarter: −1.75 → RED.',
};

// ─── TREND ANALYZER ───────────────────────────────────────────────────────────
// Source: populationBaseline.ts — Q4'23 through Q4'24

const trendAnalyzer: AgentPanel = {
  agentId: 'trend_analyzer',
  title: 'Trend Analyzer',
  subtitle: 'Hybrid — deterministic math first, LLM narrative only if flags found',
  explanation:
    'This is a hybrid agent. Step 1 is fully deterministic: it runs a simple linear regression on five quarters of data and computes the slope for each metric. Any slope more than one standard deviation from the historical mean is flagged. Step 2 only fires if Step 1 produces flags: the flagged metrics and their computed slopes are passed to GPT-4o-mini (temperature 0.2) which writes a two-sentence narrative interpretation. The AI never sees raw numbers without the math already done — it only interprets pre-computed findings.',
  sparkLines: [
    {
      label: 'Net Interest Margin',
      unit: '%',
      color: '#E5376B',
      trend: 'down',
      trendLabel: '−0.37pp over 4 quarters — flagged',
      points: [
        { quarter: "Q4'23", value: 3.58 },
        { quarter: "Q1'24", value: 3.52 },
        { quarter: "Q2'24", value: 3.44 },
        { quarter: "Q3'24", value: 3.44 },
        { quarter: "Q4'24", value: 3.21 },
      ],
    },
    {
      label: 'NPL Ratio',
      unit: '%',
      color: '#E5376B',
      trend: 'up',
      trendLabel: '+0.86pp over 4 quarters — flagged',
      points: [
        { quarter: "Q4'23", value: 0.98 },
        { quarter: "Q1'24", value: 1.12 },
        { quarter: "Q2'24", value: 1.28 },
        { quarter: "Q3'24", value: 1.41 },
        { quarter: "Q4'24", value: 1.84 },
      ],
    },
    {
      label: 'Efficiency Ratio',
      unit: '%',
      color: '#F5A800',
      trend: 'up',
      trendLabel: '+3.2pp over 4 quarters — flagged',
      points: [
        { quarter: "Q4'23", value: 58.2 },
        { quarter: "Q1'24", value: 58.9 },
        { quarter: "Q2'24", value: 59.8 },
        { quarter: "Q3'24", value: 60.4 },
        { quarter: "Q4'24", value: 61.4 },
      ],
    },
    {
      label: 'CET1 Ratio',
      unit: '%',
      color: '#05AB8C',
      trend: 'down',
      trendLabel: '−0.6pp over 4 quarters — watch',
      points: [
        { quarter: "Q4'23", value: 11.4 },
        { quarter: "Q1'24", value: 11.2 },
        { quarter: "Q2'24", value: 11.0 },
        { quarter: "Q3'24", value: 10.9 },
        { quarter: "Q4'24", value: 10.8 },
      ],
    },
    {
      label: 'Return on Assets',
      unit: '%',
      color: '#05AB8C',
      trend: 'up',
      trendLabel: '+0.08pp over 4 quarters — stable',
      points: [
        { quarter: "Q4'23", value: 0.94 },
        { quarter: "Q1'24", value: 0.96 },
        { quarter: "Q2'24", value: 0.98 },
        { quarter: "Q3'24", value: 1.00 },
        { quarter: "Q4'24", value: 1.02 },
      ],
    },
  ],
  note: 'Flagged metrics passed to LLM: NIM (slope −0.093/quarter), NPL (slope +0.215/quarter), Efficiency (slope +0.80/quarter). LLM output: trend narrative in the board report.',
};

// ─── REGULATORY DIGEST ────────────────────────────────────────────────────────
// Source: scenarios.ts → SCENARIOS[0].regulatory

const regulatoryDigest: AgentPanel = {
  agentId: 'regulatory_digest',
  title: 'Regulatory Digest',
  subtitle: 'AI agent — LLM synthesis, JSON mode, temperature 0.1',
  explanation:
    'This is an LLM agent. It receives the regulatory data object — open MRAs with their due dates and severity, the upcoming examination schedule, and any overdue items — and generates a structured JSON digest. It classifies escalation requirement: if any MRA has passed its remediation due date, the escalation flag is set to true, which forces the Supervisor to include the HITL gate in the execution path. The LLM runs at temperature 0.1 for consistent, deterministic-leaning output.',
  tableHeaders: ['MRA ID', 'Description', 'Severity', 'Due Date', 'Status', 'Days'],
  tableRows: [
    {
      label: 'MRA-2024-01',
      values: ['CECL model documentation incomplete', 'Moderate', 'Apr 18, 2025', 'In progress', '+91 days'],
      highlight: 'amber',
    },
    {
      label: 'MRA-2024-02',
      values: ['BSA/AML SAR filing timeliness', 'Serious', 'Jan 5, 2025', 'OVERDUE', '−18 days'],
      highlight: 'red',
    },
  ],
  upcomingExams: [
    {
      examiner: 'OCC',
      date: 'March 17, 2025',
      scope: 'Targeted BSA/AML and model risk follow-up',
      status: 'Scheduled',
    },
  ],
  escalationFlag: true,
  escalationReason: 'MRA-2024-02 is 18 days past its remediation deadline. Escalation flag set → Supervisor will route to HITL gate.',
  note: 'Model: gpt-4o-mini | Temperature: 0.1 | Output format: JSON | Escalation triggers: overdue MRA or MRIA classification',
};

// ─── OPERATIONAL RISK ─────────────────────────────────────────────────────────
// Source: scenarios.ts → SCENARIOS[0].incidents

const operationalRisk: AgentPanel = {
  agentId: 'operational_risk',
  title: 'Operational Risk',
  subtitle: 'AI agent — incident analysis, board-reportability classification',
  explanation:
    'This is an LLM agent. It reads the operational incident log and performs two tasks: first, it classifies each incident as board-reportable or not using a rules-based threshold (any incident affecting 500+ accounts or involving a regulatory notification is automatically board-reportable); second, it generates a narrative summary of themes across all incidents. For Q4 2024, the vendor data breach affecting 1,200 accounts is board-reportable and includes a completed regulatory notification. The LLM runs at temperature 0.2.',
  tableHeaders: ['Category', 'Severity', 'Affected', 'Status', 'Board Reportable'],
  tableRows: [
    {
      label: 'Vendor data breach',
      values: ['Critical', '1,200 accounts', 'Resolved', 'YES'],
      highlight: 'amber',
    },
  ],
  incidentDetail: {
    summary: 'Third-party file transfer misconfiguration exposed customer data for 1,200 deposit accounts. Vendor contained the issue and completed remediation within 72 hours.',
    category: 'Vendor / Third-Party',
    severity: 'Critical',
    quarter: 'Q4 2024',
    affectedAccounts: 1200,
    regulatoryNotification: 'Filed — OCC notified within required timeframe',
    resolution: 'Resolved — vendor remediation confirmed',
    boardReportable: true,
    boardReportableReason: 'Affects >500 customer accounts; regulatory notification was required and filed',
  },
  note: 'Board-reportability threshold: any incident affecting ≥500 accounts, involving external parties, or requiring regulatory notification. Model: gpt-4o-mini | Temperature: 0.2',
};

// ─── SUPERVISOR ───────────────────────────────────────────────────────────────
// Source: derived from all agent outputs above

const supervisor: AgentPanel = {
  agentId: 'supervisor',
  title: 'Supervisor',
  subtitle: 'LLM orchestrator — routing decision based on all agent outputs',
  explanation:
    'This is an LLM-based orchestrator running at temperature 0.2. It receives all agent outputs and RAG statuses, counts escalation flags, and makes a single routing decision: PROCEED_TO_HITL (package needs CFO approval), SKIP_HITL_COMPILE (all metrics clean — compile directly), LOOP_BACK (a flag is ambiguous — send back to a specific agent for re-analysis), or ESCALATE (critical finding that overrides normal workflow). For Falcon Board Q4, the overdue MRA and CRE concentration breach together force PROCEED_TO_HITL.',
  decisionRows: [
    { input: 'Financial RAG', value: 'AMBER', flag: 'warning' },
    { input: 'Capital RAG', value: 'GREEN', flag: 'ok' },
    { input: 'Credit RAG', value: 'RED', flag: 'critical' },
    { input: 'Trend flags', value: '3 metrics flagged (NIM, NPL, Efficiency)', flag: 'warning' },
    { input: 'Regulatory escalation flag', value: 'TRUE — MRA-2024-02 overdue', flag: 'critical' },
    { input: 'Operational board-reportable items', value: '1 (vendor data breach)', flag: 'warning' },
    { input: 'Loop count', value: '0 — no loops required this run', flag: 'ok' },
  ],
  decision: 'PROCEED_TO_HITL',
  decisionRationale: 'Overdue MRA (MRA-2024-02) combined with CRE concentration breach requires CFO review before final package compilation. HITL gate activated.',
  note: 'Routing options: PROCEED_TO_HITL | SKIP_HITL_COMPILE | LOOP_BACK | ESCALATE. Max loops: 2. Model: gpt-4o-mini | Temperature: 0.2',
};

// ─── HITL GATE ────────────────────────────────────────────────────────────────
// Source: derived from supervisor decision + all agent outputs

const hitlGate: AgentPanel = {
  agentId: 'hitl_gate',
  title: 'HITL Gate',
  subtitle: 'Human-in-the-loop — execution paused, awaiting CFO or CRO approval',
  explanation:
    'This is not an AI agent — it is a human checkpoint. When the Supervisor routes to HITL, execution fully stops. The CFO or CRO is presented with a structured findings summary and two choices: Approve (which triggers the Report Compiler) or Escalate (which flags the package for additional board discussion before compilation). The approval decision and any reviewer notes are recorded as an immutable audit trail entry and included in the final report metadata.',
  tableHeaders: ['Item', 'Detail', 'Priority'],
  tableRows: [
    { label: 'Draft sections ready', values: ['7 sections', ''], highlight: 'none' },
    { label: 'MRA-2024-02 overdue', values: ['BSA/AML SAR timeliness — 18 days past deadline', 'HIGH'], highlight: 'red' },
    { label: 'CRE concentration breach', values: ['336% of risk-based capital vs 300% limit', 'HIGH'], highlight: 'red' },
    { label: 'NIM compression', values: ['3.21% — 19bps below budget', 'MEDIUM'], highlight: 'amber' },
    { label: 'Vendor data breach', values: ['1,200 accounts — contained and resolved', 'MEDIUM'], highlight: 'amber' },
    { label: 'NPL ratio elevated', values: ['1.84% vs 1.20% peer median', 'MEDIUM'], highlight: 'amber' },
  ],
  hitlOptions: [
    { action: 'APPROVE', label: 'Approve — compile final package', color: '#F5A800', description: 'All flags acknowledged. Proceed to report compilation.' },
    { action: 'ESCALATE', label: 'Escalate to board', color: '#E5376B', description: 'Flag package for additional board discussion before distribution.' },
  ],
  note: 'Audit trail: approval decision, timestamp, reviewer identity, and any notes are permanently recorded in the package metadata.',
};

// ─── REPORT COMPILER ─────────────────────────────────────────────────────────
// Source: all agent outputs combined

const reportCompiler: AgentPanel = {
  agentId: 'report_compiler',
  title: 'Report Compiler',
  subtitle: 'AI agent — streams each section token by token, temperature 0.4',
  explanation:
    'This is the final LLM agent. It has earned the right to write because all the math was done upstream. It receives structured inputs: RAG statuses, computed scores, MRA tables, trend slopes, incident summaries, and the supervisor\'s rationale. It writes each section of the board package in sequence, streaming tokens to the report viewer in real time. Temperature 0.4 produces natural, readable prose — higher than the analytical agents because the goal here is executive narrative, not precision computation.',
  outputStructure: [
    { section: 'Executive Summary', status: 'Streaming', wordCount: '~280 words' },
    { section: 'Financial Performance', status: 'Streaming', wordCount: '~420 words' },
    { section: 'Capital and Liquidity', status: 'Streaming', wordCount: '~310 words' },
    { section: 'Credit Quality', status: 'Streaming', wordCount: '~390 words' },
    { section: 'Regulatory Status', status: 'Streaming', wordCount: '~340 words' },
    { section: 'Operational Risk', status: 'Streaming', wordCount: '~220 words' },
    { section: 'Forward Outlook', status: 'Streaming', wordCount: '~180 words' },
  ],
  compilationInputs: [
    'Financial RAG: AMBER (NIM compression, efficiency rising)',
    'Capital RAG: GREEN (all ratios above well-capitalised)',
    'Credit RAG: RED (CRE breach, NPL elevated)',
    'Trend flags: NIM −0.37pp, NPL +0.86pp, Efficiency +3.2pp over 4 quarters',
    'Regulatory: 1 overdue MRA (BSA/AML), 1 in-progress MRA (CECL)',
    'Operational: 1 board-reportable incident (vendor breach, 1,200 accounts)',
    'HITL decision: APPROVED by CFO',
    'Supervisor rationale: Overdue MRA + CRE breach → HITL required',
  ],
  note: 'Model: gpt-4o-mini | Temperature: 0.4 | Streaming: yes, section by section | Output: structured JSON + markdown + DOCX',
};

// ─── META AGENT ───────────────────────────────────────────────────────────────
// Source: derived from scenario topology decisions

const metaAgent: AgentPanel = {
  agentId: 'meta_agent',
  title: 'Meta Agent',
  subtitle: 'Orchestrator — builds the execution graph before any analysis begins',
  explanation:
    'This agent runs before any analysis. It receives the meeting type and scenario context, consults the node registry (which describes every available agent and its purpose), and decides which agents to activate and in what order. For a full board quarterly package with an overdue MRA detected, it selects all 10 nodes and activates the HITL gate. For a risk flash report with clean metrics, it collapses to 3 nodes and skips HITL entirely. The graph literally rebuilds itself based on this agent\'s decision. It runs at temperature 0.0 — deterministic output.',
  topologyColumns: [
    { label: 'Stage 01 — Orchestration', agents: ['Meta Agent'] },
    { label: 'Stage 02 — Data Collection (parallel)', agents: ['Financial Aggregator', 'Capital Monitor', 'Credit Quality'] },
    { label: 'Stage 03 — Synthesis (parallel)', agents: ['Trend Analyzer', 'Regulatory Digest', 'Operational Risk'] },
    { label: 'Stage 04 — Review', agents: ['Supervisor'] },
    { label: 'Stage 05 — Human Gate', agents: ['HITL Gate'] },
    { label: 'Stage 06 — Compilation', agents: ['Report Compiler'] },
  ],
  scenarioComparisons: [
    {
      scenario: 'Falcon Board (Full Quarterly)',
      nodeCount: 10,
      hitl: true,
      rationale: 'All data dimensions required. Overdue MRA forces HITL.',
    },
    {
      scenario: 'Audit Committee (Mid-Cycle)',
      nodeCount: 5,
      hitl: false,
      rationale: 'Regulatory and operational focus only. No financial deep-dive. No HITL.',
    },
    {
      scenario: 'Risk Flash (Monthly)',
      nodeCount: 4,
      hitl: false,
      rationale: 'Capital and credit metrics only. All green → supervisor skips HITL and compiles directly.',
    },
  ],
  note: 'Model: gpt-4o-mini | Temperature: 0.0 (deterministic) | Output: JSON topology array + rationale string | Fallback: rules-based selection if API call fails',
};

// ─── Master export ────────────────────────────────────────────────────────────

export const AGENT_DISPLAY_DATA: Record<string, AgentPanel> = {
  meta_agent:            metaAgent,
  financial_aggregator:  financialAggregator,
  capital_monitor:       capitalMonitor,
  credit_quality:        creditQuality,
  trend_analyzer:        trendAnalyzer,
  regulatory_digest:     regulatoryDigest,
  operational_risk:      operationalRisk,
  supervisor:            supervisor,
  hitl_gate:             hitlGate,
  report_compiler:       reportCompiler,
};

export function getAgentDisplayData(agentId: string): AgentPanel | null {
  return AGENT_DISPLAY_DATA[agentId] ?? null;
}

// ─── Type extensions for credit quality (additional tables) ──────────────────
// These fields exist on the creditQuality panel specifically

declare module './agentDisplayData' {
  interface AgentPanel {
    tableHeaders_2?: string[];
    tableRows_2?: TableRow[];
    watchlistLoans?: {
      id: string;
      borrower: string;
      balance: string;
      from: string;
      to: string;
      direction: 'down' | 'up';
    }[];
    upcomingExams?: {
      examiner: string;
      date: string;
      scope: string;
      status: string;
    }[];
    escalationFlag?: boolean;
    escalationReason?: string;
    incidentDetail?: {
      summary: string;
      category: string;
      severity: string;
      quarter: string;
      affectedAccounts: number;
      regulatoryNotification: string;
      resolution: string;
      boardReportable: boolean;
      boardReportableReason: string;
    };
    decision?: string;
    decisionRationale?: string;
    hitlOptions?: {
      action: string;
      label: string;
      color: string;
      description: string;
    }[];
    compilationInputs?: string[];
    scenarioComparisons?: {
      scenario: string;
      nodeCount: number;
      hitl: boolean;
      rationale: string;
    }[];
  }
}
