-- Enable Supabase real-time for core tables
-- Run once in the Supabase SQL editor or via: pnpm db:migrate

alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table clients;
alter publication supabase_realtime add table happydog_orders;
alter publication supabase_realtime add table revenue_entries;
alter publication supabase_realtime add table activity_log;
