-- Postgres 16 isolado: espelho MINIMO de tipos, RLS e estruturas observadas em 29/10.
-- Nenhum dado real, senha ou conexao ao Supabase de producao.
create role authenticated;
create role anon;
create schema auth;
grant usage on schema auth to authenticated,anon;
-- No CI SQL direto usa app.test_uid; no PostgREST isolado usa claim JWT real.
-- Somente fixture descartavel, nunca aplicado ao Supabase de producao.
create function auth.uid() returns uuid language sql stable as
  $uid$ select coalesce(
    nullif(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub',''),
    nullif(current_setting('app.test_uid',true),'')
  )::uuid $uid$;
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
('22222222-2222-4222-8222-222222222222','Gestor ficticio','admin'),
('99999999-9999-4999-8999-999999999999','Consultor com marco falsamente concluido antes da migracao','consultant');
insert into public.modules(id,code,is_published)
values('55555555-5555-4555-8555-555555555555','TESTE',true);
insert into public.lessons(id,module_id,code,content,is_published) values
('33333333-3333-4333-8333-333333333333','55555555-5555-4555-8555-555555555555','HISTORICA','{"body":"sem prova","minimum_score":8,"retest_rule":"revisao orientada, sem prova A/B"}',true),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','55555555-5555-4555-8555-555555555555','HISTORICA-FALSE','{"body":"sem prova","minimum_score":8,"retest_rule":"revisao orientada","exam_required":false}',true),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','55555555-5555-4555-8555-555555555555','HISTORICA-DESTINO','{"body":"aula legada sem progresso do consultor ficticio"}',true);
with a as (
 select jsonb_agg(jsonb_build_array('A pergunta '||i,jsonb_build_array('Certa','Errada'),0,i=1) order by i) bank
 from generate_series(1,10) i
),b as (
 select jsonb_agg(jsonb_build_array('B pergunta '||i,jsonb_build_array('Certa','Errada'),0,i=1) order by i) bank
 from generate_series(1,10) i
)
insert into public.lessons(id,module_id,code,content,is_published)
select id,'55555555-5555-4555-8555-555555555555',code,
 case when code='EXAM-PASS-SCORE'
 then jsonb_build_object('questions_a',a.bank,'questions_b',b.bank,'pass_score',9)
 else jsonb_build_object('questions_a',a.bank,'questions_b',b.bank,'minimum_score',8)
 end,(code='EXAM-EXPOSTO')
from a cross join b cross join (values
 ('44444444-4444-4444-8444-444444444444'::uuid,'EXAM-APROVA'),
 ('66666666-6666-4666-8666-666666666666'::uuid,'EXAM-RETESTE'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'EXAM-EXPOSTO'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,'F1-D30-A01'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,'EXAM-PASS-SCORE'),
 ('f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2'::uuid,'F2-D34-A01')
) as v(id,code);

-- Rubrica realista da aula F2, cinco competencias valendo 0 a 2 pontos.
update public.lessons set content=jsonb_set(content,'{manager_practical_rubric}',
 '{"criteria":["comparacao por ambiente","respeito ao projeto","confirmado versus pendente","alcada comercial","proximo passo"],"minimum_score":8,"points_per_criterion":2}'::jsonb)
where code='F2-D34-A01';

-- Legado preexistente, que a migracao nao pode alterar.
insert into public.lesson_progress(user_id,lesson_id,status,started_at,completed_at)
values('11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333','completed',now(),now());

-- Marco 30 ficticio: duas simulacoes com notas independentes (projeto e peca).
update public.lessons
set content=jsonb_set(content,'{milestone}',
 '{"day":30,"criteria":{"practice_project_min":8,"practice_piece_min":8,"critical_errors_allowed":0}}'::jsonb)
where code='F1-D30-A01';

-- Simula dado legado indevido existente ANTES da migracao: status completed
-- do Marco 30 sem prova, sem decisao do gestor. Nunca deve liberar F2.
insert into public.lesson_progress(user_id,lesson_id,status,started_at,completed_at)
values('99999999-9999-4999-8999-999999999999',
       'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','completed',now(),now());
