# FinPilot AI — Autonomous Financial Copilot (FinTech 2026 Hackathon Edition)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache--2.0-orange.svg)](https://www.apache.org/licenses/LICENSE-2.0)

FinPilot AI is a production-grade autonomous financial agent designed for the **FinTech 2026 Hackathon**. Unlike traditional personal finance dashboards that merely report expenses in hindsight, FinPilot AI autonomously balances discretionary spending against non-negotiable recurring obligations and active savings goals through a transparent, reversible **Plan → Act → Verify → Recover** lifecycle.

> **Ethical & Safety Notice**: All bank accounts, debit/credit balances, recurring bills, and ledger transactions in this demonstration are **simulated fictional entities**. No real banking credentials or production funds are ever transferred.

---

## 1. Problem Statement & Solution

### The Problem
1. **Hindsight-Only Analytics**: Conventional personal finance applications present reactive dashboards after spending has already occurred.
2. **LLM Hallucinations in Financial Operations**: GenAI chatbots that attempt to calculate interest, savings rates, or cash flows often make mathematical calculation errors and fabricate balances.
3. **Unsafe Autonomous Execution**: When an autonomous agent modifies budgets or executes transfers without verification, catastrophic errors or missed bill payments occur.

### The FinPilot AI Solution
- **Deterministic Arithmetic Engine**: Every financial calculation (spending rate, surplus, bill obligations, goal timelines) is performed by deterministic TypeScript code—never estimated or guessed by a language model.
- **Human-in-the-Loop Authorization Gates**: Consequential mutations (e.g. creating budgets, initiating savings sweeps) are staged as pending proposals requiring explicit confirmation before commit.
- **Independent Post-Execution Proofs**: After an action is committed, the agent independently reads back the persistent ledger to mathematically prove that the mutation succeeded.
- **Zero-Loss Reversibility (Rollback Engine)**: Every autonomous workflow takes an immutable snapshot of prior state before making mutations, enabling instant 1-click rollback.

---

## 2. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER (React SPA)                           |
|  - Real-time Autonomous Activity Stream (Plan -> Act -> Verify -> Recover)       |
|  - Currency Selector (৳ BDT / $ USD)  - Dynamic Spending & Cashflow Ledger        |
|  - Human Authorization Modal          - One-Click 100% Demo State Reset           |
+------------------------------------------+----------------------------------------+
                                           | HTTP JSON / REST API
+------------------------------------------v----------------------------------------+
|                              SERVER RUNTIME (Node / Express)                      |
|  - Port 3000 / 0.0.0.0 (Proxy-safe with health check at /api/health)              |
|  - In-Memory & Atomic JSON Persistence (`data/finance-store.json`)                |
+--------------------+-------------------------------------+------------------------+
                     |                                     |
       +-------------v--------------+       +--------------v-------------+
       |   AUTONOMOUS WORKFLOW LOOP |       |   AI AGENT & TOOL ROUTER   |
       |  - 1. Plan                 |       |  - OpenRouter API (:free)  |
       |  - 2. Act (Proposal Gate)  |       |  - Local Deterministic Fallback|
       |  - 3. Verify               |       +--------------+-------------+
       |  - 4. Recover / Rollback   |                      |
       +-------------+--------------+                      |
                     |                                     |
+--------------------v-------------------------------------v------------------------+
|                                  7 EXPLICIT AGENT TOOLS                           |
|  1. get_transactions            -> Filter and retrieve verified ledger rows        |
|  2. calculate_monthly_spending  -> Deterministic category totals & savings rate   |
|  3. get_upcoming_bills          -> Essential obligation detection & coverage check|
|  4. create_or_update_budget     -> Propose budget limits (Requires Approval)      |
|  5. create_savings_plan         -> Formulate goal acceleration (Requires Approval)|
|  6. create_bill_reminder        -> Schedule recurring debt/utility reminder       |
|  7. verify_financial_plan       -> Mathematical constraint & liquidity solver     |
+-----------------------------------------------------------------------------------+
```

---

## 3. How the Agent Executes & Verifies Actions

FinPilot AI enforces a strict four-phase state machine:

### Step 1: PLAN (Deterministic Ledger Audit)
1. Agent invokes `get_transactions` and `get_upcoming_bills`.
2. Inspects checking reserves against non-negotiable obligations (rent, electricity, internet).
3. Invokes `verify_financial_plan` to solve allowable discretionary allowances without violating upcoming bill payments.

### Step 2: ACT (Human-in-the-Loop Gate)
1. Consequential mutations are NOT applied silently.
2. The agent generates a structured proposal with explicit reasoning (`PlanRationaleItem[]`) explaining why discretionary categories were trimmed and how much is routed to savings.
3. The workflow pauses in `awaiting_confirmation` status until the user approves or rejects the action.

### Step 3: VERIFY (Post-Commit Proof)
1. Once approved, the backend commits changes and runs a verification routine.
2. The verification routine re-queries the persistent store:
   - Asserts `budget.limit` matches approved plan.
   - Asserts checking balance was decremented by exact approved savings allocation.
   - Asserts target savings goal balance was incremented by exact allocation.
   - Asserts essential upcoming bills remain 100% funded.
3. If any assertion fails, the transaction is rejected and reverted.

### Step 4: RECOVER (Instant Undo & Fallbacks)
1. If user constraints are mathematically impossible (e.g., user wants to save ৳15,000 when only ৳10,000 remains with ৳10,200 in fixed bills), the agent detects the shortfall, marks the plan `infeasible`, and provides a safe counter-recommendation.
2. For all approved workflows, an immutable pre-workflow snapshot is cached. Users can click **Undo Workflow** at any time to restore previous balances and limits with 100% fidelity.

---

## 4. The 7 Explicitly Defined Agent Tools

| Tool Name | Parameters | Purpose | Consequential? |
| :--- | :--- | :--- | :--- |
| `get_transactions` | `category`, `type`, `limit` | Queries real ledger records; filters out invalid categories. | Read-Only |
| `calculate_monthly_spending` | `byCategory` | Deterministically calculates expenses, income, net savings, and category percentages. | Read-Only |
| `get_upcoming_bills` | `daysAhead`, `status` | Audits recurring obligations and validates checking account liquidity margin. | Read-Only |
| `create_or_update_budget` | `category`, `limit`, `period` | Adjusts category spending limit. Rejects negative numbers. | **Yes (Gated)** |
| `create_savings_plan` | `name`, `targetAmount`, `targetDate` | Creates automated savings goal. Sanitizes dates and targets. | **Yes (Gated)** |
| `create_bill_reminder` | `name`, `amount`, `dueDate`, `category` | Schedules debt or utility obligation. Validates date and amount. | **Yes (Gated)** |
| `verify_financial_plan` | `proposedMonthlySavings`, `proposedExpense` | Mathematical solver checking projected liquidity & solvency. | Read-Only |

---

## 5. Safety & Security Controls

1. **Deterministic Financial Math**: Never allows an LLM to guess sums, percentages, or savings rates. All math uses native TypeScript `Number` and `Math.round`.
2. **Negative & Malformed Input Sanitization**: All REST endpoints and tools reject negative amounts, empty names, and invalid categories with HTTP 400.
3. **Overdraft & Insufficient Funds Prevention**: Paying a bill or sweeping savings checks available liquidity; rejected if obligations exceed funds.
4. **Replay & Tampering Prevention**: Re-approving an already executed proposal or re-rolling back an already reverted workflow is explicitly rejected.
5. **Fail-Safe AI Provider & Free Tier Guardrails**: Uses OpenRouter API with free models (`OPENROUTER_MODEL`). If `OPENROUTER_API_KEY` is omitted, or if free models encounter community rate limits (HTTP 429) or temporary outages, the system automatically runs the deterministic local engine without service interruption. Never falls back to paid models or hidden billing.
6. **One-Click Demo Reset**: A single button restores pristine fictional data at any time.

---

## 6. Setup & Local Execution

### Prerequisites
- Node.js 20+ (tested on Node v22.23)
- npm 10+

### Installation & Run
```bash
# 1. Install dependencies (clean, zero-paid dependencies)
npm install

# 2. (Optional) Configure OpenRouter Free Model in .env
cp .env.example .env
# Edit .env and optionally set:
# OPENROUTER_API_KEY="your-openrouter-key"
# OPENROUTER_MODEL="meta-llama/llama-3.3-70b-instruct:free"
# If no key is set, FinPilot operates in full Deterministic Demo Mode (zero external dependencies).

# 3. Start development server
npm run dev

# 4. Run automated QA test suite (27 tests across 10 categories)
npm test

# 5. Build for production
npm run build
```

---

## 7. OpenRouter Free-Model Policies & Limitations

1. **Free-Model Availability & Rate Limits**: OpenRouter offers free models with the `:free` suffix (e.g., `meta-llama/llama-3.3-70b-instruct:free`, `stepfun/step-3.5-flash:free`, `cognitivecomputations/dolphin3.0-r1-mistral-24b:free`). Free model availability, throughput, and rate limits are managed by OpenRouter and community providers and may fluctuate during peak periods.
2. **Zero Paid Fallback Guarantee**: If the selected free model returns a rate limit (HTTP 429) or is temporarily unavailable, FinPilot AI displays a clear diagnostic and leverages the deterministic local engine. It will **never** silently switch to a paid model or incur billing.
3. **Simulated Financial Environment**: All accounts, balances, and transactions are fictional demo entities for the FinTech 2026 hackathon. No real banking accounts or production funds are ever accessed.

## 8. Automated Test Suite Results

The codebase contains an automated end-to-end QA verification test suite (`tests/qa-suite.ts`) covering all 10 engineering criteria:

```
=================================================================
FinPilot AI - Comprehensive Senior QA & Engineering Test Suite
=================================================================
Category 1: Incorrect or missing transaction data
  [PASS] Rejects transaction with empty description
  [PASS] Rejects transaction with missing required fields
  [PASS] Rejects transaction with invalid category
  [PASS] Rejects transaction with invalid transaction type

Category 2: Budget calculations and savings targets
  [PASS] Deterministic calculation of monthly spending and savings rate
  [PASS] Deterministic calculation of monthly contribution target for savings goal

Category 3: Upcoming bills that exceed available funds
  [PASS] Rejects bill payment when amount exceeds checking liquidity
  [PASS] Rejects duplicate payment on already paid bill

Category 4: Negative values and invalid inputs
  [PASS] Rejects negative transaction amount
  [PASS] Rejects negative budget limit
  [PASS] Rejects negative savings goal target
  [PASS] Rejects negative contribution to savings goal
  [PASS] toolVerifyFinancialPlan sanitizes negative inputs

Category 5: AI API failures and timeouts
  [PASS] Gracefully answers queries with deterministic tool traces and provider status
  [PASS] POST /api/ai/chat handles invalid payload without crashing server

Category 6: Tool execution failures
  [PASS] toolCreateOrUpdateBudget handles invalid category with safe alternative
  [PASS] toolCreateSavingsPlan handles invalid deadline format
  [PASS] toolCreateBillReminder handles empty name

Category 7: User rejection of a proposed action
  [PASS] Rejection leaves financial state unmodified and updates proposal status

Category 8: Successful actions followed by independent verification
  [PASS] Proposal execution verifies post-commit state against database
  [PASS] Autonomous Plan -> Act -> Verify workflow asserts post-execution proof

Category 9: Data persistence after refreshing the page
  [PASS] New transaction persists to disk and reloads with matching state

Category 10: Unauthorized attempts to execute actions
  [PASS] Rejects approval on unknown or non-existent proposal ID
  [PASS] Rejects re-approval of an already executed proposal
  [PASS] Rejects approval on an infeasible workflow
  [PASS] Rejects duplicate execution on an already completed workflow
  [PASS] Rejects rollback on a workflow that has already been rolled back

=================================================================
TEST SUITE EXECUTION SUMMARY: 27 / 27 PASSED (100% Success Rate)
=================================================================
```

---

## 9. Three-Minute Hackathon Demo Script

### Scenario Setup (0:00 - 0:45)
- **Presenter**: "Welcome judges. Meet Alex Vance. Alex has **৳20,000** remaining in discretionary liquidity for this month and wants to allocate **৳5,000** toward an Emergency Savings accelerator. But Alex also has critical upcoming bills (Electricity, Rent share, Internet) totaling **৳7,550**."
- **Action**: Click the **"Plan → Act → Recover"** tab in the sidebar (or click **"Demo Guide"** in the header).

### Autonomous Plan & Authorization (0:45 - 1:30)
- **Presenter**: "Watch the autonomous agent kick off Phase 1 (Plan). It calls `get_transactions` and `get_upcoming_bills`. Rather than having a large language model guess the math, the deterministic solver calculates that Alex has exactly ৳12,450 after bills, making the ৳5,000 savings goal feasible with a ৳7,450 discretionary buffer."
- **Action**: Point out the live timeline:
  - Step 1: Ledger Retrieval
  - Step 2: Essential Obligations Audit (৳7,550 secured)
  - Step 3: Optimization Solver (Trims Dining to ৳3,000 and Shopping to ৳2,500)
  - Step 4: Human Authorization Gate.
- **Presenter**: "Notice the agent does not commit money blindly. It halts at the **Human-in-the-Loop** gate and explains its reasoning: Dining and Shopping were dialed back by 15% to maintain liquidity."

### Execution, Verification & Proof (1:30 - 2:15)
- **Presenter**: "Now I click **'Approve & Execute Plan'**."
- **Action**: Click the green **Approve & Execute Plan** button.
- **Presenter**: "The agent executes Phase 2 (Act), then immediately performs Phase 3 (Verify). It re-reads the live ledger to assert that the ৳5,000 was swept into the savings goal, the budgets were updated, and checking liquidity remains protected. You can see the post-execution cryptographic-style proof right in the timeline."

### Stress Test & Zero-Loss Recovery (2:15 - 3:00)
- **Presenter**: "What if a user requests an impossible financial plan? Let's click **'Test Infeasible Scenario'** (e.g. Save ৳15,000 with only ৳10,000 left)."
- **Action**: Click **"Test Infeasible Scenario"**.
- **Presenter**: "The agent instantly flags a **৳15,200 shortfall**, blocks execution, and suggests a safe recovery plan."
- **Action**: Switch back to the executed scenario and click **"Undo Workflow (Restore Snapshot)"**.
- **Presenter**: "Finally, if Alex changes their mind, one click on 'Undo Workflow' restores the pre-workflow ledger snapshot with 100% fidelity. Thank you!"
