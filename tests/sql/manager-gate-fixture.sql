-- Postgres 16 isolado: espelho MINIMO de tipos, RLS e estruturas observadas em 29/10.
-- Nenhum dado real, senha ou conexao ao Supabase de producao.
create role authenticated;
create role anon;
create schema auth;
grant usage on schema auth to authenticated,anon;
-- No CI SQL direto usa app.test_uid; no PostgREST isolado usa claim JWT real.
-- Somente fixture descartavel, nunca aplicado ao Supabase de producao.
create function auth.uid() returns uuid language sql stable as
  $ select coalesce(
    nullif(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub',''),
    nullif(current_setting('app.test_uid',true),'')
  )::uuid $;
grant execute on function auth.uid() to authenticated,anon;

create type public.app_role as enum ('admin','consultant');
create type public.progress_status as enum ('not_started','in_progress','completed');
create type public.submission_status as enum ('pending','approved','needs_revision');

create table public.profiles (
 id uuid primary key, full_name text not null default '', role public.app_role not null default 'consultant'
);
create table public.modules (
 id uuid primary key,code text unique not null,is_published boolean not null default false
);
create table public.lessons (
 id uuid primary key,module_id uuid not null references public.modules(id),
 code text unique not null,content jsonb not null default '{}'::jsonb,
 is_published boolean not null default false
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id),
 lesson_id uuid not null references public.lessons(id),
 submission_type text not null default 'mission',
 text_content text,file_url text,
 status public.submission_status not null default 'pending',
 reviewer_id uuid references public.profiles(id),reviewer_feedback text,
 submitted_at timestamptz not null default now(),reviewed_at timestamptz
);
create table public.lesson_progress (
 user_id uuid not null references public.profiles(id),
 lesson_id uuid not null references public.lessons(id),
 status public.progress_status not null default 'not_started',
 started_at timestamptz,completed_at timestamptz,updated_at timestamptz not null default now(),
 primary key(user_id,lesson_id)
);

create function public.is_admin() returns boolean language sql stable security definer
set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
alter table public.profiles enable row level security;
create policy profiles_self_read on public.profiles for select
 using (id=auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update
 using (id=auth.uid() or public.is_admin())
 with check (id=auth.uid() or public.is_admin());
alter table public.submissions enable row level security;
alter table public.lesson_progress enable row level security;
create policy submissions_read on public.submissions for select
 using (user_id=auth.uid() or public.is_admin());
create policy submissions_insert on public.submissions for insert
 with check (user_id=auth.uid() or public.is_admin());
create policy submissions_update_own on public.submissions for update to authenticated
 using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy submissions_update_admin on public.submissions for update
 using (public.is_admin()) with check (public.is_admin());
create policy progress_read on public.lesson_progress for select
 using (user_id=auth.uid() or public.is_admin());
create policy progress_insert on public.lesson_progress for insert
 with check (user_id=auth.uid() or public.is_admin());
create policy progress_update on public.lesson_progress for update
 using (user_id=auth.uid() or public.is_admin())
 with check (user_id=auth.uid() or public.is_admin());

grant usage on schema public to authenticated,anon;
grant usage on type public.submission_status,public.progress_status,public.app_role to authenticated;
grant select,insert,update,delete on public.submissions,public.lesson_progress to authenticated;
grant select on public.profiles,public.lessons,public.modules to authenticated;
grant update on public.profiles to authenticated;
grant execute on function public.is_admin() to authenticated;

insert into public.profiles(id,full_name,role) values
('11111111-1111-4111-8111-111111111111','Consultor ficticio','consultant'),
('22222222-2222-4222-8222-222222222222','Gestor ficticio','admin');
insert into public.modules(id,code,is_published)
values('55555555-5555-4555-8555-555555555555','TESTE',true);
insert into public.lessons(id,module_id,code,content,is_published) values
('33333333-3333-4333-8333-333333333333','55555555-5555-4555-8555-555555555555','HISTORICA','{"body":"sem prova"}',true);
with a as (
 select jsonb_agg(jsonb_build_array('A pergunta '||i,jsonb_build_array('Certa','Errada'),0,i=1) order by i) bank
 from generate_series(1,10) i
),b as (
 select jsonb_agg(jsonb_build_array('B pergunta '||i,jsonb_build_array('Certa','Errada'),0,i=1) order by i) bank
 from generate_series(1,10) i
)
insert into public.lessons(id,module_id,code,content,is_published)
select id,'55555555-5555-4555-8555-555555555555',code,
 jsonb_build_object('questions_a',a.bank,'questions_b',b.bank,'minimum_score',8),(code='EXAM-EXPOSTO')
from a cross join b cross join (values
 ('44444444-4444-4444-8444-444444444444'::uuid,'EXAM-APROVA'),
 ('66666666-6666-4666-8666-666666666666'::uuid,'EXAM-RETESTE'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'EXAM-EXPOSTO')
) as v(id,code);

-- Legado preexistente, que a migracao nao pode alterar.
insert into public.lesson_progress(user_id,lesson_id,status,started_at,completed_at)
values('11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333','completed',now(),now());
