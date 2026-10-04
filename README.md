# 🏛️ CAdesk — AI-Native Tax & Financial Working Papers Workspace

> **"AI agents prepare the work. Chartered Accountants review and sign off."**

CAdesk is an enterprise-grade, AI-native tax computation, document intelligence, and compliance workspace engineered for the Indian taxation ecosystem (FY 2025-26 / AY 2026-27). It bridges the gap between individual assessees and Chartered Accountants through a **dual-perspective architecture**, combining **deterministic statutory tax calculation engines** with a **multi-agent orchestration team** powered by Gemini.

---

## 📑 Table of Contents

- [Key Highlights & Architecture Principles](#-key-highlights--architecture-principles)
- [System Architecture](#-system-architecture)
- [Multi-Agent Orchestration Team](#-multi-agent-orchestration-team)
- [Deterministic Tax Calculation Engine](#-deterministic-tax-calculation-engine)
- [Feature Matrix & Module Overview](#-feature-matrix--module-overview)
  - [1. Individual Assessee Experience](#1-individual-assessee-experience)
  - [2. Chartered Accountant (CA) Practice Suite](#2-chartered-accountant-ca-practice-suite)
  - [3. Cross-Cutting Capabilities](#3-cross-cutting-capabilities)
- [Project Directory Structure](#-project-directory-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started & Installation](#-getting-started--installation)
- [Environment Configuration](#-environment-configuration)
- [Tax Law & Statutory Grounding](#-tax-law--statutory-grounding)
- [Audit Trail & Governance](#-audit-trail--governance)
- [Scripts & Developer Commands](#-scripts--developer-commands)
- [Contributing & Code Standards](#-contributing--code-standards)
- [License & Statutory Disclaimer](#-license--statutory-disclaimer)

---

## 🌟 Key Highlights & Architecture Principles

1. **Zero-Hallucination Tax Computation**:
   - **LLMs never calculate tax liabilities.** All mathematical computations, slab distributions, deductions, exemptions, surcharges, and cess are computed strictly by the deterministic engine (`/src/lib/taxEngine.ts`).
   - AI models are used strictly for intent classification, document OCR extraction, conversational reasoning, statutory explanation, and drafting audit notes.

2. **Dual-Perspective Workflow**:
   - **Individual Assessee Portal**: Salaried professionals, freelancers, and business owners get self-service optimization, scenario simulators, goal planners, and document vaults.
   - **CA Practice Portal**: CA partners and staff access client rosters, risk scoring, working papers, internal private notes, line-item verification flags, and digital sign-off workflows.

3. **Multi-Agent Orchestration Trace**:
   - Real-time step traces showcasing how specialized agents (Document, Profile, Tax, Compliance, Verifier, CA Copilot) collaborate with transparent confidence scores and statutory citations.

4. **Immutable Audit Trail & Working Papers**:
   - Every modification, document extraction, and sign-off is logged with actor identification, timestamp, and verification hashes conforming to standard auditing practices.

---

## 🏗️ System Architecture

```
                                    +-----------------------------------------+
                                    |         User Interface (React 19)        |
                                    | (Dual Perspective: Individual & CA)     |
                                    +--------------------+--------------------+
                                                         |
                                                         v
                                    +--------------------+--------------------+
                                    |        Global Context & Services        |
                                    | (AppContext, ClientService, DocService) |
                                    +--------------------+--------------------+
                                                         |
                                                         v
                                    +--------------------+--------------------+
                                    |       Multi-Agent Orchestrator          |
                                    |     (/src/agents/orchestrator.ts)       |
                                    +---------+--------------------+----------+
                                              |                    |
                 +----------------------------+                    +---------------------------+
                 |                                                                             |
                 v                                                                             v
+---------------------------------+                                           +---------------------------------+
|   Deterministic Tax Engine      |                                           |     AI Chat & Reasoning Engine  |
|     (/src/lib/taxEngine.ts)     |                                           |  (@google/genai - Gemini 3.8)   |
+----------------+----------------+                                           +----------------+----------------+
                 |                                                                             |
                 | Computes exact slabs, rebates, cess, CG tax                                | Generates explanations,
                 |                                                                             | summaries & citations
                 +----------------------------+                    +---------------------------+
                                              |                    |
                                              v                    v
                                    +--------------------+--------------------+
                                    |         Verified Grounded Payload       |
                                    |   (Working Papers + Sign-Off Workflow)  |
                                    +-----------------------------------------+
```

---

## 🤖 Multi-Agent Orchestration Team

The application leverages a modular multi-agent architecture located in `src/agents/orchestrator.ts`:

| Agent Name | Primary Responsibility | Input / Output |
| :--- | :--- | :--- |
| **Profile Agent** | Identifies client persona, residential status, and income streams (Salaried, Freelance, Business). | Prompt Context &rarr; Assessee Profile & Scope |
| **Document Agent** | Ingests and parses Form 16 (Part A/B), 26AS, AIS/TIS, Salary Slips, and Capital Gains statements. | Uploaded Docs &rarr; Extracted Key-Values + Confidence Score |
| **Tax Engine Agent** | Invokes deterministic tax algorithms; strictly handles all numerical computations. | TaxInputs &rarr; Old vs New Regime Comparison Payload |
| **Compliance Agent** | Evaluates statutory compliances: Sec 115BAC, 87A rebate, MSME 43B(h), VDA 115BBH, and Surcharges. | Tax Result &rarr; Risk Flags & Statutory Checklist |
| **Planning Agent** | Forecasts tax-saving asset allocation and long-term goal corpora. | Financial Goals &rarr; Tax-Optimized Investment Plan |
| **Research Agent** | Retrieves statutory sections, Finance Act amendments, and CBDT circulars. | Legal Queries &rarr; Statutory Citations & Circular Notes |
| **Verifier Agent** | Validates LLM reasoning against deterministic math and checks grounding consistency. | Generated Text &rarr; Verification Confidence (0–100%) |
| **CA Copilot** | Formats structured working papers, flags low-confidence OCR fields, and prepares sign-off blocks. | Full Trace &rarr; Decision Support Working Paper |

---

## 🧮 Deterministic Tax Calculation Engine

The engine in `src/lib/taxEngine.ts` implements the Indian Income-tax Act provisions for **Financial Year 2025-26 (Assessment Year 2026-27)**:

### 1. New Tax Regime (Section 115BAC)
- **Standard Deduction**: ₹75,000 for salaried assessees.
- **Section 87A Rebate**: Tax rebate up to ₹60,000 for net taxable income up to ₹12,00,000 (effective zero tax).
- **Tax Slabs**:
  - Up to ₹4,00,000: **Nil**
  - ₹4,00,001 to ₹8,00,000: **5%**
  - ₹8,00,001 to ₹12,00,000: **10%**
  - ₹12,00,001 to ₹16,00,000: **15%**
  - ₹16,00,001 to ₹20,00,000: **20%**
  - ₹20,00,001 to ₹24,00,000: **25%**
  - Above ₹24,00,000: **30%**
- **Allowable Exemptions in New Regime**: Employer NPS contribution u/s **80CCD(2)** (up to 14% for Central Govt, 10%/14% for others).

### 2. Old Tax Regime
- **Standard Deduction**: ₹50,000.
- **Section 87A Rebate**: Up to ₹12,500 for taxable income up to ₹5,00,000.
- **Tax Slabs**:
  - Up to ₹2,50,000: **Nil**
  - ₹2,50,001 to ₹5,00,000: **5%**
  - ₹5,00,001 to ₹10,00,000: **20%**
  - Above ₹10,00,000: **30%**
- **Chapter VI-A & Property Deductions**:
  - **Sec 80C**: Up to ₹1,50,000 (EPF, PPF, ELSS, Life Insurance, Principal Home Loan).
  - **Sec 80D**: Health insurance (₹25,000 self/family + ₹50,000 senior citizen parents).
  - **Sec 80CCD(1B)**: Additional ₹50,000 for voluntary NPS Tier-1.
  - **Sec 24(b)**: Up to ₹2,00,000 on self-occupied housing loan interest.
  - **Sec 10(13A)**: House Rent Allowance (HRA) exemption (Least of: actual HRA, 50%/40% of basic, or rent paid − 10% basic).

### 3. Capital Gains & Surcharge / Cess
- **Sec 111A (STCG)**: Taxed @ 20% on listed equity.
- **Sec 112A (LTCG)**: Taxed @ 12.5% on gains exceeding ₹1.25 Lakh.
- **Health & Education Cess**: Flat **4%** on aggregate income-tax and surcharge.
- **High-Net-Worth Surcharges**: Tiered surcharge rates (10%, 15%, 25%) with marginal relief rules.

---

## 📦 Feature Matrix & Module Overview

### 1. Individual Assessee Experience

- **Interactive Dashboard (`/dashboard`)**:
  - Real-time tax liability snapshot with instant New vs. Old Regime comparative savings.
  - Effective tax rate gauge and active document pipeline tracker.
- **Tax Optimization Hub (`/tax-optimization`)**:
  - Live interactive sliders for salary components, HRA inputs, 80C/80D/NPS investments, and home loan interest.
  - Deduction utilization gauges and automated **Missed Deduction Radar**.
- **What-If Scenario Simulator (`/simulator`)**:
  - Dynamic simulation of salary increments, capital gains realizations, property purchases, and retirement contributions.
- **Document Vault (`/vault`)**:
  - Drag-and-drop ingestion of Form 16, 26AS, AIS, and bank statements.
  - Line-item confidence scores (0–100%) and OCR text preview.
- **Goal-Based Financial Planning (`/planning`)**:
  - Goal trackers (Retirement, House Purchase, Child Education, Emergency Fund).
  - Tax-advantaged portfolio allocations (PPF, NPS, ELSS, Debt).
- **Compliance Deadlines & Alerts (`/deadlines`)**:
  - Quarterly advance tax calendar (Jun 15, Sep 15, Dec 15, Mar 15), ITR filing cutoffs, and 80C deadlines with snooze/complete status.

### 2. Chartered Accountant (CA) Practice Suite

- **Practice Management Dashboard (`/ca/dashboard`)**:
  - Client roster with risk categorization (Low, Medium, High), filing status, and staff assignments.
  - Quick action filters: *Needs Review*, *Action Required*, *Ready for Filing*, *Filed*.
- **CA Client Workspace & Working Papers (`/ca/workspace/:clientId`)**:
  - Granular working paper inspection with field-level verification.
  - Internal private CA audit notes and immutable change log.
  - **Digital Sign-Off Modal** requiring CA Membership Number and explicit declaration.
- **Automated Document Requests (`/ca/requests`)**:
  - Smart checklist generator tailored to client income profiles.
  - One-click copyable WhatsApp and email reminder templates.

### 3. Cross-Cutting Capabilities

- **AI Agent Chat (`/agent-chat`)**:
  - Natural language interface supported by step-by-step orchestrator execution traces.
  - Direct statutory section citations and CA-review escalation tags.
- **Reports & Export Center (`/reports/:clientId`)**:
  - Executive tax summary and computation sheets formatted for printing and PDF generation.
- **Settings & User Role Switcher (`/settings`)**:
  - Seamless toggle between **Individual Assessee**, **CA Partner**, and **CA Staff** roles.
  - API key configuration for Gemini integration.

---

## 📂 Project Directory Structure

```text
CaDesk-Main-main/
├── .env.example              # Sample environment configuration
├── bun.lock                  # Bun lockfile
├── index.html                # HTML entry point
├── metadata.json             # Application metadata and capabilities
├── package.json              # Project dependencies and npm scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite & Tailwind CSS v4 bundler configuration
└── src/
    ├── App.tsx               # Root component with routing and self-test harness
    ├── main.tsx              # Application mount point
    ├── index.css             # Tailwind CSS v4 imports and base styling
    ├── agents/
    │   └── orchestrator.ts   # Multi-agent orchestrator (Profile, Tax, Compliance, Verifier, CA Copilot)
    ├── components/
    │   ├── common/
    │   │   ├── CaDeskLogo.tsx       # Brand logo component
    │   │   ├── CommandPalette.tsx   # Global Cmd+K quick navigation palette
    │   │   ├── CountUpNumber.tsx    # Animated numerical counter
    │   │   ├── Footer.tsx           # Application footer
    │   │   ├── Header.tsx           # Global navigation header
    │   │   ├── JourneyStepper.tsx   # Multi-step progress stepper
    │   │   ├── NextActionCard.tsx   # Contextual recommendation cards
    │   │   ├── PageHeader.tsx       # Standardized page title header
    │   │   └── StatusBadges.tsx     # Status and risk indicator badges
    │   └── layout/
    │       ├── AppShell.tsx         # Responsive application shell
    │       ├── MobileTabBar.tsx     # Mobile bottom navigation bar
    │       ├── Sidebar.tsx          # Persistent left sidebar navigation
    │       └── TopUtilityBar.tsx    # Role switcher, search, and notifications bar
    ├── config/
    │   └── taxRules.ts       # Versioned tax rules configuration for FY 2025-26
    ├── context/
    │   └── AppContext.tsx    # Global state (clients, documents, active role, goals, alerts)
    ├── data/
    │   ├── mockClients.ts    # Realistic client profiles (Salaried, Freelancer, HNI)
    │   ├── mockDocuments.ts  # Sample tax documents and OCR parsed fields
    │   ├── mockGoals.ts      # Sample financial planning goals
    │   └── mockProfiles.ts   # User profiles for different personas
    ├── lib/
    │   ├── taxEngine.ts      # 100% Deterministic statutory tax calculation engine
    │   └── taxEngine.test.ts # Comprehensive unit tests for tax calculations
    ├── pages/
    │   ├── AgentChat.tsx                 # AI assistant with multi-agent traces
    │   ├── CAClientWorkspace.tsx         # CA working papers & sign-off workspace
    │   ├── CADashboard.tsx               # CA practice management dashboard
    │   ├── DeadlinesAndAlerts.tsx        # Tax compliance deadline calendar
    │   ├── DocumentRequestAutomation.tsx # Automated document checklist builder
    │   ├── DocumentVault.tsx             # Secure document repository & OCR viewer
    │   ├── FinancialPlanning.tsx         # Goal-based investment planning
    │   ├── IndividualDashboard.tsx       # Individual assessee dashboard
    │   ├── LandingPage.tsx               # Product landing & marketing page
    │   ├── Onboarding.tsx                # Assessee onboarding flow
    │   ├── Reports.tsx                   # Printable tax computation sheets
    │   ├── ScenarioSimulator.tsx         # What-if scenario simulator
    │   ├── Settings.tsx                  # Application settings & role switcher
    │   └── TaxOptimization.tsx           # Regime comparator & deduction analyzer
    ├── services/
    │   ├── aiChatService.ts  # Gemini API integration with deterministic grounding
    │   ├── clientService.ts  # Client profile CRUD & state management
    │   └── documentService.ts# Document storage and classification service
    ├── theme/
    └── types/
        └── index.ts          # Universal TypeScript domain interfaces
```

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) | Modern reactive user interface |
| **Language** | [TypeScript 7](https://www.typescriptlang.org/) | Strict type safety and domain modeling |
| **Build Tool** | [Vite 8](https://vitejs.dev/) | Ultra-fast build and HMR tooling |
| **Routing** | [React Router v7](https://reactrouter.com/) | Client-side routing and deep linking |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS engine |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent UI iconography |
| **Animations** | [Motion](https://motion.dev/) | Fluid micro-interactions and transitions |
| **Charts** | [Recharts 3](https://recharts.org/) | Responsive data visualizations and charts |
| **AI Integration** | [@google/genai](https://www.npmjs.com/package/@google/genai) | Gemini SDK with deterministic grounding |

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js** v18.0.0 or higher (or **Bun** v1.0.0+)
- **npm**, **pnpm**, **yarn**, or **bun**

### 1. Clone or Open the Workspace
```bash
cd CaDesk-Main-main
```

### 2. Install Dependencies
Using npm:
```bash
npm install
```
Or using Bun:
```bash
bun install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Gemini API key in `.env` (optional; deterministic engine runs fully offline):
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 4. Run the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## ⚙️ Environment Configuration

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | API key for Google Gemini model generation. If omitted, CAdesk runs using built-in deterministic multi-agent templates. |
| `APP_URL` | Optional | Host URL used for external links and callbacks. |
| `DISABLE_HMR` | Optional | Set to `true` in automated editing environments to disable file watching. |

---

## ⚖️ Tax Law & Statutory Grounding

CAdesk adheres to the following statutory provisions:
- **Finance Act, 2024 / FY 2025-26 Provisions**:
  - Section 115BAC(1A) — Revised default tax slab rates and rebate limit.
  - Section 87A — Rebate calculation with marginal relief.
  - Section 16(ia) — Standard deduction of ₹75,000 (New) / ₹50,000 (Old).
  - Section 80CCD(2) — Employer contribution to pension scheme.
  - Section 111A & 112A — Capital gains tax revisions (20% STCG, 12.5% LTCG).
  - Section 10(13A) & Rule 2A — House Rent Allowance calculations.
  - Section 24(b) — Interest on borrowed capital for self-occupied property.

---

## 🛡️ Audit Trail & Governance

To maintain professional compliance and prepare for CA scrutiny, all actions within CAdesk create an **`AuditLogEntry`**:
- **Actor Identification**: Logs whether changes were initiated by an `individual`, `ca`, `ca_staff`, or `ai_agent`.
- **Immutable Hash**: Computes an SHA-like record string for every update.
- **CA Sign-Off Block**: Enforces recording of CA Membership Number, sign-off timestamp, and approval remarks before filing readiness.

---

## 📜 Scripts & Developer Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on port 3000. |
| `npm run build` | Compiles TypeScript and builds the production bundle into `dist/`. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs `tsc --noEmit` to validate TypeScript types across the project. |
| `npm run clean` | Cleans previous build artifacts and distribution bundles. |

---

## 🤝 Contributing & Code Standards

1. **Deterministic Rule Preservation**: Never introduce LLM-based calculations in place of mathematical computations in `src/lib/taxEngine.ts`.
2. **Type Safety**: Maintain strict TypeScript interfaces in `src/types/index.ts`.
3. **Unit Tests**: Ensure all self-tests in `src/lib/taxEngine.test.ts` pass when making modifications to tax slabs or deduction limits.

---

## 📄 License & Statutory Disclaimer

```text
CAdesk is designed as a decision-support and working papers preparation tool for assessees
and tax practitioners. Computations are based on the provisions of the Income-tax Act, 1961
and rules applicable for FY 2025-26. Final tax returns must be reviewed, verified, and signed
off by a qualified Chartered Accountant or tax professional prior to submission with the
Income Tax Department.
```
