-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text check (category in ('SEO', 'Google Ads', 'Meta', 'GEO', 'Local')),
  due_date date,
  status text default 'Pending' check (status in ('Pending', 'In Progress', 'Done', 'Verified', 'Failed')),
  agency_response text,
  evidence_link text,
  ai_verification_result text check (ai_verification_result in ('Pass', 'Fail', 'Needs Manual Review')),
  ai_verification_reason text,
  admin_override boolean default false,
  admin_context text,
  approved boolean default false,
  created_at timestamptz default now()
);

-- Metrics table
create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  section text check (section in ('SEO', 'PAID', 'CHANNEL HEALTH', 'LOCAL GEO', 'AI / GEO')),
  what_it_tells_you text,
  target text,
  last_month_value text,
  this_month_value text,
  trend text default 'flat' check (trend in ('up', 'down', 'flat')),
  sort_order integer default 0,
  updated_at timestamptz default now()
);

-- Context memory table
create table if not exists context_memory (
  id uuid primary key default gen_random_uuid(),
  context_text text not null,
  related_task_id uuid references tasks(id) on delete set null,
  created_at timestamptz default now()
);
