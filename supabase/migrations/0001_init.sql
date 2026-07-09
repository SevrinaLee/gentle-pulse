create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  mood text,
  raw_text text not null,
  time_estimate_minutes integer,
  time_estimate_source text,
  time_estimate_confidence numeric,
  time_estimate_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table check_ins enable row level security;
drop policy if exists "check_ins_v1_read" on check_ins;
create policy "check_ins_v1_read" on check_ins for select using (true);
drop policy if exists "check_ins_v1_write" on check_ins;
create policy "check_ins_v1_write" on check_ins for all using (true) with check (true);

create table if not exists friction_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  check_in_id uuid references check_ins(id) on delete cascade,
  category text,
  category_source text,
  category_confidence numeric,
  category_review_status text default 'unreviewed',
  repeat_flag boolean default false,
  repeat_flag_source text,
  repeat_flag_confidence numeric,
  repeat_flag_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table friction_tags enable row level security;
drop policy if exists "friction_tags_v1_read" on friction_tags;
create policy "friction_tags_v1_read" on friction_tags for select using (true);
drop policy if exists "friction_tags_v1_write" on friction_tags;
create policy "friction_tags_v1_write" on friction_tags for all using (true) with check (true);

create table if not exists sigh_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  follow_up_note text,
  linked_check_in_id uuid references check_ins(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table sigh_events enable row level security;
drop policy if exists "sigh_events_v1_read" on sigh_events;
create policy "sigh_events_v1_read" on sigh_events for select using (true);
drop policy if exists "sigh_events_v1_write" on sigh_events;
create policy "sigh_events_v1_write" on sigh_events for all using (true) with check (true);

create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  category text not null,
  occurrence_count integer not null default 0,
  estimated_hours_per_week numeric,
  estimated_hours_source text,
  estimated_hours_confidence numeric,
  estimated_hours_review_status text default 'unreviewed',
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);

alter table patterns enable row level security;
drop policy if exists "patterns_v1_read" on patterns;
create policy "patterns_v1_read" on patterns for select using (true);
drop policy if exists "patterns_v1_write" on patterns;
create policy "patterns_v1_write" on patterns for all using (true) with check (true);

create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  pattern_id uuid references patterns(id) on delete set null,
  headline text not null,
  body text,
  body_source text,
  body_confidence numeric,
  body_review_status text default 'unreviewed',
  time_saved_minutes integer,
  difficulty_stars integer check (difficulty_stars between 1 and 5),
  energy_saved_stars integer check (energy_saved_stars between 1 and 5),
  chatgpt_prompt text,
  template_text text,
  n8n_link text,
  status text default 'active',
  created_at timestamptz not null default now()
);

alter table suggestions enable row level security;
drop policy if exists "suggestions_v1_read" on suggestions;
create policy "suggestions_v1_read" on suggestions for select using (true);
drop policy if exists "suggestions_v1_write" on suggestions;
create policy "suggestions_v1_write" on suggestions for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  target_table text,
  target_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into check_ins (id, mood, raw_text, time_estimate_minutes, time_estimate_source, time_estimate_confidence, time_estimate_review_status) values
  ('a1000000-0000-0000-0000-000000000001', '😩', 'Spent forever replying to perfume enquiries on Instagram DMs again. Same questions every single day.', 75, 'openai-gpt-4o', 0.91, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000002', '😐', 'Had to manually upload 12 product listings to Shopee one by one. There has to be a better way.', 90, 'openai-gpt-4o', 0.87, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000003', '🤯', 'Spent the whole morning writing Instagram captions. I do this every single week and it exhausts me.', 120, 'openai-gpt-4o', 0.93, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000004', '😩', 'Customer asked about shipping again. I must have answered this exact question 20 times this month.', 45, 'openai-gpt-4o', 0.89, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000005', '😮', 'Formatted my newsletter for two hours. The layout breaks every time I copy from Notion.', 120, 'openai-gpt-4o', 0.82, 'reviewed');

insert into friction_tags (check_in_id, category, category_source, category_confidence, category_review_status, repeat_flag, repeat_flag_source, repeat_flag_confidence, repeat_flag_review_status) values
  ('a1000000-0000-0000-0000-000000000001', 'Customer Support', 'openai-gpt-4o', 0.95, 'reviewed', true, 'openai-gpt-4o', 0.92, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000002', 'Product Uploads', 'openai-gpt-4o', 0.88, 'reviewed', true, 'openai-gpt-4o', 0.85, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000003', 'Content Creation', 'openai-gpt-4o', 0.94, 'reviewed', true, 'openai-gpt-4o', 0.90, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000004', 'Customer Support', 'openai-gpt-4o', 0.96, 'reviewed', true, 'openai-gpt-4o', 0.94, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000005', 'Content Creation', 'openai-gpt-4o', 0.86, 'reviewed', true, 'openai-gpt-4o', 0.83, 'reviewed');

insert into patterns (id, category, occurrence_count, estimated_hours_per_week, estimated_hours_source, estimated_hours_confidence, estimated_hours_review_status, period_start, period_end) values
  ('b1000000-0000-0000-0000-000000000001', 'Customer Support', 6, 4.5, 'openai-gpt-4o', 0.88, 'reviewed', current_date - 7, current_date),
  ('b1000000-0000-0000-0000-000000000002', 'Content Creation', 5, 3.5, 'openai-gpt-4o', 0.85, 'reviewed', current_date - 7, current_date),
  ('b1000000-0000-0000-0000-000000000003', 'Product Uploads', 3, 1.5, 'openai-gpt-4o', 0.80, 'reviewed', current_date - 7, current_date);

insert into suggestions (pattern_id, headline, body, body_source, body_confidence, body_review_status, time_saved_minutes, difficulty_stars, energy_saved_stars, chatgpt_prompt, template_text, n8n_link) values
  ('b1000000-0000-0000-0000-000000000001', 'Create a Customer Support FAQ reply template', 'You answered the same shipping and product questions 6 times this week. A pinned FAQ comment or saved-reply bank in Instagram would cut this to near zero.', 'openai-gpt-4o', 0.91, 'reviewed', 270, 1, 5, 'Write 10 concise Instagram DM reply templates for a perfume brand covering: shipping time, pricing, ingredients, custom orders, and wholesale. Friendly tone, under 3 sentences each.', 'Hi [Name]! Thanks for reaching out 💜 Our shipping takes 3–5 business days. You can track your order at [link]. Let me know if you need anything else!', null),
  ('b1000000-0000-0000-0000-000000000002', 'Build a weekly content batch system', 'You spent 2+ hours on captions and newsletter formatting this week. Batching all content into one focused session per week saves context-switching time.', 'openai-gpt-4o', 0.87, 'reviewed', 210, 2, 4, 'Generate 7 Instagram captions for a luxury handmade perfume brand. Themes: sensory experience, behind-the-scenes, customer love, ingredients, self-care ritual, new arrival tease, weekend mood. Warm and poetic tone.', null, null);