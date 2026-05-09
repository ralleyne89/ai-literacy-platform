-- LitmusAI canonical Supabase schema.
-- This mirrors the Flask/Alembic data model so Render Postgres data can be imported
-- without losing users, assessments, progress, certifications, or Stripe state.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public."user" (
  id text primary key default gen_random_uuid()::text,
  email text not null unique,
  password_hash text not null default 'supabase_managed',
  auth_provider text,
  auth_subject text,
  first_name text not null default 'AI',
  last_name text not null default 'Learner',
  role text,
  organization text,
  subscription_tier text default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_user_auth_provider_subject unique (auth_provider, auth_subject)
);

create table if not exists public.assessment (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  domain text not null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  explanation text,
  difficulty_level integer default 1,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.training_module (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  role_specific text,
  difficulty_level integer default 1,
  estimated_duration_minutes integer not null default 0,
  content_type text not null default 'video',
  content_url text,
  prerequisites text,
  learning_objectives text,
  is_premium boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  target_domains text
);

create table if not exists public.assessment_result (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."user"(id) on delete cascade,
  total_score integer not null,
  max_score integer not null,
  percentage double precision not null,
  functional_score integer default 0,
  ethical_score integer default 0,
  rhetorical_score integer default 0,
  pedagogical_score integer default 0,
  domain_scores jsonb,
  assessment_level text check (assessment_level is null or assessment_level in ('beginner', 'intermediate', 'advanced')),
  generation_source text default 'curated_fallback' check (
    generation_source is null or generation_source in ('curated_fallback', 'openrouter')
  ),
  time_taken_minutes integer,
  recommendations text,
  completed_at timestamptz default now()
);

create table if not exists public.user_progress (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."user"(id) on delete cascade,
  module_id text not null references public.training_module(id) on delete cascade,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  progress_percentage integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  time_spent_minutes integer default 0,
  current_lesson_id text,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_module_progress unique (user_id, module_id)
);

create table if not exists public.certification_type (
  id text primary key,
  title text not null,
  description text,
  requirements jsonb default '[]'::jsonb,
  estimated_time text,
  skills_validated jsonb default '[]'::jsonb,
  access_tier text default 'free',
  is_premium boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.certification (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."user"(id) on delete cascade,
  certification_type text not null,
  catalog_id text references public.certification_type(id) on delete set null,
  verification_code text not null unique,
  issued_at timestamptz default now(),
  expires_at timestamptz,
  is_valid boolean default true,
  badge_url text,
  skills_validated text
);

create table if not exists public.lesson (
  id text primary key default gen_random_uuid()::text,
  module_id text not null references public.training_module(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null,
  content_type text not null,
  content text,
  estimated_duration_minutes integer default 10,
  is_required boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.lesson_progress (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."user"(id) on delete cascade,
  lesson_id text not null references public.lesson(id) on delete cascade,
  module_id text not null references public.training_module(id) on delete cascade,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  time_spent_minutes integer default 0,
  quiz_score integer,
  quiz_attempts integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed timestamptz default now(),
  constraint unique_user_lesson unique (user_id, lesson_id)
);

create index if not exists idx_user_auth_identity on public."user"(auth_provider, auth_subject);
create index if not exists idx_user_email on public."user"(email);
create index if not exists idx_user_stripe_customer_id on public."user"(stripe_customer_id);
create index if not exists idx_assessment_result_user_id on public.assessment_result(user_id);
create index if not exists idx_assessment_result_completed_at on public.assessment_result(completed_at desc);
create index if not exists idx_assessment_result_assessment_level on public.assessment_result(assessment_level);
create index if not exists idx_training_module_active on public.training_module(is_active);
create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
create index if not exists idx_user_progress_module_id on public.user_progress(module_id);
create index if not exists idx_certification_user_id on public.certification(user_id);
create index if not exists idx_certification_catalog_id on public.certification(catalog_id);
create index if not exists idx_lesson_module_id on public.lesson(module_id);
create index if not exists idx_lesson_progress_user_id on public.lesson_progress(user_id);
create index if not exists idx_lesson_progress_lesson_id on public.lesson_progress(lesson_id);
create index if not exists idx_lesson_progress_module_id on public.lesson_progress(module_id);

drop trigger if exists set_user_updated_at on public."user";
create trigger set_user_updated_at
before update on public."user"
for each row execute function public.set_updated_at();

drop trigger if exists set_user_progress_updated_at on public.user_progress;
create trigger set_user_progress_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

drop trigger if exists set_certification_type_updated_at on public.certification_type;
create trigger set_certification_type_updated_at
before update on public.certification_type
for each row execute function public.set_updated_at();

create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public."user" u
  where u.id = auth.uid()::text
     or (u.auth_provider = 'supabase' and u.auth_subject = auth.uid()::text)
  order by case when u.id = auth.uid()::text then 0 else 1 end
  limit 1
$$;

alter table public."user" enable row level security;
alter table public.assessment enable row level security;
alter table public.training_module enable row level security;
alter table public.assessment_result enable row level security;
alter table public.user_progress enable row level security;
alter table public.certification_type enable row level security;
alter table public.certification enable row level security;
alter table public.lesson enable row level security;
alter table public.lesson_progress enable row level security;

drop policy if exists user_select_own on public."user";
create policy user_select_own
  on public."user"
  for select
  to authenticated
  using (id = public.current_app_user_id());

drop policy if exists user_update_own on public."user";
create policy user_update_own
  on public."user"
  for update
  to authenticated
  using (id = public.current_app_user_id())
  with check (id = public.current_app_user_id());

drop policy if exists assessment_read_active on public.assessment;
create policy assessment_read_active
  on public.assessment
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists training_module_read_active on public.training_module;
create policy training_module_read_active
  on public.training_module
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists lesson_read_authenticated on public.lesson;
create policy lesson_read_authenticated
  on public.lesson
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.training_module tm
      where tm.id = lesson.module_id
        and tm.is_active = true
    )
  );

drop policy if exists assessment_result_own_select on public.assessment_result;
create policy assessment_result_own_select
  on public.assessment_result
  for select
  to authenticated
  using (user_id = public.current_app_user_id());

drop policy if exists assessment_result_own_insert on public.assessment_result;
create policy assessment_result_own_insert
  on public.assessment_result
  for insert
  to authenticated
  with check (user_id = public.current_app_user_id());

drop policy if exists user_progress_own_select on public.user_progress;
create policy user_progress_own_select
  on public.user_progress
  for select
  to authenticated
  using (user_id = public.current_app_user_id());

drop policy if exists user_progress_own_insert on public.user_progress;
create policy user_progress_own_insert
  on public.user_progress
  for insert
  to authenticated
  with check (user_id = public.current_app_user_id());

drop policy if exists user_progress_own_update on public.user_progress;
create policy user_progress_own_update
  on public.user_progress
  for update
  to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

drop policy if exists lesson_progress_own_select on public.lesson_progress;
create policy lesson_progress_own_select
  on public.lesson_progress
  for select
  to authenticated
  using (user_id = public.current_app_user_id());

drop policy if exists lesson_progress_own_insert on public.lesson_progress;
create policy lesson_progress_own_insert
  on public.lesson_progress
  for insert
  to authenticated
  with check (user_id = public.current_app_user_id());

drop policy if exists lesson_progress_own_update on public.lesson_progress;
create policy lesson_progress_own_update
  on public.lesson_progress
  for update
  to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

drop policy if exists certification_type_read on public.certification_type;
create policy certification_type_read
  on public.certification_type
  for select
  to anon, authenticated
  using (true);

drop policy if exists certification_own_select on public.certification;
create policy certification_own_select
  on public.certification
  for select
  to authenticated
  using (user_id = public.current_app_user_id());

-- Edge Functions use SUPABASE_SERVICE_ROLE_KEY for inserts/updates, Stripe webhook
-- writes, and public verification responses. Direct browser writes remain closed.
