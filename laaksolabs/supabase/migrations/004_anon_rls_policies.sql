-- Allow anon key full access until auth is implemented (single-user dashboard)
-- When you add Supabase Auth in Phase 3, replace these with user-scoped policies

create policy "anon_all" on clients        for all to anon using (true) with check (true);
create policy "anon_all" on revenue_entries for all to anon using (true) with check (true);
create policy "anon_all" on tasks          for all to anon using (true) with check (true);
create policy "anon_all" on happydog_orders for all to anon using (true) with check (true);
create policy "anon_all" on contacts       for all to anon using (true) with check (true);
create policy "anon_all" on campaigns      for all to anon using (true) with check (true);
create policy "anon_all" on activity_log   for all to anon using (true) with check (true);
