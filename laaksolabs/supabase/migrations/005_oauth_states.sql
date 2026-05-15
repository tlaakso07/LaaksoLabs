-- OAuth state store for the Google Ads connect wizard.
-- Rows are written by /api/campaigns/google/auth-start, updated by /api/campaigns/google/oauth-callback,
-- and consumed (deleted) by /api/campaigns/google/oauth-status/[state].
-- Service-role only: no anon RLS policy. Routes use the admin Supabase client.

create table if not exists oauth_states (
  state text primary key,
  provider text not null default 'google',
  payload jsonb not null,
  refresh_token text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists oauth_states_created_at_idx on oauth_states (created_at);

alter table oauth_states enable row level security;
-- No policies — only service role bypasses RLS. Anon and authenticated have no access.
