import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
};

export const dashboardNav: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/documents", label: "Library" },
  { href: "/ingestion", label: "Ingestion" },
  { href: "/ask", label: "Ask" },
  { href: "/compare", label: "Compare" }
];

export const ingestionRuns = [
  {
    id: "job_9f2a",
    company: "NVIDIA",
    filing: "10-K FY2025",
    status: "Embedding",
    progress: 72,
    sections: 38,
    updatedAt: "2 min ago"
  },
  {
    id: "job_613e",
    company: "Snowflake",
    filing: "Q4 FY2025 Earnings Call",
    status: "Chunked",
    progress: 44,
    sections: 19,
    updatedAt: "7 min ago"
  },
  {
    id: "job_c173",
    company: "Palantir",
    filing: "10-Q Q3 2025",
    status: "Indexed",
    progress: 100,
    sections: 27,
    updatedAt: "12 min ago"
  }
];

export const libraryDocuments = [
  {
    title: "NVIDIA Annual Report",
    company: "NVIDIA",
    filingType: "10-K",
    period: "FY2025",
    tags: ["Risk Factors", "MD&A", "Notes"],
    pages: 124,
    date: "2025-02-21"
  },
  {
    title: "Microsoft Q2 Earnings Call",
    company: "Microsoft",
    filingType: "Earnings Call",
    period: "Q2 2025",
    tags: ["Transcript", "Guidance"],
    pages: 31,
    date: "2025-01-29"
  },
  {
    title: "Tesla Quarterly Report",
    company: "Tesla",
    filingType: "10-Q",
    period: "Q3 2025",
    tags: ["Financial Statements", "Risk Factors"],
    pages: 58,
    date: "2025-10-18"
  }
];

export const retrievalSources = [
  {
    chunkId: "nvda_10k_2025_risk_014",
    title: "Risk Factors",
    company: "NVIDIA",
    filingType: "10-K",
    filingDate: "2025-02-21",
    page: 17,
    score: 0.93,
    excerpt:
      "Our revenue concentration among a small number of channel partners and hyperscale customers may amplify quarter-to-quarter volatility if inventory or capital spending assumptions shift materially."
  },
  {
    chunkId: "nvda_10k_2025_mda_009",
    title: "Management's Discussion and Analysis",
    company: "NVIDIA",
    filingType: "10-K",
    filingDate: "2025-02-21",
    page: 42,
    score: 0.9,
    excerpt:
      "Data center growth was primarily driven by strong demand for accelerated computing and networking platforms, partially offset by supply timing and customer deployment pacing."
  },
  {
    chunkId: "nvda_10k_2025_notes_033",
    title: "Notes to Consolidated Financial Statements",
    company: "NVIDIA",
    filingType: "10-K",
    filingDate: "2025-02-21",
    page: 96,
    score: 0.84,
    excerpt:
      "We continue to monitor concentration risk in accounts receivable and the effect of export controls on customer demand assumptions and inventory planning."
  }
];

export const compareRows = [
  {
    section: "Risk Factors",
    current: "Adds export control sensitivity and channel concentration language.",
    previous: "Focused more heavily on supply chain timing and macro demand variability.",
    delta: "Material update"
  },
  {
    section: "MD&A",
    current: "Highlights data center mix shift and deployment pacing.",
    previous: "Centered on gaming recovery and inventory normalization.",
    delta: "Narrative changed"
  },
  {
    section: "Notes",
    current: "Expanded disclosure around customer concentration and receivables.",
    previous: "Less emphasis on exposure concentration.",
    delta: "Broader disclosure"
  }
];
