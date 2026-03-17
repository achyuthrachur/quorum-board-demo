/**
 * agentRawInputData.ts
 *
 * Raw input data for every agent — formatted exactly as it would arrive
 * from a core banking system, loan management system, exam management
 * portal, or incident log. This is the source data each agent reads
 * BEFORE any processing, scoring, or synthesis.
 *
 * Designed to be displayed in the "DATA" tab of each agent window.
 * All numbers are internally consistent with scenarios.ts and
 * populationBaseline.ts. Falcon Community Bank, Q4 2024.
 *
 * Do NOT compute from this file. It is purely display / demo data.
 */

// ─── Shared display types ─────────────────────────────────────────────────────

export type CellStatus = 'normal' | 'flag' | 'breach' | 'overdue' | 'ok' | 'dim';

export interface RawDataCell {
  value: string;
  status?: CellStatus;
  indent?: number;       // 0 = normal, 1 = sub-row, 2 = sub-sub-row
  bold?: boolean;
  mono?: boolean;        // render in monospace font
  sectionHeader?: boolean; // marks this cell as part of a section header row
}

export interface RawDataRow {
  cells: RawDataCell[];
  separator?: boolean;   // thin divider above this row
  sectionHeader?: boolean; // grey header row, full width label
}

export interface RawDataTable {
  id: string;
  title: string;
  sourceLabel: string;   // e.g. "Core Banking System — HORIZON v9.2"
  asOfDate: string;
  headers: string[];
  rows: RawDataRow[];
  footnote?: string;
}

export interface AgentRawInput {
  agentId: string;
  sourceSystem: string;  // The system this data originates from
  extractTimestamp: string;
  tables: RawDataTable[];
  keyFields?: {          // Highlighted summary fields shown above tables
    label: string;
    value: string;
    status?: CellStatus;
  }[];
}

// ─── FINANCIAL AGGREGATOR ─────────────────────────────────────────────────────
// Source: General Ledger extract + Budget variance file
// System: HORIZON Core Banking v9.2

export const financialAggregatorRawInput: AgentRawInput = {
  agentId: 'financial_aggregator',
  sourceSystem: 'HORIZON Core Banking v9.2 — General Ledger Module',
  extractTimestamp: '2025-01-08 06:00:04 UTC',
  keyFields: [
    { label: 'Period', value: 'Q4 2024 (Oct 1 – Dec 31, 2024)' },
    { label: 'Entity', value: 'Falcon Community Bank — Consolidated' },
    { label: 'Currency', value: 'USD (thousands)' },
    { label: 'Extract type', value: 'Period-end actuals vs approved budget' },
  ],
  tables: [
    {
      id: 'interest_income',
      title: 'Interest income and expense — Q4 2024',
      sourceLabel: 'GL Module — Interest Income / Expense Accounts',
      asOfDate: 'Dec 31, 2024',
      headers: ['Account', 'Account No.', 'Q4 2024 Actual ($K)', 'Q4 2024 Budget ($K)', 'Q3 2024 Actual ($K)', 'Variance ($K)', 'Variance %'],
      rows: [
        { cells: [{ value: 'INTEREST INCOME', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Loans and leases', indent: 1 }, { value: '4100', mono: true }, { value: '36,841' }, { value: '37,200' }, { value: '37,640' }, { value: '−359', status: 'flag' }, { value: '−1.0%', status: 'flag' }] },
        { cells: [{ value: '  Commercial real estate', indent: 2 }, { value: '4110', mono: true }, { value: '18,220' }, { value: '18,500' }, { value: '18,890' }, { value: '−280' }, { value: '−1.5%' }] },
        { cells: [{ value: '  Commercial and industrial', indent: 2 }, { value: '4120', mono: true }, { value: '9,840' }, { value: '9,900' }, { value: '9,960' }, { value: '−60' }, { value: '−0.6%' }] },
        { cells: [{ value: '  Consumer and residential', indent: 2 }, { value: '4130', mono: true }, { value: '6,480' }, { value: '6,400' }, { value: '6,350' }, { value: '+80', status: 'ok' }, { value: '+1.3%', status: 'ok' }] },
        { cells: [{ value: '  Construction and development', indent: 2 }, { value: '4140', mono: true }, { value: '2,301' }, { value: '2,400' }, { value: '2,440' }, { value: '−99' }, { value: '−4.1%' }] },
        { cells: [{ value: 'Investment securities', indent: 1 }, { value: '4200', mono: true }, { value: '3,892' }, { value: '3,750' }, { value: '3,710' }, { value: '+142', status: 'ok' }, { value: '+3.8%', status: 'ok' }] },
        { cells: [{ value: 'Fed funds sold / interest-bearing deposits', indent: 1 }, { value: '4300', mono: true }, { value: '491' }, { value: '450' }, { value: '422' }, { value: '+41', status: 'ok' }, { value: '+9.1%', status: 'ok' }] },
        { cells: [{ value: 'Total interest income', bold: true }, { value: '', mono: true }, { value: '41,224', bold: true }, { value: '41,400', bold: true }, { value: '41,772', bold: true }, { value: '−176', bold: true, status: 'flag' }, { value: '−0.4%', bold: true }], separator: true },

        { cells: [{ value: 'INTEREST EXPENSE', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Deposits — interest-bearing checking', indent: 1 }, { value: '5100', mono: true }, { value: '2,840' }, { value: '2,600' }, { value: '2,510' }, { value: '+240', status: 'flag' }, { value: '+9.2%', status: 'flag' }] },
        { cells: [{ value: 'Deposits — money market accounts', indent: 1 }, { value: '5110', mono: true }, { value: '6,920' }, { value: '6,200' }, { value: '5,980' }, { value: '+720', status: 'flag' }, { value: '+11.6%', status: 'flag' }] },
        { cells: [{ value: 'Deposits — certificates of deposit', indent: 1 }, { value: '5120', mono: true }, { value: '4,810' }, { value: '4,600' }, { value: '4,380' }, { value: '+210', status: 'flag' }, { value: '+4.6%', status: 'flag' }] },
        { cells: [{ value: 'FHLB advances', indent: 1 }, { value: '5200', mono: true }, { value: '1,920' }, { value: '1,800' }, { value: '1,760' }, { value: '+120' }, { value: '+6.8%' }] },
        { cells: [{ value: 'Subordinated debt', indent: 1 }, { value: '5300', mono: true }, { value: '1,310' }, { value: '1,310' }, { value: '1,310' }, { value: '0' }, { value: '0.0%' }] },
        { cells: [{ value: 'Total interest expense', bold: true }, { value: '', mono: true }, { value: '17,800', bold: true }, { value: '16,510', bold: true }, { value: '15,940', bold: true }, { value: '+1,290', bold: true, status: 'breach' }, { value: '+7.8%', bold: true, status: 'breach' }], separator: true },

        { cells: [{ value: 'NET INTEREST INCOME', bold: true }, { value: '' }, { value: '23,424', bold: true }, { value: '24,890', bold: true }, { value: '25,832', bold: true }, { value: '−1,466', bold: true, status: 'breach' }, { value: '−5.9%', bold: true, status: 'breach' }], separator: true },
        { cells: [{ value: 'Average earning assets ($M)', indent: 1 }, { value: '' }, { value: '728,400' }, { value: '731,200' }, { value: '751,800' }, { value: '−3.6%' }, { value: '' }] },
        { cells: [{ value: 'Net interest margin (annualized)', indent: 1, bold: true }, { value: '' }, { value: '3.21%', bold: true, status: 'flag' }, { value: '3.40%', bold: true }, { value: '3.44%', bold: true }, { value: '−0.19 pp', status: 'flag' }, { value: '−5.6% vs budget', status: 'flag' }] },
      ],
      footnote: 'NIM = (Net Interest Income × 4) / Average Earning Assets. Annualized. Budget sourced from approved FY2024 operating plan filed Jan 15, 2024.',
    },
    {
      id: 'noninterest',
      title: 'Non-interest income and expense — Q4 2024',
      sourceLabel: 'GL Module — Non-Interest Accounts',
      asOfDate: 'Dec 31, 2024',
      headers: ['Account', 'Account No.', 'Q4 2024 Actual ($K)', 'Q4 2024 Budget ($K)', 'Variance ($K)', 'Status'],
      rows: [
        { cells: [{ value: 'NON-INTEREST INCOME', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Service charges — deposit accounts', indent: 1 }, { value: '6100', mono: true }, { value: '18,420' }, { value: '18,800' }, { value: '−380', status: 'flag' }, { value: 'Below budget' }] },
        { cells: [{ value: 'Mortgage banking income', indent: 1 }, { value: '6200', mono: true }, { value: '14,210' }, { value: '14,400' }, { value: '−190' }, { value: 'On target' }] },
        { cells: [{ value: 'Wealth management and trust fees', indent: 1 }, { value: '6300', mono: true }, { value: '22,840' }, { value: '22,500' }, { value: '+340', status: 'ok' }, { value: 'Above budget', status: 'ok' }] },
        { cells: [{ value: 'Card income (net interchange)', indent: 1 }, { value: '6400', mono: true }, { value: '8,210' }, { value: '8,100' }, { value: '+110', status: 'ok' }, { value: 'Above budget', status: 'ok' }] },
        { cells: [{ value: 'Gain on sale of securities', indent: 1 }, { value: '6500', mono: true }, { value: '0' }, { value: '0' }, { value: '0' }, { value: '—' }] },
        { cells: [{ value: 'Other non-interest income', indent: 1 }, { value: '6900', mono: true }, { value: '8,720' }, { value: '9,200' }, { value: '−480', status: 'flag' }, { value: 'Below budget' }] },
        { cells: [{ value: 'Total non-interest income', bold: true }, { value: '' }, { value: '72,400', bold: true }, { value: '73,000', bold: true }, { value: '−600', bold: true, status: 'flag' }, { value: '' }], separator: true },

        { cells: [{ value: 'NON-INTEREST EXPENSE', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Salaries and employee benefits', indent: 1 }, { value: '7100', mono: true }, { value: '41,820' }, { value: '40,200' }, { value: '+1,620', status: 'flag' }, { value: 'Over budget' }] },
        { cells: [{ value: 'Occupancy and equipment', indent: 1 }, { value: '7200', mono: true }, { value: '12,440' }, { value: '12,200' }, { value: '+240' }, { value: 'Slight overage' }] },
        { cells: [{ value: 'Technology and data processing', indent: 1 }, { value: '7300', mono: true }, { value: '9,810' }, { value: '9,400' }, { value: '+410', status: 'flag' }, { value: 'Over budget' }] },
        { cells: [{ value: 'Professional fees', indent: 1 }, { value: '7400', mono: true }, { value: '4,280' }, { value: '4,100' }, { value: '+180' }, { value: 'Slight overage' }] },
        { cells: [{ value: 'Marketing and business development', indent: 1 }, { value: '7500', mono: true }, { value: '2,190' }, { value: '2,400' }, { value: '−210', status: 'ok' }, { value: 'Under budget', status: 'ok' }] },
        { cells: [{ value: 'FDIC insurance premiums', indent: 1 }, { value: '7600', mono: true }, { value: '1,840' }, { value: '1,820' }, { value: '+20' }, { value: 'On target' }] },
        { cells: [{ value: 'Other non-interest expense', indent: 1 }, { value: '7900', mono: true }, { value: '4,620' }, { value: '4,380' }, { value: '+240' }, { value: 'Slight overage' }] },
        { cells: [{ value: 'Total non-interest expense', bold: true }, { value: '' }, { value: '77,000', bold: true }, { value: '74,500', bold: true }, { value: '+2,500', bold: true, status: 'breach' }, { value: '' }], separator: true },
        { cells: [{ value: 'Efficiency ratio', bold: true, indent: 1 }, { value: '' }, { value: '61.4%', bold: true, status: 'flag' }, { value: '59.8%', bold: true }, { value: '+1.6 pp', bold: true, status: 'flag' }, { value: 'Above 60% threshold — FLAG', status: 'flag' }] },
      ],
      footnote: 'Efficiency ratio = Non-interest expense / (Net interest income + Non-interest income). Threshold: >60% triggers amber flag per board-approved policy.',
    },
  ],
};

// ─── CAPITAL MONITOR ─────────────────────────────────────────────────────────
// Source: Regulatory capital report (Call Report Schedule RC-R)
// System: FDICIA Reporting Module + Treasury Management System

export const capitalMonitorRawInput: AgentRawInput = {
  agentId: 'capital_monitor',
  sourceSystem: 'FDICIA Reporting Module + Treasury Management System',
  extractTimestamp: '2025-01-08 06:00:11 UTC',
  keyFields: [
    { label: 'Period', value: 'Q4 2024 — as of December 31, 2024' },
    { label: 'Entity', value: 'Falcon Community Bank — Unconsolidated' },
    { label: 'Regulator', value: 'OCC — National Bank Charter #29441' },
    { label: 'Capital plan cycle', value: 'FY2024 approved capital plan' },
  ],
  tables: [
    {
      id: 'capital_components',
      title: 'Regulatory capital components — December 31, 2024',
      sourceLabel: 'Call Report Schedule RC-R, Part I',
      asOfDate: 'Dec 31, 2024',
      headers: ['Capital Component', 'RC-R Line', 'Amount ($K)', 'Notes'],
      rows: [
        { cells: [{ value: 'COMMON EQUITY TIER 1 (CET1)', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Common stock and surplus', indent: 1 }, { value: '3.a', mono: true }, { value: '284,200' }, { value: '20M shares @ $14.21 par equivalent' }] },
        { cells: [{ value: 'Retained earnings', indent: 1 }, { value: '3.b', mono: true }, { value: '198,400' }, { value: 'Cumulative retained earnings net of dividends' }] },
        { cells: [{ value: 'Accumulated other comprehensive income (AOCI)', indent: 1 }, { value: '3.c', mono: true }, { value: '−22,100' }, { value: 'Unrealized HTM securities losses, net of tax' }] },
        { cells: [{ value: 'Less: Goodwill and other intangibles', indent: 1 }, { value: '4.a', mono: true }, { value: '−18,600' }, { value: 'Goodwill from 2019 branch acquisition ($14.2M) + core deposit intangibles ($4.4M)' }] },
        { cells: [{ value: 'Less: Deferred tax assets', indent: 1 }, { value: '4.b', mono: true }, { value: '−8,900' }, { value: 'DTAs from loan loss reserves exceeding regulatory limit' }] },
        { cells: [{ value: 'CET1 Capital', bold: true }, { value: '' }, { value: '433,000', bold: true }, { value: '' }], separator: true },
        { cells: [{ value: 'Risk-weighted assets (RWA)', indent: 1 }, { value: '' }, { value: '4,009,259', mono: true }, { value: 'See RWA breakdown table below' }] },
        { cells: [{ value: 'CET1 ratio', bold: true, indent: 1 }, { value: '' }, { value: '10.8%', bold: true, status: 'ok' }, { value: '433,000 / 4,009,259 = 10.80% | Minimum 4.5% | Well-cap 6.5% ✓', status: 'ok' }] },

        { cells: [{ value: 'ADDITIONAL TIER 1 CAPITAL', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Non-cumulative perpetual preferred stock', indent: 1 }, { value: '5.a', mono: true }, { value: '44,200' }, { value: 'Series A preferred, $50 par, 5.25% non-cumulative' }] },
        { cells: [{ value: 'Tier 1 Capital (CET1 + AT1)', bold: true }, { value: '' }, { value: '477,200', bold: true }, { value: '' }], separator: true },
        { cells: [{ value: 'Tier 1 ratio', bold: true, indent: 1 }, { value: '' }, { value: '11.9%', bold: true, status: 'ok' }, { value: '477,200 / 4,009,259 = 11.90% | Minimum 6.0% | Well-cap 8.0% ✓', status: 'ok' }] },

        { cells: [{ value: 'TIER 2 CAPITAL', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Allowance for loan and lease losses (ALLL)', indent: 1 }, { value: '6.a', mono: true }, { value: '58,400' }, { value: 'Limited to 1.25% of RWA per regulatory rules' }] },
        { cells: [{ value: 'Subordinated debt (remaining maturity > 5 years)', indent: 1 }, { value: '6.b', mono: true }, { value: '52,100' }, { value: '5.875% Sub Notes due 2029, issued Aug 2019' }] },
        { cells: [{ value: 'Total Capital (Tier 1 + Tier 2)', bold: true }, { value: '' }, { value: '587,700', bold: true }, { value: '' }], separator: true },
        { cells: [{ value: 'Total Capital ratio', bold: true, indent: 1 }, { value: '' }, { value: '14.7%', bold: true, status: 'ok' }, { value: '587,700 / 4,009,259 = 14.66% | Minimum 8.0% | Well-cap 10.0% ✓', status: 'ok' }] },
      ],
      footnote: 'Source: FDIC Call Report Schedule RC-R filed Jan 30, 2025 (preliminary). Final filing due Feb 15, 2025. Figures subject to audit adjustment.',
    },
    {
      id: 'rwa_breakdown',
      title: 'Risk-weighted assets by exposure category',
      sourceLabel: 'Call Report Schedule RC-R, Part II',
      asOfDate: 'Dec 31, 2024',
      headers: ['Exposure Category', 'Book Value ($K)', 'Risk Weight', 'Risk-Weighted Amount ($K)', '% of Total RWA'],
      rows: [
        { cells: [{ value: 'CRE — owner-occupied', indent: 1 }, { value: '312,400' }, { value: '100%' }, { value: '312,400' }, { value: '7.8%' }] },
        { cells: [{ value: 'CRE — non-owner-occupied', indent: 1 }, { value: '896,800' }, { value: '150%' }, { value: '1,345,200' }, { value: '33.6%', status: 'flag' }] },
        { cells: [{ value: 'C&I loans', indent: 1 }, { value: '689,400' }, { value: '100%' }, { value: '689,400' }, { value: '17.2%' }] },
        { cells: [{ value: 'Consumer loans', indent: 1 }, { value: '284,200' }, { value: '100%' }, { value: '284,200' }, { value: '7.1%' }] },
        { cells: [{ value: 'Residential mortgages — 1-4 family', indent: 1 }, { value: '412,800' }, { value: '50%' }, { value: '206,400' }, { value: '5.1%' }] },
        { cells: [{ value: 'Construction and development', indent: 1 }, { value: '224,100' }, { value: '150%' }, { value: '336,150' }, { value: '8.4%' }] },
        { cells: [{ value: 'Investment securities (AFS)', indent: 1 }, { value: '486,200' }, { value: '20%' }, { value: '97,240' }, { value: '2.4%' }] },
        { cells: [{ value: 'Investment securities (HTM)', indent: 1 }, { value: '312,400' }, { value: '20%' }, { value: '62,480' }, { value: '1.6%' }] },
        { cells: [{ value: 'Other assets', indent: 1 }, { value: '489,789' }, { value: '100%' }, { value: '489,789' }, { value: '12.2%' }] },
        { cells: [{ value: 'Operational risk charge (Standardized)', indent: 1 }, { value: '—' }, { value: 'n/a' }, { value: '186,000' }, { value: '4.6%' }] },
        { cells: [{ value: 'TOTAL RISK-WEIGHTED ASSETS', bold: true }, { value: '' }, { value: '' }, { value: '4,009,259', bold: true }, { value: '100%', bold: true }], separator: true },
      ],
      footnote: 'Non-owner-occupied CRE and C&D exposures carry 150% risk weight under Basel III standardized approach. CRE concentration >300% of risk-based capital drives elevated RWA.',
    },
    {
      id: 'liquidity',
      title: 'Liquidity coverage ratio (LCR) and NSFR — Q4 2024',
      sourceLabel: 'Treasury Management System — LCR / NSFR Module',
      asOfDate: 'Dec 31, 2024',
      headers: ['Component', 'Amount ($M)', 'Factor', 'Adjusted Amount ($M)', 'Notes'],
      rows: [
        { cells: [{ value: 'LCR — HIGH QUALITY LIQUID ASSETS (HQLA)', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Level 1 — Cash and Fed reserves', indent: 1 }, { value: '284.2' }, { value: '100%' }, { value: '284.2' }, { value: 'Held at Federal Reserve Bank of Chicago' }] },
        { cells: [{ value: 'Level 1 — US Treasuries and Agency MBS', indent: 1 }, { value: '312.4' }, { value: '100%' }, { value: '312.4' }, { value: 'HTM portfolio, avg maturity 4.2 years' }] },
        { cells: [{ value: 'Level 2A — GSE securities', indent: 1 }, { value: '124.8' }, { value: '85%' }, { value: '106.1' }, { value: 'AFS FNMA/FHLMC bonds, haircut applied' }] },
        { cells: [{ value: 'Total HQLA', bold: true }, { value: '721.4' }, { value: '' }, { value: '702.7', bold: true }, { value: '' }], separator: true },
        { cells: [{ value: 'LCR — NET CASH OUTFLOWS (30-day stress)', bold: true, sectionHeader: true }, { value: '' }, { value: '' }, { value: '' }, { value: '' }], sectionHeader: true },
        { cells: [{ value: 'Retail deposit outflows', indent: 1 }, { value: '2,841.6' }, { value: '3%–10%' }, { value: '284.2' }, { value: 'Stable deposits 3%, less-stable 10%' }] },
        { cells: [{ value: 'Wholesale deposit outflows', indent: 1 }, { value: '489.2' }, { value: '25%' }, { value: '122.3' }, { value: 'Operational deposits, non-financial corporates' }] },
        { cells: [{ value: 'Less: cash inflows', indent: 1 }, { value: '' }, { value: '' }, { value: '−34.8' }, { value: 'Contractual loan payments due within 30 days (capped at 75% of outflows)' }] },
        { cells: [{ value: 'Net cash outflows', bold: true }, { value: '' }, { value: '' }, { value: '371.7', bold: true }, { value: '' }], separator: true },
        { cells: [{ value: 'LCR = HQLA / Net Cash Outflows', bold: true, indent: 1 }, { value: '' }, { value: '' }, { value: '112%', bold: true, status: 'ok' }, { value: '702.7 / 371.7 × 100 = 112% | Minimum 100% ✓', status: 'ok' }] },
      ],
      footnote: 'NSFR = Available Stable Funding / Required Stable Funding = $1,284.2M / $1,177.2M = 109%. Minimum 100%. Both ratios above regulatory minimums. No flags.',
    },
  ],
};

// ─── CREDIT QUALITY ───────────────────────────────────────────────────────────
// Source: Loan Management System + Credit Review System
// System: LASER Loan Management v14.1

export const creditQualityRawInput: AgentRawInput = {
  agentId: 'credit_quality',
  sourceSystem: 'LASER Loan Management v14.1 + Credit Review System',
  extractTimestamp: '2025-01-08 06:00:18 UTC',
  keyFields: [
    { label: 'Period', value: 'Q4 2024 — as of December 31, 2024' },
    { label: 'Total loan portfolio', value: '$2,620,900K gross' },
    { label: 'ALLL balance', value: '$58,400K (2.23% of gross loans)' },
    { label: 'Classified asset ratio', value: '18.4% (criticized + classified / total capital)' },
  ],
  tables: [
    {
      id: 'portfolio_composition',
      title: 'Loan portfolio composition — December 31, 2024',
      sourceLabel: 'LASER LMS — Portfolio Summary Report',
      asOfDate: 'Dec 31, 2024',
      headers: ['Loan Segment', 'Gross Balance ($K)', '% of Total Loans', 'Avg Rate', 'NPL Balance ($K)', 'NPL %', 'ALLL Allocated ($K)'],
      rows: [
        { cells: [{ value: 'Commercial real estate', bold: false }, { value: '896,800' }, { value: '34.2%', status: 'breach' }, { value: '5.84%' }, { value: '22,420' }, { value: '2.50%', status: 'flag' }, { value: '26,600' }] },
        { cells: [{ value: '  Non-owner-occupied CRE', indent: 1 }, { value: '612,400' }, { value: '23.4%', status: 'flag' }, { value: '5.92%' }, { value: '18,220' }, { value: '2.97%', status: 'flag' }, { value: '19,800' }] },
        { cells: [{ value: '  Owner-occupied CRE', indent: 1 }, { value: '284,400' }, { value: '10.8%' }, { value: '5.68%' }, { value: '4,200' }, { value: '1.48%' }, { value: '6,800' }] },
        { cells: [{ value: 'Construction and development', bold: false }, { value: '224,100' }, { value: '8.5%' }, { value: '7.12%' }, { value: '4,820' }, { value: '2.15%', status: 'flag' }, { value: '7,200' }] },
        { cells: [{ value: 'Commercial and industrial', bold: false }, { value: '689,400' }, { value: '26.3%' }, { value: '6.42%' }, { value: '8,240' }, { value: '1.20%' }, { value: '12,800' }] },
        { cells: [{ value: 'Residential mortgage — 1-4 family', bold: false }, { value: '412,800' }, { value: '15.8%' }, { value: '4.88%' }, { value: '8,640' }, { value: '2.09%', status: 'flag' }, { value: '6,400' }] },
        { cells: [{ value: 'Consumer — installment and revolving', bold: false }, { value: '197,800' }, { value: '7.5%' }, { value: '8.24%' }, { value: '3,880' }, { value: '1.96%' }, { value: '3,200' }] },
        { cells: [{ value: 'Other loans', bold: false }, { value: '200,000' }, { value: '7.6%' }, { value: '5.10%' }, { value: '0' }, { value: '0.00%', status: 'ok' }, { value: '2,200' }] },
        { cells: [{ value: 'TOTAL GROSS LOANS', bold: true }, { value: '2,620,900', bold: true }, { value: '100.0%', bold: true }, { value: '6.02%' }, { value: '48,200', bold: true, status: 'flag' }, { value: '1.84%', bold: true, status: 'flag' }, { value: '58,400', bold: true }], separator: true },
        { cells: [{ value: 'Net loans (after ALLL)', indent: 1 }, { value: '2,562,500' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }] },
        { cells: [{ value: 'Provision coverage ratio (ALLL/NPL)', indent: 1, bold: true }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '121%', bold: true, status: 'flag' }, { value: 'Peer median 132% — below peer' }] },
      ],
      footnote: 'CRE segment = 34.2% of total loans. Policy limit = 300% of risk-based capital ($432.9M). CRE balance of $896.8M = 207% — concentration ratio calculation uses risk-based capital denominator (see concentration table).',
    },
    {
      id: 'credit_quality_metrics',
      title: 'Credit quality ratios — quarterly comparison',
      sourceLabel: 'LASER LMS — Credit Quality Report, peer comparison from UBPR',
      asOfDate: 'Dec 31, 2024',
      headers: ['Metric', 'Q4 2024', 'Q3 2024', 'Q2 2024', 'Q1 2024', 'Q4 2023', 'Peer Median Q4 2024', 'Policy Limit'],
      rows: [
        { cells: [{ value: 'Non-performing loan ratio', bold: true }, { value: '1.84%', status: 'breach' }, { value: '1.41%' }, { value: '1.28%' }, { value: '1.12%' }, { value: '0.98%' }, { value: '1.20%' }, { value: 'Watch >1.50%' }] },
        { cells: [{ value: 'Provision coverage ratio (ALLL/NPL)' }, { value: '121%', status: 'flag' }, { value: '126%' }, { value: '132%' }, { value: '140%' }, { value: '148%' }, { value: '132%' }, { value: 'Minimum 100%' }] },
        { cells: [{ value: 'Net charge-off ratio (annualized)' }, { value: '0.42%', status: 'flag' }, { value: '0.31%' }, { value: '0.28%' }, { value: '0.24%' }, { value: '0.19%' }, { value: '0.28%' }, { value: 'Watch >0.40%' }] },
        { cells: [{ value: 'Special mention loans / total loans' }, { value: '3.42%', status: 'flag' }, { value: '2.18%' }, { value: '1.84%' }, { value: '1.62%' }, { value: '1.40%' }, { value: '2.10%' }, { value: '—' }] },
        { cells: [{ value: 'Substandard loans / total loans' }, { value: '2.84%', status: 'flag' }, { value: '1.96%' }, { value: '1.62%' }, { value: '1.48%' }, { value: '1.22%' }, { value: '1.80%' }, { value: '—' }] },
        { cells: [{ value: 'Net charge-offs Q4 2024 ($K)', bold: true }, { value: '2,748', status: 'flag' }, { value: '2,024' }, { value: '1,820' }, { value: '1,572' }, { value: '1,240' }, { value: '—' }, { value: '—' }] },
      ],
      footnote: 'Peer data sourced from FFIEC UBPR peer group 2 (community banks $1B–$3B total assets, Q3 2024 peer data, latest available). NCO ratio annualized: (Q4 net charge-offs × 4) / average gross loans.',
    },
    {
      id: 'watchlist_detail',
      title: 'Watchlist and classified loan movements — Q4 2024',
      sourceLabel: 'Credit Review System — Quarterly Migration Report',
      asOfDate: 'Dec 31, 2024',
      headers: ['Loan ID', 'Borrower Name', 'Segment', 'Balance ($K)', 'Prior Rating', 'Current Rating', 'Days Past Due', 'Collateral Type', 'LTV', 'Action Required'],
      rows: [
        { cells: [{ value: 'CRE-10482', mono: true }, { value: 'Harbor Office Partners LLC' }, { value: 'NOO-CRE' }, { value: '18,600', status: 'flag' }, { value: 'Pass 6' }, { value: 'Special Mention', status: 'flag' }, { value: '0' }, { value: 'Office building, downtown' }, { value: '68%' }, { value: 'Enhanced monitoring; 90-day review' }] },
        { cells: [{ value: 'CRE-20811', mono: true }, { value: 'Redstone Retail Holdings Inc.' }, { value: 'NOO-CRE' }, { value: '11,200', status: 'flag' }, { value: 'Pass 5' }, { value: 'Pass 6', status: 'flag' }, { value: '0' }, { value: 'Strip mall, suburban' }, { value: '74%' }, { value: 'Quarterly financial statement review required' }] },
        { cells: [{ value: 'CRE-31744', mono: true }, { value: 'Lakeview Hospitality Group' }, { value: 'NOO-CRE' }, { value: '9,800', status: 'breach' }, { value: 'Pass 6' }, { value: 'Substandard', status: 'breach' }, { value: '32' }, { value: 'Hotel, suburban market' }, { value: '81%', status: 'breach' }, { value: 'Specific reserve allocation; workout referral pending' }] },
        { cells: [{ value: 'CRE-44021', mono: true }, { value: 'Summit Industrial Park' }, { value: 'NOO-CRE' }, { value: '7,400' }, { value: 'Pass 5' }, { value: 'Pass 5' }, { value: '0' }, { value: 'Industrial / warehouse' }, { value: '58%', status: 'ok' }, { value: 'No action required — annual review Jan 2025' }] },
        { cells: [{ value: 'CI-08821', mono: true }, { value: 'Metro Building Supplies Co.' }, { value: 'C&I' }, { value: '4,200', status: 'flag' }, { value: 'Pass 6' }, { value: 'Special Mention', status: 'flag' }, { value: '0' }, { value: 'Blanket UCC, A/R and inventory' }, { value: 'n/a' }, { value: 'Borrowing base certificate delinquent — cure period active' }] },
      ],
      footnote: 'Pass 1–5 = pass credits, no watchlist action. Pass 6 = criticized — enhanced monitoring. Special Mention = potential weakness identified by examiner or management. Substandard = well-defined weakness, full collection questionable. LTV = loan-to-value as of most recent appraisal.',
    },
  ],
};

// ─── TREND ANALYZER ───────────────────────────────────────────────────────────
// Source: Historical reporting database — 5-quarter extract
// System: Management Reporting Platform (MRP) — Historical Financials

export const trendAnalyzerRawInput: AgentRawInput = {
  agentId: 'trend_analyzer',
  sourceSystem: 'Management Reporting Platform (MRP) — Historical Financials',
  extractTimestamp: '2025-01-08 06:00:22 UTC',
  keyFields: [
    { label: 'Period covered', value: "Q4 2023 through Q4 2024 (5 quarters)" },
    { label: 'Regression method', value: 'Ordinary least squares (OLS) linear regression, slope per quarter' },
    { label: 'Flag threshold', value: 'Slope > 1 standard deviation from 12-quarter historical mean' },
    { label: 'Flagged metrics this run', value: '3 of 6 metrics flagged (NIM, NPL, Efficiency)' },
  ],
  tables: [
    {
      id: 'five_quarter_history',
      title: "Five-quarter metric history — Q4'23 through Q4'24",
      sourceLabel: 'MRP Historical Extract — Population Baseline Dataset',
      asOfDate: 'Dec 31, 2024',
      headers: ['Metric', "Q4'23", "Q1'24", "Q2'24", "Q3'24", "Q4'24", 'QoQ Change', 'Linear Slope / Quarter', 'Flagged?'],
      rows: [
        { cells: [{ value: 'Net interest margin', bold: true }, { value: '3.58%' }, { value: '3.52%' }, { value: '3.44%' }, { value: '3.44%' }, { value: '3.21%', status: 'breach' }, { value: '−0.23 pp', status: 'breach' }, { value: '−0.093 / qtr', status: 'flag' }, { value: 'YES — declining', status: 'breach' }] },
        { cells: [{ value: 'NPL ratio', bold: true }, { value: '0.98%' }, { value: '1.12%' }, { value: '1.28%' }, { value: '1.41%' }, { value: '1.84%', status: 'breach' }, { value: '+0.43 pp', status: 'breach' }, { value: '+0.215 / qtr', status: 'flag' }, { value: 'YES — rising', status: 'breach' }] },
        { cells: [{ value: 'Efficiency ratio', bold: true }, { value: '58.2%' }, { value: '58.9%' }, { value: '59.8%' }, { value: '60.4%' }, { value: '61.4%', status: 'flag' }, { value: '+1.0 pp', status: 'flag' }, { value: '+0.80 / qtr', status: 'flag' }, { value: 'YES — worsening', status: 'flag' }] },
        { cells: [{ value: 'CET1 ratio', bold: false }, { value: '11.4%' }, { value: '11.2%' }, { value: '11.0%' }, { value: '10.9%' }, { value: '10.8%', status: 'flag' }, { value: '−0.10 pp' }, { value: '−0.150 / qtr' }, { value: 'Watch — mild decline' }] },
        { cells: [{ value: 'Return on assets' }, { value: '0.94%' }, { value: '0.96%' }, { value: '0.98%' }, { value: '1.00%' }, { value: '1.02%', status: 'ok' }, { value: '+0.02 pp', status: 'ok' }, { value: '+0.020 / qtr' }, { value: 'No — improving', status: 'ok' }] },
        { cells: [{ value: 'Return on equity' }, { value: '9.8%' }, { value: '10.0%' }, { value: '10.2%' }, { value: '10.5%' }, { value: '10.8%', status: 'ok' }, { value: '+0.30 pp', status: 'ok' }, { value: '+0.250 / qtr' }, { value: 'No — improving', status: 'ok' }] },
      ],
      footnote: 'OLS regression computed over 5-quarter window. Flag threshold = slope ≥ 0.05 standard deviation units from 12-quarter trailing mean slope. NIM slope −0.093/qtr vs trailing mean −0.018/qtr (4.2σ). NPL slope +0.215/qtr vs trailing mean +0.028/qtr (6.8σ). Efficiency slope +0.80/qtr vs trailing mean +0.12/qtr (3.4σ).',
    },
    {
      id: 'regression_detail',
      title: 'OLS regression detail — flagged metrics only',
      sourceLabel: 'MRP Analytics Engine — Regression Output',
      asOfDate: 'Jan 8, 2025',
      headers: ['Metric', 'Intercept', 'Slope', 'R²', 'P-value', 'Std Error', 'σ from Hist Mean', 'Narrative trigger'],
      rows: [
        { cells: [{ value: 'NIM' }, { value: '3.612%' }, { value: '−0.093 / qtr', status: 'flag' }, { value: '0.94' }, { value: '0.008' }, { value: '0.021' }, { value: '4.2σ', status: 'flag' }, { value: 'LLM narrative generated: structural compression story' }] },
        { cells: [{ value: 'NPL' }, { value: '0.712%' }, { value: '+0.215 / qtr', status: 'breach' }, { value: '0.97' }, { value: '0.002' }, { value: '0.028' }, { value: '6.8σ', status: 'breach' }, { value: 'LLM narrative generated: CRE-driven deterioration' }] },
        { cells: [{ value: 'Efficiency' }, { value: '57.4%' }, { value: '+0.80 / qtr', status: 'flag' }, { value: '0.98' }, { value: '0.005' }, { value: '0.142' }, { value: '3.4σ', status: 'flag' }, { value: 'LLM narrative generated: expense creep / revenue lag' }] },
      ],
      footnote: 'P-value < 0.05 required for narrative generation. All three flagged metrics meet this threshold. R² > 0.90 for all three, indicating strong linear fit over the 5-quarter window — not noise.',
    },
  ],
};

// ─── REGULATORY DIGEST ────────────────────────────────────────────────────────
// Source: Examination Management System + Internal MRA Tracking
// System: RegTrak Examination Portal v4.2

export const regulatoryDigestRawInput: AgentRawInput = {
  agentId: 'regulatory_digest',
  sourceSystem: 'RegTrak Examination Portal v4.2 + Internal MRA Tracking Workbook',
  extractTimestamp: '2025-01-08 06:00:26 UTC',
  keyFields: [
    { label: 'Open MRAs', value: '2 (1 overdue, 1 in progress)' },
    { label: 'Open MRIAs', value: '0' },
    { label: 'Escalation flag', value: 'TRUE — MRA-2024-02 past due date', status: 'breach' },
    { label: 'Next scheduled exam', value: 'OCC — March 17, 2025' },
  ],
  tables: [
    {
      id: 'mra_detail',
      title: 'Open matters requiring attention — as of January 8, 2025',
      sourceLabel: 'RegTrak Examination Portal — Open Items Register',
      asOfDate: 'Jan 8, 2025',
      headers: ['MRA ID', 'Originating Exam', 'Finding Description', 'Severity', 'Assigned Owner', 'Original Due Date', 'Status', 'Days +/−', 'Remediation Notes'],
      rows: [
        {
          cells: [
            { value: 'MRA-2024-01', mono: true, status: 'flag' },
            { value: 'OCC Safety & Soundness — Oct 2024' },
            { value: 'CECL model documentation incomplete — methodology paper does not satisfy SR 11-7 documentation standards for model development' },
            { value: 'Moderate' },
            { value: 'Chief Model Risk Officer' },
            { value: 'Apr 18, 2025' },
            { value: 'In progress', status: 'flag' },
            { value: '+91 days remaining' },
            { value: 'Gap analysis complete. Methodology paper 60% drafted. External MRM consultant engaged Jan 6, 2025.' },
          ],
        },
        {
          cells: [
            { value: 'MRA-2024-02', mono: true, status: 'breach' },
            { value: 'OCC Safety & Soundness — Oct 2024' },
            { value: 'BSA/AML transaction monitoring system — SAR filing timeliness below 90% threshold. 14 of 18 SARs filed within 30-day window (78% compliance rate)' },
            { value: 'Serious', status: 'breach' },
            { value: 'BSA Officer' },
            { value: 'Jan 5, 2025', status: 'breach' },
            { value: 'OVERDUE', status: 'breach' },
            { value: '−18 days', status: 'breach' },
            { value: 'Extension request submitted to OCC Jan 6, 2025. Root cause: staffing gap in BSA unit (2 FTE vacancies). Corrective hire offer extended Dec 28.' },
          ],
        },
      ],
      footnote: 'MRA = Matter Requiring Attention (OCC terminology). MRIA = Matter Requiring Immediate Attention (escalated). Overdue MRAs trigger HITL gate in Sentinel execution workflow. Source data extract run Jan 8, 2025 at 06:00 UTC.',
    },
    {
      id: 'exam_history',
      title: 'Examination history and upcoming schedule',
      sourceLabel: 'RegTrak — Examination Calendar',
      asOfDate: 'Jan 8, 2025',
      headers: ['Examiner', 'Exam Type', 'Date', 'Scope', 'Outcome / Status', 'MRAs Issued', 'MRIAs Issued'],
      rows: [
        { cells: [{ value: 'OCC' }, { value: 'Safety & Soundness — Full Scope' }, { value: 'Oct 14–Nov 2, 2024' }, { value: 'Full scope annual examination including capital adequacy, asset quality, management, earnings, liquidity, sensitivity to market risk (CAMELS)' }, { value: 'Report issued Dec 18, 2024' }, { value: '2', status: 'flag' }, { value: '0', status: 'ok' }] },
        { cells: [{ value: 'OCC' }, { value: 'BSA/AML Targeted' }, { value: 'Mar 17–Apr 4, 2025' }, { value: 'Targeted follow-up: BSA/AML program effectiveness, SAR filing timeliness, MRA-2024-02 remediation verification, model risk (MRA-2024-01 documentation)' }, { value: 'Scheduled — not yet commenced', status: 'flag' }, { value: 'TBD' }, { value: 'TBD' }] },
        { cells: [{ value: 'FDIC' }, { value: 'CRA' }, { value: 'Q3 2023' }, { value: 'Community Reinvestment Act performance evaluation' }, { value: 'Satisfactory rating' }, { value: '0', status: 'ok' }, { value: '0', status: 'ok' }] },
        { cells: [{ value: 'State DFI' }, { value: 'Consumer Compliance' }, { value: 'Q2 2023' }, { value: 'Fair lending, UDAP, HMDA data integrity' }, { value: 'Satisfactory — 1 observation (non-MRA)' }, { value: '0', status: 'ok' }, { value: '0', status: 'ok' }] },
      ],
      footnote: 'Next OCC examination commences March 17, 2025. Overdue MRA-2024-02 will be primary focus. Board should expect examiner inquiry into BSA staffing and SAR timeliness metrics at exam entry meeting.',
    },
  ],
};

// ─── OPERATIONAL RISK ─────────────────────────────────────────────────────────
// Source: Operational Risk Incident Management System
// System: OpRisk Pro v3.8 — Incident Register

export const operationalRiskRawInput: AgentRawInput = {
  agentId: 'operational_risk',
  sourceSystem: 'OpRisk Pro v3.8 — Incident Register + Vendor Management System',
  extractTimestamp: '2025-01-08 06:00:29 UTC',
  keyFields: [
    { label: 'Q4 2024 incidents opened', value: '6 total (1 critical, 2 high, 3 medium/low)' },
    { label: 'Board-reportable', value: '1 (vendor data breach)', status: 'flag' },
    { label: 'Regulatory notifications filed', value: '1 (OCC — vendor breach)' },
    { label: 'Open remediation items', value: '3 across 2 incidents' },
  ],
  tables: [
    {
      id: 'incident_register',
      title: 'Operational risk incident register — Q4 2024',
      sourceLabel: 'OpRisk Pro — Q4 2024 Incident Summary',
      asOfDate: 'Dec 31, 2024',
      headers: ['Incident ID', 'Date Opened', 'Category', 'Subcategory', 'Severity', 'Description', 'Affected Accounts', 'Financial Loss ($K)', 'Status', 'Board Reportable'],
      rows: [
        {
          cells: [
            { value: 'INC-2024-112', mono: true, status: 'flag' },
            { value: 'Nov 14, 2024' },
            { value: 'Vendor / Third-Party' },
            { value: 'Data breach — file transfer misconfiguration' },
            { value: 'Critical', status: 'flag' },
            { value: 'Third-party payroll processor misconfigured SFTP credentials exposing read access to deposit account data extract for 1,200 consumer accounts. Data included name, address, last 4 of account number. No SSNs or full account numbers exposed.' },
            { value: '1,200', status: 'flag' },
            { value: '0 direct' },
            { value: 'Resolved — Dec 2, 2024' },
            { value: 'YES', status: 'flag' },
          ],
        },
        {
          cells: [
            { value: 'INC-2024-118', mono: true },
            { value: 'Nov 28, 2024' },
            { value: 'Fraud' },
            { value: 'Check fraud — counterfeit checks' },
            { value: 'High' },
            { value: 'Series of 8 counterfeit checks presented on commercial demand deposit accounts. Detected by positive pay exception. 6 of 8 stopped at presentment. 2 paid — recovery initiated.' },
            { value: '8' },
            { value: '42.4' },
            { value: 'Resolved — full recovery confirmed Jan 3, 2025' },
            { value: 'No — below $100K threshold' },
          ],
        },
        {
          cells: [
            { value: 'INC-2024-121', mono: true },
            { value: 'Dec 4, 2024' },
            { value: 'Technology' },
            { value: 'Core banking system — unplanned outage' },
            { value: 'Medium' },
            { value: 'HORIZON core banking unavailable 4 hours 22 minutes on Dec 4. Root cause: failed storage array controller. All transactions queued and processed post-restoration. No data loss.' },
            { value: '0' },
            { value: '0' },
            { value: 'Resolved — RCA complete, replacement parts ordered' },
            { value: 'No — duration under 8-hour threshold' },
          ],
        },
        {
          cells: [
            { value: 'INC-2024-124', mono: true },
            { value: 'Dec 11, 2024' },
            { value: 'Process / Execution' },
            { value: 'Wire transfer — processing error' },
            { value: 'Medium' },
            { value: '2 wire transfers ($280K combined) processed to incorrect beneficiary accounts due to operator data entry error. Both recalled successfully. No loss.' },
            { value: '2' },
            { value: '0' },
            { value: 'Resolved — process controls updated' },
            { value: 'No' },
          ],
        },
      ],
      footnote: 'Board-reportability threshold: any incident affecting ≥500 customer accounts, financial loss >$100K, regulatory notification required, or reputational impact assessment HIGH or CRITICAL. INC-2024-112 meets threshold (account count + regulatory notification).',
    },
    {
      id: 'vendor_breach_detail',
      title: 'INC-2024-112 — Vendor data breach: full incident report',
      sourceLabel: 'OpRisk Pro — Incident Detail Report + Vendor Management System',
      asOfDate: 'Dec 31, 2024',
      headers: ['Field', 'Detail'],
      rows: [
        { cells: [{ value: 'Incident ID', bold: true, mono: true }, { value: 'INC-2024-112' }] },
        { cells: [{ value: 'Vendor name' }, { value: 'PayrollConnect Inc. — third-party HR/payroll processor' }] },
        { cells: [{ value: 'Vendor tier' }, { value: 'Tier 2 — High-risk (access to customer PII)' }] },
        { cells: [{ value: 'Last vendor risk assessment' }, { value: 'March 2024 — Satisfactory' }] },
        { cells: [{ value: 'Date of incident' }, { value: 'November 9, 2024 (unauthorized access window)' }] },
        { cells: [{ value: 'Date detected' }, { value: 'November 14, 2024 (5-day gap before detection)', status: 'flag' }] },
        { cells: [{ value: 'Data exposed' }, { value: 'Name, mailing address, last 4 digits of account number for 1,200 consumer deposit accounts' }] },
        { cells: [{ value: 'Data NOT exposed' }, { value: 'Full account numbers, SSNs, dates of birth, balances, transaction history' }] },
        { cells: [{ value: 'Root cause' }, { value: 'SFTP credentials for monthly data extract not rotated after employee departure at PayrollConnect. Former employee retained read access to Falcon data directory.' }] },
        { cells: [{ value: 'Containment actions' }, { value: 'SFTP access revoked Nov 14. All credentials rotated Nov 15. Data extract file confirmed deleted by vendor Nov 18.' }] },
        { cells: [{ value: 'Customer notification' }, { value: '1,200 customers notified by mail Dec 1, 2024. Credit monitoring offered 12 months at bank expense (~$14,400 cost).' }] },
        { cells: [{ value: 'Regulatory notification — OCC' }, { value: 'Filed Nov 19, 2024 (within required 36-hour window from confirmation)' }] },
        { cells: [{ value: 'Regulatory notification — State DFI' }, { value: 'Filed Nov 19, 2024' }] },
        { cells: [{ value: 'Known fraud or misuse detected' }, { value: 'None as of Jan 8, 2025 (90-day monitoring period ongoing)' }] },
        { cells: [{ value: 'Total direct loss' }, { value: '$14,400 (customer credit monitoring)' }] },
        { cells: [{ value: 'Remediation status' }, { value: 'Resolved — Dec 2, 2024. Vendor contract amended. Annual SFTP credential audit added to vendor oversight program.' }] },
        { cells: [{ value: 'Board reportability ruling' }, { value: 'YES — >500 accounts affected + regulatory notification filed', status: 'flag' }] },
      ],
      footnote: 'Incident closed December 2, 2024. 90-day monitoring period ends February 12, 2025. No escalation to MRIA required by regulator as of filing date.',
    },
  ],
};

// ─── SUPERVISOR ───────────────────────────────────────────────────────────────
// Source: All upstream agent output objects
// System: Sentinel Graph Execution Engine — Supervisor Input Payload

export const supervisorRawInput: AgentRawInput = {
  agentId: 'supervisor',
  sourceSystem: 'Sentinel Execution Engine — Aggregated Agent Output Payload',
  extractTimestamp: '2025-01-08 06:01:44 UTC',
  keyFields: [
    { label: 'Agents completed', value: '7 of 10 (Financial, Capital, Credit, Trend, Regulatory, Operational, Supervisor)' },
    { label: 'RED flags', value: '2 (Credit quality, Regulatory escalation)' },
    { label: 'AMBER flags', value: '3 (Financial, Trend, Operational)' },
    { label: 'Routing decision', value: 'PROCEED_TO_HITL', status: 'flag' },
  ],
  tables: [
    {
      id: 'supervisor_input_payload',
      title: 'Aggregated agent outputs — supervisor input payload',
      sourceLabel: 'Sentinel Graph Engine — supervisor_input_payload.json',
      asOfDate: 'Jan 8, 2025 06:01 UTC',
      headers: ['Agent', 'RAG Status', 'Key Flags', 'Escalation Required', 'Output Summary'],
      rows: [
        { cells: [{ value: 'Financial Aggregator' }, { value: 'AMBER', status: 'flag' }, { value: 'NIM −5.6% vs budget; Efficiency 61.4% (>60% threshold)' }, { value: 'No' }, { value: '2 flags identified. No escalation trigger.' }] },
        { cells: [{ value: 'Capital Monitor' }, { value: 'GREEN', status: 'ok' }, { value: 'None — all ratios above well-capitalised thresholds' }, { value: 'No', status: 'ok' }, { value: 'CET1 10.8%, LCR 112%, NSFR 109%. All clear.' }] },
        { cells: [{ value: 'Credit Quality' }, { value: 'RED', status: 'breach' }, { value: 'NPL 1.84% (>1.50% watch); CRE concentration 336% (>300% policy limit); NCO 0.42% (>0.40% threshold)' }, { value: 'No (score −1.75, above −2.0 HITL trigger)' }, { value: 'Score −1.75. RED. CRE breach is primary driver.' }] },
        { cells: [{ value: 'Trend Analyzer' }, { value: 'AMBER', status: 'flag' }, { value: 'NIM declining 4 consecutive quarters (slope −0.093/qtr, 4.2σ); NPL rising (slope +0.215/qtr, 6.8σ); Efficiency rising (3.4σ)' }, { value: 'No' }, { value: '3 of 6 metrics flagged. LLM narrative generated for each.' }] },
        { cells: [{ value: 'Regulatory Digest' }, { value: 'RED', status: 'breach' }, { value: 'MRA-2024-02 overdue by 18 days; OCC exam scheduled March 17' }, { value: 'YES — overdue MRA', status: 'breach' }, { value: 'Escalation flag = TRUE. Forces HITL routing.' }] },
        { cells: [{ value: 'Operational Risk' }, { value: 'AMBER', status: 'flag' }, { value: 'INC-2024-112 (vendor breach) board-reportable' }, { value: 'No' }, { value: '1 board-reportable item. No HITL trigger from this agent alone.' }] },
      ],
      footnote: 'Supervisor decision logic: any RED rating with an escalation flag = PROCEED_TO_HITL. Any RED without escalation flag + AMBER = also PROCEED_TO_HITL. All GREEN or only AMBER = SKIP_HITL_COMPILE. This run: RED from regulatory + escalation flag = PROCEED_TO_HITL.',
    },
    {
      id: 'routing_decision_log',
      title: 'Routing decision — full decision log',
      sourceLabel: 'Sentinel Execution Engine — Supervisor Decision Output',
      asOfDate: 'Jan 8, 2025 06:01 UTC',
      headers: ['Decision Factor', 'Evaluated', 'Result', 'Weight', 'Contribution'],
      rows: [
        { cells: [{ value: 'Any MRIA classification' }, { value: 'Checked' }, { value: 'No MRIA present', status: 'ok' }, { value: 'Mandatory' }, { value: 'No impact' }] },
        { cells: [{ value: 'Any overdue MRA' }, { value: 'Checked' }, { value: 'MRA-2024-02 overdue 18 days', status: 'breach' }, { value: 'HIGH' }, { value: 'Forces HITL → PROCEED_TO_HITL', status: 'breach' }] },
        { cells: [{ value: 'Credit health score ≤ −2' }, { value: 'Checked' }, { value: 'Score = −1.75 (above −2.0 threshold)', status: 'flag' }, { value: 'MEDIUM' }, { value: 'Alone would not force HITL — but combined with reg flag, confirms' }] },
        { cells: [{ value: 'Capital ratio within 150bps of minimum' }, { value: 'Checked' }, { value: 'All ratios >6pp above minimum', status: 'ok' }, { value: 'MEDIUM' }, { value: 'No impact' }] },
        { cells: [{ value: 'Loop count ≥ 2' }, { value: 'Checked' }, { value: 'Loop count = 0', status: 'ok' }, { value: 'LOW' }, { value: 'No impact' }] },
        { cells: [{ value: 'Board-reportable incident present' }, { value: 'Checked' }, { value: '1 incident (INC-2024-112)' }, { value: 'LOW' }, { value: 'Noted — escalated in report narrative' }] },
        { cells: [{ value: 'FINAL ROUTING DECISION', bold: true }, { value: '' }, { value: 'PROCEED_TO_HITL', bold: true, status: 'flag' }, { value: '' }, { value: 'Rationale: overdue MRA-2024-02 is the primary trigger', bold: true }], separator: true },
      ],
      footnote: 'Decision generated by gpt-4o-mini at temperature 0.2. JSON-structured output. Routing options: PROCEED_TO_HITL | SKIP_HITL_COMPILE | LOOP_BACK | ESCALATE. Max 2 loop-backs before forced HITL.',
    },
  ],
};

// ─── HITL GATE ────────────────────────────────────────────────────────────────
// Source: All upstream outputs + draft report sections
// System: Sentinel HITL Review Queue

export const hitlGateRawInput: AgentRawInput = {
  agentId: 'hitl_gate',
  sourceSystem: 'Sentinel HITL Review Queue — CFO Review Package',
  extractTimestamp: '2025-01-08 06:01:52 UTC (execution paused)',
  keyFields: [
    { label: 'Status', value: 'PAUSED — awaiting CFO approval' },
    { label: 'Items requiring review', value: '5 flagged items across 3 agents' },
    { label: 'Draft sections ready', value: '7 of 7 sections compiled' },
    { label: 'Estimated compilation time post-approval', value: '~45 seconds' },
  ],
  tables: [
    {
      id: 'review_queue',
      title: 'CFO review queue — items requiring acknowledgment before compilation',
      sourceLabel: 'Sentinel HITL Gate — Aggregated Flags',
      asOfDate: 'Jan 8, 2025 06:01 UTC',
      headers: ['Priority', 'Item', 'Source Agent', 'Detail', 'Action Required'],
      rows: [
        { cells: [{ value: 'HIGH', status: 'breach' }, { value: 'MRA-2024-02 overdue', status: 'breach' }, { value: 'Regulatory Digest' }, { value: 'BSA/AML SAR timeliness MRA past due 18 days (due Jan 5, 2025). Extension request pending OCC approval. Next exam March 17.' }, { value: 'Acknowledge — include in board narrative', status: 'breach' }] },
        { cells: [{ value: 'HIGH', status: 'breach' }, { value: 'CRE concentration policy breach', status: 'breach' }, { value: 'Credit Quality' }, { value: 'CRE at 336% of risk-based capital vs 300% policy limit. 3 watchlist credits totaling $39.6M downgraded in Q4.' }, { value: 'Acknowledge — confirm remediation plan to be presented at board', status: 'breach' }] },
        { cells: [{ value: 'MEDIUM', status: 'flag' }, { value: 'NIM compression', status: 'flag' }, { value: 'Financial Aggregator' }, { value: 'NIM 3.21% — 5.6% below budget and 4th consecutive quarter of decline. Structural repricing pressure in deposit base.' }, { value: 'Acknowledge — include in forward outlook narrative' }] },
        { cells: [{ value: 'MEDIUM', status: 'flag' }, { value: 'Vendor data breach', status: 'flag' }, { value: 'Operational Risk' }, { value: 'INC-2024-112 — 1,200 accounts affected, resolved, regulatory notification filed. Board-reportable per policy.' }, { value: 'Acknowledge — confirm resolved status and monitoring' }] },
        { cells: [{ value: 'MEDIUM', status: 'flag' }, { value: 'NPL ratio elevated vs peer', status: 'flag' }, { value: 'Credit Quality + Trend' }, { value: 'NPL 1.84% vs peer median 1.20%. Rising for 5 consecutive quarters. CRE-driven.' }, { value: 'Acknowledge — include in credit narrative' }] },
      ],
      footnote: 'Clicking Approve will resume execution and trigger the Report Compiler. The approval decision, timestamp, and any reviewer notes will be permanently embedded in the final board package metadata.',
    },
  ],
};

// ─── REPORT COMPILER ─────────────────────────────────────────────────────────
// Source: All upstream structured outputs
// System: Sentinel Report Compiler — Input Bundle

export const reportCompilerRawInput: AgentRawInput = {
  agentId: 'report_compiler',
  sourceSystem: 'Sentinel Report Compiler — Structured Input Bundle',
  extractTimestamp: '2025-01-08 06:02:38 UTC (post-HITL approval)',
  keyFields: [
    { label: 'Input bundle version', value: 'v2.1 — post-HITL approved' },
    { label: 'Sections to compile', value: '7 (streaming sequentially)' },
    { label: 'Total structured inputs', value: '42 data fields across 6 agent outputs' },
    { label: 'HITL decision', value: 'APPROVED — CFO Jan 8, 2025 06:02 UTC' },
  ],
  tables: [
    {
      id: 'compiler_input_bundle',
      title: 'Structured input bundle — all upstream agent outputs',
      sourceLabel: 'Sentinel Execution Engine — report_compiler_input.json',
      asOfDate: 'Jan 8, 2025 06:02 UTC',
      headers: ['Field', 'Source Agent', 'Value', 'Used In Section'],
      rows: [
        { cells: [{ value: 'Financial RAG' }, { value: 'Financial Aggregator' }, { value: 'AMBER', status: 'flag' }, { value: 'Executive Summary, Financial Performance' }] },
        { cells: [{ value: 'NIM — actual' }, { value: 'Financial Aggregator' }, { value: '3.21% (−0.19pp vs budget)', status: 'flag' }, { value: 'Financial Performance' }] },
        { cells: [{ value: 'Efficiency ratio' }, { value: 'Financial Aggregator' }, { value: '61.4% (+1.6pp, above 60% threshold)', status: 'flag' }, { value: 'Financial Performance' }] },
        { cells: [{ value: 'Capital RAG' }, { value: 'Capital Monitor' }, { value: 'GREEN', status: 'ok' }, { value: 'Executive Summary, Capital and Liquidity' }] },
        { cells: [{ value: 'CET1 ratio' }, { value: 'Capital Monitor' }, { value: '10.8% (well above 6.5% well-cap)' }, { value: 'Capital and Liquidity' }] },
        { cells: [{ value: 'Credit RAG' }, { value: 'Credit Quality' }, { value: 'RED', status: 'breach' }, { value: 'Executive Summary, Credit Quality' }] },
        { cells: [{ value: 'Credit health score' }, { value: 'Credit Quality' }, { value: '−1.75 (RED threshold ≤ −2.0 — approaching)' }, { value: 'Credit Quality' }] },
        { cells: [{ value: 'CRE concentration' }, { value: 'Credit Quality' }, { value: '336% vs 300% policy limit — BREACH', status: 'breach' }, { value: 'Credit Quality, Executive Summary' }] },
        { cells: [{ value: 'NIM trend slope' }, { value: 'Trend Analyzer' }, { value: '−0.093/quarter (4.2σ above historical mean)' }, { value: 'Financial Performance, Forward Outlook' }] },
        { cells: [{ value: 'NPL trend slope' }, { value: 'Trend Analyzer' }, { value: '+0.215/quarter (6.8σ — significant)' }, { value: 'Credit Quality, Forward Outlook' }] },
        { cells: [{ value: 'Trend LLM narratives' }, { value: 'Trend Analyzer' }, { value: '3 narratives generated (NIM, NPL, Efficiency)' }, { value: 'All sections as supporting context' }] },
        { cells: [{ value: 'Regulatory RAG' }, { value: 'Regulatory Digest' }, { value: 'RED — escalation flag TRUE', status: 'breach' }, { value: 'Executive Summary, Regulatory Status' }] },
        { cells: [{ value: 'MRA-2024-02 status' }, { value: 'Regulatory Digest' }, { value: 'OVERDUE — 18 days past due date', status: 'breach' }, { value: 'Regulatory Status' }] },
        { cells: [{ value: 'Operational RAG' }, { value: 'Operational Risk' }, { value: 'AMBER — 1 board-reportable item' }, { value: 'Executive Summary, Operational Risk' }] },
        { cells: [{ value: 'Vendor breach status' }, { value: 'Operational Risk' }, { value: 'Resolved — 1,200 accounts, OCC notified' }, { value: 'Operational Risk' }] },
        { cells: [{ value: 'Supervisor routing' }, { value: 'Supervisor' }, { value: 'PROCEED_TO_HITL (overdue MRA primary trigger)' }, { value: 'Internal metadata only — not in report' }] },
        { cells: [{ value: 'HITL decision' }, { value: 'HITL Gate' }, { value: 'APPROVED — Jan 8, 2025 06:02 UTC' }, { value: 'Report metadata / audit trail' }] },
      ],
      footnote: 'All 17 input fields injected into gpt-4o-mini system prompt as structured JSON. Temperature 0.4. Each section streamed independently via OpenAI streaming API. Token-by-token delivery to report viewer.',
    },
  ],
};

// ─── META AGENT ───────────────────────────────────────────────────────────────
// Source: Scenario configuration + Node Registry
// System: Sentinel Meta-Agent — Graph Construction Input

export const metaAgentRawInput: AgentRawInput = {
  agentId: 'meta_agent',
  sourceSystem: 'Sentinel Meta-Agent — Scenario Configuration + Node Registry',
  extractTimestamp: '2025-01-08 06:00:01 UTC',
  keyFields: [
    { label: 'Meeting type received', value: 'Full Board — Quarterly Package' },
    { label: 'Institution', value: 'Falcon Community Bank' },
    { label: 'Available agents in registry', value: '10' },
    { label: 'Agents selected', value: '10 (all — maximum graph)' },
    { label: 'HITL gate activated', value: 'YES (meeting type = Full Board)', status: 'flag' },
  ],
  tables: [
    {
      id: 'node_registry_consulted',
      title: 'Node registry — full agent inventory consulted at graph construction',
      sourceLabel: 'Sentinel Node Registry v1.4',
      asOfDate: 'Jan 8, 2025',
      headers: ['Agent ID', 'Agent Label', 'Type', 'Required For', 'Selected This Run', 'Execution Stage'],
      rows: [
        { cells: [{ value: 'meta_agent', mono: true }, { value: 'Meta Agent' }, { value: 'Orchestrator' }, { value: 'All meetings' }, { value: 'YES', status: 'ok' }, { value: 'Stage 01' }] },
        { cells: [{ value: 'financial_aggregator', mono: true }, { value: 'Financial Aggregator' }, { value: 'Rules engine' }, { value: 'Full Board, Risk Flash' }, { value: 'YES', status: 'ok' }, { value: 'Stage 02 (parallel)' }] },
        { cells: [{ value: 'capital_monitor', mono: true }, { value: 'Capital Monitor' }, { value: 'Rules engine' }, { value: 'Full Board, Risk Flash' }, { value: 'YES', status: 'ok' }, { value: 'Stage 02 (parallel)' }] },
        { cells: [{ value: 'credit_quality', mono: true }, { value: 'Credit Quality' }, { value: 'ML scoring' }, { value: 'Full Board, Risk Flash' }, { value: 'YES', status: 'ok' }, { value: 'Stage 02 (parallel)' }] },
        { cells: [{ value: 'trend_analyzer', mono: true }, { value: 'Trend Analyzer' }, { value: 'Hybrid' }, { value: 'Full Board' }, { value: 'YES', status: 'ok' }, { value: 'Stage 03 (parallel)' }] },
        { cells: [{ value: 'regulatory_digest', mono: true }, { value: 'Regulatory Digest' }, { value: 'AI agent' }, { value: 'Full Board, Audit Committee' }, { value: 'YES', status: 'ok' }, { value: 'Stage 03 (parallel)' }] },
        { cells: [{ value: 'operational_risk', mono: true }, { value: 'Operational Risk' }, { value: 'AI agent' }, { value: 'Full Board, Audit Committee' }, { value: 'YES', status: 'ok' }, { value: 'Stage 03 (parallel)' }] },
        { cells: [{ value: 'supervisor', mono: true }, { value: 'Supervisor' }, { value: 'Orchestrator' }, { value: 'All meetings' }, { value: 'YES', status: 'ok' }, { value: 'Stage 04' }] },
        { cells: [{ value: 'hitl_gate', mono: true }, { value: 'HITL Gate' }, { value: 'Human review' }, { value: 'Full Board (when flags present)', status: 'flag' }, { value: 'YES — Full Board type', status: 'flag' }, { value: 'Stage 05' }] },
        { cells: [{ value: 'report_compiler', mono: true }, { value: 'Report Compiler' }, { value: 'AI agent' }, { value: 'All meetings' }, { value: 'YES', status: 'ok' }, { value: 'Stage 06' }] },
      ],
      footnote: 'Graph topology confirmed via gpt-4o-mini at temperature 0.0. Fallback: if API unavailable, rules-based selection activates all nodes for Full Board meeting type. Execution order locked: Stage 02 nodes run in parallel; Stage 03 nodes run in parallel; all other stages are sequential.',
    },
    {
      id: 'scenario_comparison',
      title: 'Graph topology by scenario — what changes per meeting type',
      sourceLabel: 'Sentinel Scenario Configuration v2.3',
      asOfDate: 'Jan 8, 2025',
      headers: ['Meeting Type', 'Node Count', 'Stage 02 Agents', 'Stage 03 Agents', 'HITL Gate', 'Estimated Runtime'],
      rows: [
        { cells: [{ value: 'Full Board — Quarterly Package', bold: true, status: 'flag' }, { value: '10', bold: true }, { value: 'Financial, Capital, Credit (3 parallel)' }, { value: 'Trend, Regulatory, Ops Risk (3 parallel)' }, { value: 'YES — conditional on flags', status: 'flag' }, { value: '~45–90 seconds' }] },
        { cells: [{ value: 'Audit Committee — Mid-Cycle' }, { value: '5' }, { value: 'None' }, { value: 'Regulatory, Ops Risk (2 parallel)' }, { value: 'NO' }, { value: '~20–35 seconds' }] },
        { cells: [{ value: 'Risk Flash — Monthly' }, { value: '4' }, { value: 'Capital, Credit (2 parallel)' }, { value: 'None — jumps to Supervisor' }, { value: 'NO (skipped if all green)' }, { value: '~10–18 seconds' }] },
      ],
      footnote: 'Node count includes Meta Agent and Report Compiler in all scenarios. HITL gate only activates in Full Board when at least one escalation flag is set by Regulatory Digest or Supervisor.',
    },
  ],
};

// ─── Master export ────────────────────────────────────────────────────────────

export const AGENT_RAW_INPUT_DATA: Record<string, AgentRawInput> = {
  meta_agent:            metaAgentRawInput,
  financial_aggregator:  financialAggregatorRawInput,
  capital_monitor:       capitalMonitorRawInput,
  credit_quality:        creditQualityRawInput,
  trend_analyzer:        trendAnalyzerRawInput,
  regulatory_digest:     regulatoryDigestRawInput,
  operational_risk:      operationalRiskRawInput,
  supervisor:            supervisorRawInput,
  hitl_gate:             hitlGateRawInput,
  report_compiler:       reportCompilerRawInput,
};

export function getAgentRawInput(agentId: string): AgentRawInput | null {
  return AGENT_RAW_INPUT_DATA[agentId] ?? null;
}
