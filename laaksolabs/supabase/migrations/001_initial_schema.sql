-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  division text not null check (division in ('div1', 'div2', 'div3')),
  status text not null default 'prospect' check (status in ('prospect', 'lead', 'proposal', 'onboarding', 'active', 'paused', 'churned')),
  retainer_amount numeric(10,2),
  phone text,
  email text,
  website text,
  location text,
  services text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Revenue Entries
create table if not exists revenue_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  amount numeric(10,2) not null,
  type text not null check (type in ('retainer', 'project', 'equity', 'other')),
  month date not null,
  status text not null default 'expected' check (status in ('expected', 'invoiced', 'paid', 'overdue')),
  notes text,
  created_at timestamptz not null default now()
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid references clients(id) on delete set null,
  priority text not null default 'medium' check (priority in ('urgent', 'high', 'medium', 'low')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'waiting', 'done')),
  due_date date,
  category text not null default 'operations' check (category in ('sales', 'delivery', 'operations', 'creative', 'campaigns')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Happy Dog Orders
create table if not exists happydog_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  deliverable text not null,
  status text not null default 'not_ordered' check (status in ('not_ordered', 'ordered', 'in_progress', 'review', 'delivered', 'revision')),
  hd_cost numeric(10,2),
  client_price numeric(10,2),
  margin numeric(5,2) generated always as (
    case when client_price > 0 then round(((client_price - hd_cost) / client_price) * 100, 2) else null end
  ) stored,
  ordered_date date,
  delivered_date date,
  notes text,
  created_at timestamptz not null default now()
);

-- Contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  company text,
  phone text,
  email text,
  notes text,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google', 'other')),
  campaign_name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  daily_budget numeric(10,2),
  spend_mtd numeric(10,2),
  leads_mtd integer,
  cost_per_lead numeric(10,2),
  ctr numeric(5,4),
  notes text,
  last_synced timestamptz
);

-- Activity Log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  type text not null check (type in ('note', 'call', 'email', 'meeting', 'milestone', 'payment')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at on clients
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

-- Indexes for common queries
create index if not exists idx_clients_status on clients(status);
create index if not exists idx_clients_division on clients(division);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_due_date on tasks(due_date);
create index if not exists idx_tasks_client_id on tasks(client_id);
create index if not exists idx_revenue_month on revenue_entries(month);
create index if not exists idx_revenue_client on revenue_entries(client_id);
create index if not exists idx_happydog_client on happydog_orders(client_id);
create index if not exists idx_activity_client on activity_log(client_id);
create index if not exists idx_activity_created on activity_log(created_at desc);

-- RLS: enable and allow authenticated user full access (single-user app)
alter table clients enable row level security;
alter table revenue_entries enable row level security;
alter table tasks enable row level security;
alter table happydog_orders enable row level security;
alter table contacts enable row level security;
alter table campaigns enable row level security;
alter table activity_log enable row level security;

create policy "authenticated_all" on clients for all to authenticated using (true) with check (true);
create policy "authenticated_all" on revenue_entries for all to authenticated using (true) with check (true);
create policy "authenticated_all" on tasks for all to authenticated using (true) with check (true);
create policy "authenticated_all" on happydog_orders for all to authenticated using (true) with check (true);
create policy "authenticated_all" on contacts for all to authenticated using (true) with check (true);
create policy "authenticated_all" on campaigns for all to authenticated using (true) with check (true);
create policy "authenticated_all" on activity_log for all to authenticated using (true) with check (true);
