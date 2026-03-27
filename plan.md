# THQ Digital Health — Implementation Plan

## Overview
Production Next.js web app for Trading Headquarters (THQ) — a four-quadrant digital marketing dashboard with AI-powered task generation, metrics tracking, website performance analysis, and analytics summaries.

---

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`)
- **Styling**: Tailwind CSS
- **State**: React useState/useEffect + localStorage for session
- **Deployment**: Claude hosted (Vercel-compatible)

---

## Auth System
- No proper auth — two hardcoded passwords
- Admin: `thqpassword` — full access to all four quadrants
- Agency: `agencypassword` — limited to metrics editing and approved tasks
- Session stored in localStorage as `{ role: 'admin' | 'agency' }`
- Login screen shown on first load if no session found

---

## Directory Structure
```
/app
  /api
    /generate-tasks/route.ts     — Claude: generate tasks from metrics + context
    /verify-task/route.ts        — Claude: verify completed task evidence
    /analyse-website/route.ts    — Claude: analyse thq.com.au SEO
  layout.tsx
  page.tsx                       — Main dashboard (four quadrants)
  globals.css
/components
  /auth
    LoginScreen.tsx
  /tasks
    TaskManager.tsx
    TaskCard.tsx
    TaskGenerateModal.tsx
  /metrics
    MetricsDashboard.tsx
    MetricRow.tsx
  /performance
    WebsitePerformance.tsx
  /analytics
    AnalyticsSummary.tsx
  /ui
    QuadrantPanel.tsx
    StatusBadge.tsx
    TrendArrow.tsx
/lib
  supabase.ts                    — Supabase client
  types.ts                       — TypeScript types
  constants.ts                   — THQ context, SEO rulebook
/supabase
  migrations/
    001_initial_schema.sql
    002_seed_metrics.sql
```

---

## Supabase Tables

### tasks
```sql
id uuid primary key default gen_random_uuid()
title text not null
description text
category text  -- SEO | Google Ads | Meta | GEO | Local
due_date date
status text default 'Pending'  -- Pending | In Progress | Done | Verified | Failed
agency_response text
evidence_link text
ai_verification_result text  -- Pass | Fail | Needs Manual Review
ai_verification_reason text
admin_override boolean default false
admin_context text
approved boolean default false
created_at timestamptz default now()
```

### metrics
```sql
id uuid primary key default gen_random_uuid()
metric_name text not null
section text  -- SEO | PAID | CHANNEL HEALTH | LOCAL GEO | AI / GEO
what_it_tells_you text
target text
last_month_value text
this_month_value text
trend text  -- up | down | flat
sort_order int
updated_at timestamptz default now()
```

### context_memory
```sql
id uuid primary key default gen_random_uuid()
context_text text not null
related_task_id uuid references tasks(id)
created_at timestamptz default now()
```

---

## API Routes

### POST /api/generate-tasks
- Reads all metrics from Supabase
- Reads all context_memory from Supabase
- Sends full THQ context + SEO rulebook + current metrics + saved context to Claude
- Returns array of task objects
- Admin saves/approves/discards

### POST /api/verify-task
- Receives: task description, evidence_link, category
- Sends to Claude with THQ SEO rulebook
- Returns: { result: 'Pass' | 'Fail' | 'Needs Manual Review', reason: string }

### POST /api/analyse-website
- Receives: url (default thq.com.au)
- Sends to Claude with THQ SEO context
- Returns: { seoHealth, topPages, contentGaps, quickWins }

---

## Component Architecture

### Dashboard (page.tsx)
- Check localStorage for session
- If no session → render LoginScreen
- If session → render four-quadrant grid
- Admin sees all four quadrants
- Agency sees only Task Manager (approved tasks) + Metrics (edit only)

### Four Quadrant Layout
```
┌─────────────────┬─────────────────┐
│   Task Manager  │ Metrics Dash    │
│   (top-left)    │ (top-right)     │
├─────────────────┼─────────────────┤
│ THQ Website     │ Analytics       │
│ Performance     │ Summary         │
│ (bottom-left)   │ (bottom-right)  │
└─────────────────┴─────────────────┘
```

Each quadrant: fixed height, independent scroll, header with title

### Task Manager
Admin:
- Filter bar: All | Pending | In Progress | Done | Verified
- "Generate Tasks with AI" button → calls API, shows modal with generated tasks
- Each generated task: Approve | Edit | Discard
- Approved tasks visible to agency
- Add due date, admin context per task

Agency:
- See approved tasks only
- Status dropdown, response text, evidence link URL per task

### Metrics Dashboard
Table grouped by section:
- SEO / PAID / CHANNEL HEALTH / LOCAL GEO / AI/GEO
- Each row: name | what it tells you | target | last month | this month | trend arrow
- Agency: can edit last_month_value and this_month_value
- Admin: read + edit

### Website Performance (Admin only)
- URL input pre-filled with thq.com.au
- Analyse button → POST /api/analyse-website
- Results: SEO Health card, Top Pages card, Content Gaps card, Quick Wins card

### Analytics Summary (Admin only)
- Auto-calculated from metrics table
- Overall health score (% metrics trending up)
- Channel breakdown (SEO vs Paid vs Local)
- Top 3 priority actions
- Month-on-month trend summary

---

## THQ Brand Design
- Background: `#1a1a1a` (dark charcoal)
- Cards/panels: `#242424`
- Borders: `#333`
- Accent: `#f97316` (orange-500)
- Text primary: `#ffffff`
- Text secondary: `#9ca3af`
- Success/up: `#22c55e` (green)
- Danger/down: `#ef4444` (red)
- Neutral/flat: `#6b7280` (grey)

Status badge colours:
- Pending: grey
- In Progress: blue
- Done: green
- Verified: purple
- Failed: red

---

## Seed Data (February 2026 Metrics)
- Organic Sessions last month: 999
- Total Impressions last month: 47,700
- Total Impressions this month: 54,700
- AI Mentions: 25
- AI Cited Pages: 77
- AI Visibility Score: 18

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Implementation Order
1. Next.js project init + Tailwind
2. Supabase client setup + type definitions
3. Login screen + session management
4. Main layout + quadrant grid
5. Metrics Dashboard (data foundation for everything else)
6. Task Manager (depends on metrics for AI generation)
7. API routes (generate-tasks, verify-task, analyse-website)
8. Website Performance analyser
9. Analytics Summary (depends on metrics)
10. Database migrations + seed data
11. Polish, mobile responsive, test
12. Git push

---

## Key Constraints
- No auth library — simple localStorage password check
- Claude receives FULL THQ context on every AI call
- Context memory prevents task repetition
- Agency cannot delete, generate, or approve tasks
- Admin override always available on verification results
- Each quadrant scrolls independently
