import type { ScenarioData } from '@/types/scenarios';

const ALL_NODE_IDS = [
  'meta_agent',
  'financial_aggregator',
  'capital_monitor',
  'credit_quality',
  'trend_analyzer',
  'regulatory_digest',
  'operational_risk',
  'supervisor',
  'hitl_gate',
  'report_compiler',
] as const;

export const SCENARIOS: ScenarioData[] = [
  {
    id: 'falcon-board',
    label: 'Falcon Board Q4',
    meetingType: 'Full Board',
    meetingDate: '2025-01-23',
    institutionName: 'Falcon Community Bank',
    expectedNodes: [...ALL_NODE_IDS],
    hitlRequired: true,
    visualColumns: [
      ['meta_agent'],
      ['financial_aggregator', 'capital_monitor', 'credit_quality'],
      ['trend_analyzer', 'regulatory_digest', 'operational_risk'],
      ['supervisor'],
      ['hitl_gate'],
      ['report_compiler'],
    ],
    agentDataSources: {
      meta_agent: ['Scenario configuration and meeting context', 'Dynamic graph topology rules'],
      financial_aggregator: ['NIM, ROA, ROE, non-interest income, efficiency ratio vs budget'],
      capital_monitor: ['CET1, Tier 1, Total Capital ratios', 'LCR and NSFR liquidity metrics'],
      credit_quality: ['NPL ratio, provision coverage, NCO ratio', 'CRE and C&I concentration data', 'Watchlist loan movements'],
      trend_analyzer: ['5-quarter rolling financial history', 'Prior period comparison data from populationBaseline.ts'],
      regulatory_digest: ['Open MRA list with severity and due dates', 'Upcoming examination schedule', 'Overdue item flags'],
      operational_risk: ['Incident log with severity classifications', 'Affected account counts', 'Vendor and third-party events'],
      supervisor: ['All agent outputs and flag counts', 'RAG status per section', 'Loop-back decision criteria'],
      hitl_gate: ['Draft report sections', 'Risk summary digest', 'CFO review queue'],
      report_compiler: ['All analyzed outputs', 'Executive narrative templates', 'Board package structure and formatting rules'],
    },
    financials: {
      nim: { actual: 3.21, budget: 3.4, priorPeriod: 3.44, variance: -0.19 },
      roa: { actual: 1.02, budget: 1.05, priorPeriod: 1.0, variance: -0.03 },
      roe: { actual: 10.8, budget: 11.0, priorPeriod: 10.5, variance: -0.2 },
      nonInterestIncome: {
        actual: 72.4,
        budget: 73.0,
        priorPeriod: 74.1,
        variance: -0.6,
      },
      efficiencyRatio: {
        actual: 61.4,
        budget: 59.8,
        priorPeriod: 60.4,
        variance: 1.6,
      },
    },
    capital: {
      cet1: { actual: 10.8, minimum: 4.5, wellCapitalized: 6.5 },
      tierOne: { actual: 11.9, minimum: 6.0, wellCapitalized: 8.0 },
      totalCapital: { actual: 13.4, minimum: 8.0, wellCapitalized: 10.0 },
      lcr: { actual: 112, minimum: 100 },
      nsfr: { actual: 109, minimum: 100 },
    },
    credit: {
      nplRatio: { actual: 1.84, priorPeriod: 1.41, peerMedian: 1.2 },
      provisionCoverageRatio: {
        actual: 118,
        priorPeriod: 126,
        peerMedian: 132,
      },
      ncoRatio: { actual: 0.42, priorPeriod: 0.31, peerMedian: 0.28 },
      concentrations: [
        { segment: 'CRE', percentage: 336, limit: 300, hhi: 0.34 },
        { segment: 'Construction & Development', percentage: 86, limit: 100, hhi: 0.18 },
        { segment: 'C&I', percentage: 142, limit: 175, hhi: 0.12 },
      ],
      watchlistMovements: [
        {
          loanId: 'CRE-10482',
          borrower: 'Harbor Office Partners',
          direction: 'downgrade',
          fromRating: 'Pass 6',
          toRating: 'Special Mention',
          balance: 18_600_000,
        },
        {
          loanId: 'CRE-20811',
          borrower: 'Redstone Retail Holdings',
          direction: 'downgrade',
          fromRating: 'Pass 5',
          toRating: 'Pass 6',
          balance: 11_200_000,
        },
        {
          loanId: 'CRE-31744',
          borrower: 'Lakeview Hospitality Group',
          direction: 'downgrade',
          fromRating: 'Pass 6',
          toRating: 'Substandard',
          balance: 9_800_000,
        },
      ],
    },
    regulatory: {
      mras: [
        {
          id: 'MRA-2024-01',
          description: 'CECL documentation',
          severity: 'moderate',
          dueDate: '2025-04-18',
          status: 'in_progress',
        },
        {
          id: 'MRA-2024-02',
          description: 'BSA/AML SAR timeliness',
          severity: 'serious',
          dueDate: '2025-01-05',
          status: 'overdue',
        },
      ],
      exams: [
        {
          examiner: 'OCC',
          scheduledDate: '2025-03-17',
          scope: 'Targeted BSA/AML and model risk follow-up',
          status: 'scheduled',
        },
      ],
    },
    incidents: [
      {
        summary:
          'Third-party file transfer misconfiguration exposed customer data for 1,200 deposit accounts; vendor contained the issue and completed remediation.',
        severity: 'critical',
        status: 'resolved',
        category: 'vendor_data_breach',
        affectedAccounts: 1200,
      },
    ],
  },
  {
    id: 'audit-committee',
    label: 'Audit Committee Mid-Cycle',
    meetingType: 'Audit Committee',
    meetingDate: '2025-02-14',
    institutionName: 'Falcon Community Bank',
    expectedNodes: [
      'meta_agent',
      'regulatory_digest',
      'operational_risk',
      'supervisor',
      'report_compiler',
    ],
    hitlRequired: false,
    visualColumns: [
      ['meta_agent'],
      ['regulatory_digest', 'operational_risk'],
      ['supervisor'],
      ['report_compiler'],
    ],
    agentDataSources: {
      meta_agent: ['Scenario configuration and meeting context', 'Dynamic graph topology rules'],
      regulatory_digest: ['Open MRA list with severity and due dates', 'Upcoming examination schedule', 'Audit coverage status'],
      operational_risk: ['Incident log with severity classifications', 'Affected account counts', 'Internal control gaps'],
      supervisor: ['All agent outputs and flag counts', 'RAG status per section', 'Loop-back decision criteria'],
      report_compiler: ['All analyzed outputs', 'Audit committee narrative templates', 'Board package structure'],
    },
    regulatory: {
      mras: [
        {
          id: 'MRA-2024-01',
          description: 'CECL documentation',
          severity: 'moderate',
          dueDate: '2025-04-18',
          status: 'in_progress',
        },
        {
          id: 'MRA-2024-02',
          description: 'BSA/AML SAR timeliness',
          severity: 'serious',
          dueDate: '2025-01-05',
          status: 'overdue',
        },
      ],
      exams: [
        {
          examiner: 'OCC',
          scheduledDate: '2025-03-17',
          scope: 'BSA/AML validation and issue remediation review',
          status: 'scheduled',
        },
      ],
      auditCoverage: [
        { area: 'BSA/AML', findings: 2, status: 'completed' },
        { area: 'Credit', findings: 0, status: 'completed' },
        { area: 'ITGC', findings: 1, status: 'completed' },
        { area: 'Vendor', findings: null, status: 'deferred' },
      ],
    },
  },
  {
    id: 'risk-flash',
    label: 'Risk Flash',
    meetingType: 'Risk Committee',
    meetingDate: '2025-03-06',
    institutionName: 'Falcon Community Bank',
    expectedNodes: [
      'meta_agent',
      'capital_monitor',
      'credit_quality',
      'report_compiler',
    ],
    hitlRequired: false,
    visualColumns: [
      ['meta_agent'],
      ['capital_monitor', 'credit_quality'],
      ['report_compiler'],
    ],
    agentDataSources: {
      meta_agent: ['Scenario configuration and meeting context', 'Dynamic graph topology rules'],
      capital_monitor: ['CET1, Tier 1, Total Capital ratios', 'LCR and NSFR liquidity metrics'],
      credit_quality: ['NPL ratio, provision coverage, NCO ratio', 'Concentration limits'],
      report_compiler: ['Capital and credit outputs', 'Risk committee flash report template'],
    },
    capital: {
      cet1: { actual: 11.2, minimum: 4.5, wellCapitalized: 6.5 },
      tierOne: { actual: 12.1, minimum: 6.0, wellCapitalized: 8.0 },
      totalCapital: { actual: 13.6, minimum: 8.0, wellCapitalized: 10.0 },
      lcr: { actual: 124, minimum: 100 },
      nsfr: { actual: 118, minimum: 100 },
    },
    credit: {
      nplRatio: { actual: 1.18, priorPeriod: 1.18, peerMedian: 1.2 },
      provisionCoverageRatio: {
        actual: 148,
        priorPeriod: 147,
        peerMedian: 145,
      },
      ncoRatio: { actual: 0.19, priorPeriod: 0.2, peerMedian: 0.22 },
      concentrations: [
        { segment: 'CRE', percentage: 262, limit: 300, hhi: 0.24 },
        { segment: 'Construction & Development', percentage: 61, limit: 100, hhi: 0.09 },
        { segment: 'C&I', percentage: 138, limit: 175, hhi: 0.11 },
      ],
      watchlistMovements: [],
    },
    regulatory: {
      mras: [],
      exams: [],
    },
  },
];

export function getScenario(id: string): ScenarioData {
  const scenario = SCENARIOS.find((item) => item.id === id);

  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}`);
  }

  return scenario;
}
