-- Persist adaptive assessment metadata for generated and curated question sets.

alter table public.assessment_result
  add column if not exists assessment_level text;

alter table public.assessment_result
  add column if not exists generation_source text default 'curated_fallback';

update public.assessment_result
set generation_source = 'curated_fallback'
where generation_source is null;

alter table public.assessment_result
  alter column generation_source set default 'curated_fallback';

do $$
begin
  alter table public.assessment_result
    add constraint assessment_result_assessment_level_check
    check (assessment_level is null or assessment_level in ('beginner', 'intermediate', 'advanced'));
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.assessment_result
    add constraint assessment_result_generation_source_check
    check (generation_source is null or generation_source in ('curated_fallback', 'openrouter'));
exception
  when duplicate_object then null;
end;
$$;

create index if not exists idx_assessment_result_assessment_level
  on public.assessment_result(assessment_level);
