-- Execute APENAS no banco PostgreSQL temporario do CI.
create function public.test_expect_error(p_sql text,p_pattern text)
returns void language plpgsql as $fn$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm !~ p_pattern then
      raise exception 'Falha inesperada: %, esperado: %',sqlerrm,p_pattern;
    end if;
    return;
  end;
  raise exception 'Operacao insegura foi aceita: %',p_sql;
end
$fn$;

set role authenticated;
select set_config('app.test_uid','11111111-1111-4111-8111-111111111111',false);

-- RLS profiles_self_update nao pode permitir autoconceder role=admin.
select public.test_expect_error($sql$
 update public.profiles set role='admin'
 where id='11111111-1111-4111-8111-111111111111'
$sql$,'Somente gestor pode alterar papel');
-- Gabaritos migrados para schema privado, inacessiveis ao consultor.
do $check$
declare c jsonb; q jsonb;
begin
 select content into c from public.lessons
 where id='44444444-4444-4444-8444-444444444444';
 if c ? 'questions_a' or c ? 'questions_b'
    or c->'exam_required' is distinct from 'true'::jsonb then
   raise exception 'Gabarito ainda exposto em lessons.content';
 end if;
 select public.training_exam_questions(
   '44444444-4444-4444-8444-444444444444','a') into q;
 if jsonb_typeof(q) is distinct from 'array' or jsonb_array_length(q)<>10
    or jsonb_array_length(q->0)<>2 then
   raise exception 'RPC de perguntas vazou gabarito ou falhou';
 end if;
end
$check$;
select public.test_expect_error($sql$
 select * from training_private.exam_banks
$sql$,'permission denied');
select public.test_expect_error($sql$
 select public.training_exam_audit('77777777-7777-4777-8777-777777777777')
$sql$,'Somente gestor');

-- Regra historica: o consultor continua podendo concluir aula sem prova.
insert into public.lesson_progress(user_id,lesson_id,status,started_at,completed_at)
values('11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333','completed',now(),now())
on conflict (user_id,lesson_id) do update set updated_at=now();

select public.test_expect_error($sql$
 insert into public.lesson_progress(user_id,lesson_id,status,completed_at)
 values('11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444','completed',now())
$sql$,'Conclusao exige prova');

select public.test_expect_error($sql$
 insert into public.submissions(user_id,lesson_id,submission_type,status)
 values('11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444','lesson_exam_a','approved')
$sql$,'Prova deve ser enviada');

insert into public.submissions(id,user_id,lesson_id,submission_type,text_content,status)
values(
 '77777777-7777-4777-8777-777777777777',
 '11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444','lesson_exam_a',
 jsonb_build_object('version',1,'stage','a','requires_manager_validation',true,
  'answers',jsonb_build_array(0,0,0,0,0,0,0,0,0,0),
  'evidence',repeat('Pratica ficticia revisada com detalhes. ',4))::text,'pending'
);

select public.test_expect_error($sql$
 insert into public.submissions(user_id,lesson_id,submission_type,text_content)
 select user_id,lesson_id,submission_type,text_content from public.submissions
 where id='77777777-7777-4777-8777-777777777777'
$sql$,'duplicate key');

-- Prova A aprovada na teoria nao permite reteste B.
select public.test_expect_error($sql$
 insert into public.submissions(user_id,lesson_id,submission_type,text_content)
 values('11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444','lesson_exam_b',
 '{"version":1,"stage":"b","requires_manager_validation":true,"answers":[0,0,0,0,0,0,0,0,0,0],"review":"Revisao de pratica ficticia com todos os pontos e condutas explicados cuidadosamente."}')
$sql$,'Reteste exige revisao gerencial');

-- O proprio consultor nao consegue editar nota/status.
do $fn$
declare n integer;
begin
 update public.submissions set status='approved',
 reviewer_feedback='Falsificado',reviewed_at=now()
 where id='77777777-7777-4777-8777-777777777777';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Consultor conseguiu alterar prova'; end if;
end
$fn$;

select public.test_expect_error($sql$
 select public.training_review_exam(
 '77777777-7777-4777-8777-777777777777','approve',10,true,
 'Pratica validada pelo consultor indevidamente.')
$sql$,'Apenas gestor');

set role authenticated;
select set_config('app.test_uid','22222222-2222-4222-8222-222222222222',false);
select public.test_expect_error($sql$
 select public.training_review_exam(
 '77777777-7777-4777-8777-777777777777','approve',7,false,
 'Pratica nao aprovada pelo gestor autorizado.')
$sql$,'Aprovacao exige');
select public.training_review_exam(
 '77777777-7777-4777-8777-777777777777','approve',9,true,
 'Pratica observada e aprovada pelo gestor ficticio.');

-- Segundo cenario: erro critico reprova a teoria, permite B apos revisao.
select set_config('app.test_uid','11111111-1111-4111-8111-111111111111',false);
insert into public.submissions(id,user_id,lesson_id,submission_type,text_content,status)
values(
 '88888888-8888-4888-8888-888888888888',
 '11111111-1111-4111-8111-111111111111',
 '66666666-6666-4666-8666-666666666666','lesson_exam_a',
 jsonb_build_object('version',1,'stage','a','requires_manager_validation',true,
  'answers',jsonb_build_array(1,0,0,0,0,0,0,0,0,0),
  'evidence',repeat('Pratica ficticia com resposta, responsavel e prazo. ',3))::text,'pending'
);

select set_config('app.test_uid','22222222-2222-4222-8222-222222222222',false);
select public.test_expect_error($sql$
 select public.training_review_exam(
 '88888888-8888-4888-8888-888888888888','approve',10,true,
 'Tentativa indevida de aprovar prova com erro critico.')
$sql$,'Aprovacao exige');
select public.training_review_exam(
 '88888888-8888-4888-8888-888888888888','needs_revision',6,false,
 'Erro critico detectado, precisa estudar antes do reteste.');

select set_config('app.test_uid','11111111-1111-4111-8111-111111111111',false);
insert into public.submissions(id,user_id,lesson_id,submission_type,text_content,status)
values(
 '99999999-9999-4999-8999-999999999999',
 '11111111-1111-4111-8111-111111111111',
 '66666666-6666-4666-8666-666666666666','lesson_exam_b',
 jsonb_build_object('version',1,'stage','b','requires_manager_validation',true,
  'answers',jsonb_build_array(0,0,0,0,0,0,0,0,0,0),
  'review',repeat('Revisei o erro critico e a conduta correta. ',3))::text,'pending'
);
select set_config('app.test_uid','22222222-2222-4222-8222-222222222222',false);
select public.training_review_exam(
 '99999999-9999-4999-8999-999999999999','approve',9,true,
 'Reteste teorico e pratica ficticia validados pelo gestor.');

-- Aprovacao concluida nao pode ser reescrita pelo consultor.
select set_config('app.test_uid','11111111-1111-4111-8111-111111111111',false);
select public.test_expect_error($sql$
 update public.lesson_progress set completed_at=now()+interval '1 day'
 where lesson_id='44444444-4444-4444-8444-444444444444'
$sql$,'imutavel');

reset role;
do $fn$
declare n integer;
begin
 select count(*) into n from public.lesson_progress where status='completed';
 if n<>3 then raise exception 'Conclusoes esperadas 3, obtidas %',n; end if;
 select count(*) into n from training_private.exam_decisions;
 if n<>3 then raise exception 'Auditorias gerenciais esperadas 3, obtidas %',n; end if;
 select count(*) into n from public.submissions where status='approved';
 if n<>2 then raise exception 'Provas aprovadas esperadas 2, obtidas %',n; end if;
 if not exists(select 1 from public.lesson_progress where
  lesson_id='33333333-3333-4333-8333-333333333333' and status='completed')
 then raise exception 'Conclusao historica perdida'; end if;
end
$fn$;
select 'GATE SQL ISOLADO APROVADO' as result;
