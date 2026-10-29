-- PREPARACAO PARA HOMOLOGACAO ISOLADA. NAO APLICAR NA PRODUCAO SEM TESTES RLS.
-- Preserva aulas historicas sem prova e todos os registros preexistentes.
begin;

create schema if not exists training_private;
revoke all on schema training_private from public, anon, authenticated;

-- Vulnerabilidade real observada: profiles_self_update aceita UPDATE da
-- propria linha sem restringir role. Sem este trigger consultor pode virar admin.
create or replace function training_private.protect_profile_role()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,training_private
as $role$
begin
 if new.id is distinct from old.id then
   raise exception 'Identidade do perfil nao pode ser alterada';
 end if;
 if new.role is distinct from old.role and (auth.uid() is null or not public.is_admin()) then
   raise exception 'Somente gestor pode alterar papel de acesso';
 end if;
 return new;
end
$role$;
drop trigger if exists training_profile_role_guard on public.profiles;
create trigger training_profile_role_guard
before update on public.profiles
for each row execute function training_private.protect_profile_role();

-- Gabaritos jamais podem permanecer em lessons.content acessivel ao consultor.
create table if not exists training_private.exam_banks (
  lesson_id uuid primary key references public.lessons(id) on delete restrict,
  questions_a jsonb, questions_b jsonb,
  minimum_score integer not null default 8 check (minimum_score between 8 and 10)
);
revoke all on training_private.exam_banks from public,anon,authenticated;
alter table training_private.exam_banks enable row level security;

create table if not exists training_private.exam_decisions (
  submission_id uuid primary key references public.submissions(id) on delete restrict,
  user_id uuid not null references public.profiles(id),
  lesson_id uuid not null references public.lessons(id),
  reviewer_id uuid not null references public.profiles(id),
  decision public.submission_status not null,
  theory_score smallint not null check (theory_score between 0 and 10),
  critical_errors smallint not null check (critical_errors between 0 and 10),
  practice_score smallint not null check (practice_score between 0 and 10),
  practice_approved boolean not null,
  feedback text not null check (length(btrim(feedback)) >= 20),
  reviewed_at timestamptz not null default now(),
  constraint exam_decisions_valid_status check (decision in ('approved','needs_revision'))
);
create unique index if not exists exam_decisions_one_approval_per_lesson
  on training_private.exam_decisions(user_id,lesson_id) where decision='approved';
revoke all on all tables in schema training_private from public, anon, authenticated;
alter table training_private.exam_decisions enable row level security;

-- Migracao atomica: copia os bancos antes de remover gabaritos publicos.
insert into training_private.exam_banks(lesson_id,questions_a,questions_b,minimum_score)
select id,content->'questions_a',content->'questions_b',
       coalesce((content->>'minimum_score')::integer,8)
from public.lessons
where content ? 'questions_a' or content ? 'questions_b'
on conflict(lesson_id) do update set
  questions_a=excluded.questions_a,questions_b=excluded.questions_b,
  minimum_score=excluded.minimum_score;

do $verify$
begin
 if exists (
   select 1 from public.lessons l
   where (l.content ? 'questions_a' or l.content ? 'questions_b')
     and not exists (
       select 1 from training_private.exam_banks b
       where b.lesson_id=l.id
         and b.questions_a is not distinct from l.content->'questions_a'
         and b.questions_b is not distinct from l.content->'questions_b'
     )
 ) then raise exception 'Falha de integridade na copia dos gabaritos'; end if;
end
$verify$;

update public.lessons
set content = ((content - 'questions_a') - 'questions_b') ||
              '{"exam_required":true}'::jsonb
where content ? 'questions_a' or content ? 'questions_b';

-- Nao existe rota PostgREST publica para exam_banks.
-- O RPC entrega apenas enunciado e alternativas, nunca indice correto ou erro critico.
create or replace function public.training_exam_questions(p_lesson_id uuid,p_stage text)
returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,public,training_private
as $questions$
declare v_bank jsonb; v_result jsonb;
begin
 if auth.uid() is null or p_stage not in ('a','b') then
   raise exception 'Acesso nao autorizado a prova';
 end if;
 if not exists(select 1 from public.lessons l
   join public.modules m on m.id=l.module_id
   where l.id=p_lesson_id and l.is_published and m.is_published) then
   raise exception 'Aula nao publicada';
 end if;
 if p_stage='b' and not exists(
   select 1 from public.submissions s
   join training_private.exam_banks eb on eb.lesson_id=s.lesson_id
   where s.user_id=auth.uid() and s.lesson_id=p_lesson_id
     and s.submission_type='lesson_exam_a' and s.status='needs_revision'
     and (training_private.grade_exam(eb.questions_a,
          (s.text_content::jsonb)->'answers',eb.minimum_score)->>'passed')::boolean=false
 ) then raise exception 'Reteste nao autorizado'; end if;
 select case when p_stage='a' then questions_a else questions_b end
   into v_bank from training_private.exam_banks where lesson_id=p_lesson_id;
 if jsonb_typeof(v_bank) is distinct from 'array' or jsonb_array_length(v_bank) <> 10 then
   raise exception 'Prova indisponivel';
 end if;
 select jsonb_agg(jsonb_build_array(q.value->0,q.value->1) order by q.ordinality)
   into v_result from jsonb_array_elements(v_bank) with ordinality as q(value,ordinality);
 return v_result;
end
$questions$;
revoke all on function public.training_exam_questions(uuid,text) from public,anon;
grant execute on function public.training_exam_questions(uuid,text) to authenticated;

create or replace function public.training_exam_audit(p_submission_id uuid)
returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,public,training_private
as $audit$
declare v_s public.submissions%rowtype; v_payload jsonb; v_bank jsonb;
        v_min integer; v_grade jsonb;
begin
 if auth.uid() is null or not public.is_admin() then
   raise exception 'Somente gestor pode consultar a correcao';
 end if;
 select * into v_s from public.submissions where id=p_submission_id
   and submission_type in ('lesson_exam_a','lesson_exam_b');
 if not found then raise exception 'Prova nao encontrada'; end if;
 begin v_payload:=v_s.text_content::jsonb;
 exception when others then raise exception 'Prova inconsistente'; end;
 if v_payload->'version' is distinct from '1'::jsonb
    or v_payload->>'stage' is distinct from right(v_s.submission_type,1)
    or v_payload->'requires_manager_validation' is distinct from 'true'::jsonb
 then raise exception 'Prova inconsistente'; end if;
 select case when v_s.submission_type='lesson_exam_a' then questions_a else questions_b end,
        minimum_score into v_bank,v_min
 from training_private.exam_banks where lesson_id=v_s.lesson_id;
 v_grade:=training_private.grade_exam(v_bank,v_payload->'answers',v_min);
 if (v_grade->>'valid')::boolean is distinct from true then
   raise exception 'Gabarito ou respostas inconsistentes';
 end if;
 return v_grade;
end
$audit$;
revoke all on function public.training_exam_audit(uuid) from public,anon;
grant execute on function public.training_exam_audit(uuid) to authenticated;

-- Uma prova A e um reteste B por consultor/aula, inclusive sob concorrencia.
create unique index if not exists submissions_exam_unique_attempt
  on public.submissions(user_id,lesson_id,submission_type)
  where submission_type in ('lesson_exam_a','lesson_exam_b');

-- Nao confiar na nota preliminar recebida do navegador.
create or replace function training_private.grade_exam(
  p_bank jsonb, p_answers jsonb, p_min_score integer
) returns jsonb
language plpgsql stable
set search_path = pg_catalog, public, training_private
as $fn$
declare
  i integer; q jsonb; options jsonb; correct integer; answer integer;
  score integer := 0; critical integer := 0;
begin
  if jsonb_typeof(p_bank) is distinct from 'array'
    or jsonb_typeof(p_answers) is distinct from 'array'
    or jsonb_array_length(p_bank) <> 10 or jsonb_array_length(p_answers) <> 10
    or p_min_score is null or p_min_score not between 8 and 10 then
    return '{"valid":false}'::jsonb;
  end if;
  for i in 0..9 loop
    q := p_bank->i; options := q->1;
    if jsonb_typeof(q) is distinct from 'array'
      or jsonb_array_length(q) < 4
      or jsonb_typeof(q->0) is distinct from 'string'
      or jsonb_typeof(options) is distinct from 'array'
      or jsonb_array_length(options) < 2
      or jsonb_typeof(q->2) is distinct from 'number'
      or jsonb_typeof(q->3) is distinct from 'boolean'
      or jsonb_typeof(p_answers->i) is distinct from 'number'
      or (q->>2) !~ '^[0-9]+$'
      or (p_answers->>i) !~ '^[0-9]+$' then
      return '{"valid":false}'::jsonb;
    end if;
    correct := (q->>2)::integer; answer := (p_answers->>i)::integer;
    if correct >= jsonb_array_length(options)
      or answer >= jsonb_array_length(options) then
      return '{"valid":false}'::jsonb;
    end if;
    if answer=correct then score:=score+1;
    elsif q->3='true'::jsonb then critical:=critical+1;
    end if;
  end loop;
  return jsonb_build_object('valid',true,'score',score,'critical',critical,
    'passed',score>=p_min_score and critical=0);
exception when others then
  return '{"valid":false}'::jsonb;
end
$fn$;

create or replace function training_private.exam_submission_guard()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, training_private
as $fn$
declare
  v_content jsonb; v_published boolean; v_module_published boolean;
  v_payload jsonb; v_grade jsonb; v_prior public.submissions%rowtype;
  v_decision training_private.exam_decisions%rowtype;
  v_bank jsonb; v_min integer;
begin
  if tg_op='DELETE' then
    if old.submission_type in ('lesson_exam_a','lesson_exam_b') then
      raise exception 'Provas A/B sao imutaveis; exclusao proibida';
    end if;
    return old;
  end if;

  if tg_op='INSERT' then
    if new.submission_type not in ('lesson_exam_a','lesson_exam_b') then return new; end if;
    if auth.uid() is null or new.user_id is distinct from auth.uid()
      or new.status <> 'pending'
      or new.reviewer_id is not null or new.reviewer_feedback is not null
      or new.reviewed_at is not null or new.file_url is not null then
      raise exception 'Prova deve ser enviada pelo proprio consultor, pendente e sem revisao';
    end if;
    select l.content,l.is_published,m.is_published
      into v_content,v_published,v_module_published
      from public.lessons l join public.modules m on m.id=l.module_id
      where l.id=new.lesson_id;
    if not found or not v_published or not v_module_published then
      raise exception 'Aula de prova nao publicada';
    end if;
    begin v_payload:=new.text_content::jsonb;
    exception when others then raise exception 'JSON de prova invalido'; end;
    if jsonb_typeof(v_payload) is distinct from 'object'
      or v_payload->'version' is distinct from '1'::jsonb
      or v_payload->>'stage' is distinct from right(new.submission_type,1)
      or v_payload->'requires_manager_validation' is distinct from 'true'::jsonb then
      raise exception 'Metadados de prova inconsistentes';
    end if;
    select case when new.submission_type='lesson_exam_a' then questions_a else questions_b end,
           minimum_score into v_bank,v_min
      from training_private.exam_banks where lesson_id=new.lesson_id;
    v_grade:=training_private.grade_exam(v_bank,v_payload->'answers',v_min);
    if (v_grade->>'valid')::boolean is distinct from true then
      raise exception 'Banco ou respostas de prova invalidos';
    end if;
    if new.submission_type='lesson_exam_a' then
      if length(btrim(coalesce(v_payload->>'evidence',''))) < 80 then
        raise exception 'Pratica escrita insuficiente';
      end if;
    else
      if length(btrim(coalesce(v_payload->>'review',''))) < 80 then
        raise exception 'Revisao escrita insuficiente';
      end if;
      select * into v_prior from public.submissions
        where user_id=new.user_id and lesson_id=new.lesson_id
          and submission_type='lesson_exam_a';
      if not found or v_prior.status<>'needs_revision' then raise exception 'Reteste exige revisao gerencial da prova A'; end if;
      begin v_payload:=v_prior.text_content::jsonb;
      exception when others then raise exception 'Prova A anterior invalida'; end;
      select questions_a,minimum_score into v_bank,v_min
        from training_private.exam_banks where lesson_id=new.lesson_id;
      v_grade:=training_private.grade_exam(v_bank,v_payload->'answers',v_min);
      if (v_grade->>'valid')::boolean is distinct from true
        or (v_grade->>'passed')::boolean is distinct from false then
        raise exception 'Reteste permitido somente apos reprovar na prova A';
      end if;
    end if;
    return new;
  end if;

  if old.submission_type not in ('lesson_exam_a','lesson_exam_b')
    and new.submission_type not in ('lesson_exam_a','lesson_exam_b') then return new; end if;
  if old.submission_type not in ('lesson_exam_a','lesson_exam_b')
    or new.submission_type is distinct from old.submission_type
    or old.status='approved'
    or new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.lesson_id is distinct from old.lesson_id
    or new.text_content is distinct from old.text_content
    or new.file_url is distinct from old.file_url
    or new.submitted_at is distinct from old.submitted_at then
    raise exception 'Tentativa de alterar dados imutaveis de prova';
  end if;
  select * into v_decision from training_private.exam_decisions
    where submission_id=old.id;
  if not found or new.status is distinct from v_decision.decision
    or new.reviewer_id is distinct from v_decision.reviewer_id
    or new.reviewer_feedback is distinct from v_decision.feedback
    or new.reviewed_at is distinct from v_decision.reviewed_at then
    raise exception 'Somente revisao gerencial validada pode alterar prova';
  end if;
  return new;
end
$fn$;

drop trigger if exists training_exam_submission_guard on public.submissions;
create trigger training_exam_submission_guard
  before insert or update or delete on public.submissions
  for each row execute function training_private.exam_submission_guard();

-- Politica de UPDATE do consultor preservada apenas para missoes historicas.
drop policy if exists submissions_update_own on public.submissions;
create policy submissions_update_own on public.submissions for update to authenticated
  using (user_id=auth.uid() and submission_type not in ('lesson_exam_a','lesson_exam_b'))
  with check (user_id=auth.uid() and submission_type not in ('lesson_exam_a','lesson_exam_b'));

create or replace function training_private.exam_progress_guard()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, training_private
as $fn$
declare
  v_content jsonb; v_exam boolean;
  v_decision training_private.exam_decisions%rowtype;
  v_user uuid; v_lesson uuid;
begin
  v_user:=case when tg_op='DELETE' then old.user_id else new.user_id end;
  v_lesson:=case when tg_op='DELETE' then old.lesson_id else new.lesson_id end;
  select content into v_content from public.lessons where id=v_lesson;
  v_exam := v_content ? 'exam_required'
    or exists(select 1 from training_private.exam_banks where lesson_id=v_lesson)
    or v_content ? 'minimum_score' or v_content ? 'retest_rule';
  if not coalesce(v_exam,false) then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  if tg_op='DELETE' then
    if old.status='completed' or old.completed_at is not null then
      raise exception 'Conclusao de prova aprovada nao pode ser excluida';
    end if;
    return old;
  end if;
  if tg_op='UPDATE' and old.status='completed' and new is distinct from old then
    raise exception 'Conclusao de prova aprovada e imutavel';
  end if;
  if new.status='completed' or new.completed_at is not null then
    select d.* into v_decision from training_private.exam_decisions d
      join public.submissions s on s.id=d.submission_id
      where d.user_id=new.user_id and d.lesson_id=new.lesson_id
        and d.decision='approved' and s.status='approved'
        and s.submission_type in ('lesson_exam_a','lesson_exam_b');
    if not found or new.status <> 'completed'
      or new.completed_at is distinct from v_decision.reviewed_at then
      raise exception 'Conclusao exige prova e pratica aprovadas pelo gestor';
    end if;
  end if;
  return new;
end
$fn$;

drop trigger if exists training_exam_progress_guard on public.lesson_progress;
create trigger training_exam_progress_guard
  before insert or update or delete on public.lesson_progress
  for each row execute function training_private.exam_progress_guard();

-- RPC atomica: apenas admin autenticado; gabarito e pratica conferidos no banco.
create or replace function public.training_review_exam(
  p_submission_id uuid, p_decision text, p_practice_score integer,
  p_practice_approved boolean, p_feedback text
) returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, training_private
as $fn$
declare
  v_actor uuid:=auth.uid(); v_submission public.submissions%rowtype;
  v_content jsonb; v_payload jsonb; v_grade jsonb;
  v_a public.submissions%rowtype; v_grade_a jsonb;
  v_decision training_private.exam_decisions%rowtype;
  v_status public.submission_status;
  v_bank jsonb; v_min integer;
begin
  if v_actor is null or not public.is_admin() then
    raise exception 'Apenas gestor autenticado pode revisar prova';
  end if;
  if p_decision not in ('approve','needs_revision')
    or p_practice_score is null or p_practice_score not between 0 and 10
    or p_practice_approved is null
    or length(btrim(coalesce(p_feedback,''))) < 20 then
    raise exception 'Decisao, nota pratica ou justificativa invalida';
  end if;
  select * into v_submission from public.submissions
    where id=p_submission_id for update;
  if not found or v_submission.submission_type not in ('lesson_exam_a','lesson_exam_b')
    or v_submission.status not in ('pending','needs_revision') then
    raise exception 'Prova inexistente, concluida ou nao revisavel';
  end if;
  select l.content into v_content from public.lessons l
    join public.modules m on m.id=l.module_id
    where l.id=v_submission.lesson_id and l.is_published and m.is_published;
  if not found then raise exception 'Aula ainda nao publicada'; end if;
  if (select count(*) from public.submissions
      where user_id=v_submission.user_id and lesson_id=v_submission.lesson_id
        and submission_type=v_submission.submission_type) <> 1 then
    raise exception 'Tentativa duplicada';
  end if;
  begin v_payload:=v_submission.text_content::jsonb;
  exception when others then raise exception 'Prova salva invalida'; end;
  if v_payload->'version' is distinct from '1'::jsonb
    or v_payload->>'stage' is distinct from right(v_submission.submission_type,1)
    or v_payload->'requires_manager_validation' is distinct from 'true'::jsonb then
    raise exception 'Metadados de prova adulterados';
  end if;
  select case when v_submission.submission_type='lesson_exam_a' then questions_a else questions_b end,
         minimum_score into v_bank,v_min
  from training_private.exam_banks where lesson_id=v_submission.lesson_id;
  v_grade:=training_private.grade_exam(v_bank,v_payload->'answers',v_min);
  if (v_grade->>'valid')::boolean is distinct from true then
    raise exception 'Gabarito ou respostas invalidos';
  end if;
  if v_submission.submission_type='lesson_exam_a' then
    if length(btrim(coalesce(v_payload->>'evidence',''))) < 80 then
      raise exception 'Evidencia pratica insuficiente';
    end if;
  else
    if length(btrim(coalesce(v_payload->>'review',''))) < 80 then
      raise exception 'Revisao escrita insuficiente';
    end if;
    select * into v_a from public.submissions
      where user_id=v_submission.user_id and lesson_id=v_submission.lesson_id
        and submission_type='lesson_exam_a';
    if not found then raise exception 'Reteste B sem prova A'; end if;
    begin v_payload:=v_a.text_content::jsonb;
    exception when others then raise exception 'Prova A invalida'; end;
    if length(btrim(coalesce(v_payload->>'evidence',''))) < 80 then
      raise exception 'Pratica original insuficiente';
    end if;
    select questions_a,minimum_score into v_bank,v_min
      from training_private.exam_banks where lesson_id=v_submission.lesson_id;
    v_grade_a:=training_private.grade_exam(v_bank,v_payload->'answers',v_min);
    if (v_grade_a->>'valid')::boolean is distinct from true
      or (v_grade_a->>'passed')::boolean is distinct from false then
      raise exception 'Reteste B sem reprovar validamente na prova A';
    end if;
  end if;
  if p_decision='approve' and (
    (v_grade->>'passed')::boolean is distinct from true
    or p_practice_approved is distinct from true or p_practice_score < 8
  ) then raise exception 'Aprovacao exige teoria 8/10 sem erro critico e pratica validada >=8'; end if;
  v_status:=case when p_decision='approve' then 'approved'::public.submission_status
                 else 'needs_revision'::public.submission_status end;
  insert into training_private.exam_decisions(
    submission_id,user_id,lesson_id,reviewer_id,decision,theory_score,
    critical_errors,practice_score,practice_approved,feedback,reviewed_at
  ) values (
    v_submission.id,v_submission.user_id,v_submission.lesson_id,v_actor,v_status,
    (v_grade->>'score')::smallint,(v_grade->>'critical')::smallint,
    p_practice_score::smallint,p_practice_approved,btrim(p_feedback),clock_timestamp()
  )
  on conflict (submission_id) do update set
    reviewer_id=excluded.reviewer_id,decision=excluded.decision,
    theory_score=excluded.theory_score,critical_errors=excluded.critical_errors,
    practice_score=excluded.practice_score,practice_approved=excluded.practice_approved,
    feedback=excluded.feedback,reviewed_at=excluded.reviewed_at
  where training_private.exam_decisions.decision='needs_revision'
  returning * into v_decision;
  if not found then raise exception 'Revisao ja encerrada'; end if;

  update public.submissions set status=v_status,reviewer_id=v_actor,
    reviewer_feedback=v_decision.feedback,reviewed_at=v_decision.reviewed_at
    where id=v_submission.id;
  if p_decision='approve' then
    insert into public.lesson_progress(user_id,lesson_id,status,started_at,completed_at,updated_at)
      values(v_submission.user_id,v_submission.lesson_id,'completed',v_decision.reviewed_at,
        v_decision.reviewed_at,clock_timestamp())
    on conflict (user_id,lesson_id) do update set
      status='completed',started_at=coalesce(public.lesson_progress.started_at,excluded.started_at),
      completed_at=excluded.completed_at,updated_at=excluded.updated_at;
  end if;
  return jsonb_build_object('status',v_status::text,'theory_score',v_grade->'score',
    'critical_errors',v_grade->'critical','practice_score',p_practice_score,
    'completed',p_decision='approve');
end
$fn$;

revoke all on function public.training_review_exam(uuid,text,integer,boolean,text)
  from public,anon;
grant execute on function public.training_review_exam(uuid,text,integer,boolean,text)
  to authenticated;
revoke all on all functions in schema training_private from public,anon,authenticated;

commit;
