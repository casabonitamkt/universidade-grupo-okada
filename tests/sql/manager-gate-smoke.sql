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

-- Regressao: alguns dias reais declaram pass_score, sem minimum_score.
-- O banco deve respeitar o criterio MAIS RIGOROSO; 8/10 nao aprova minimo 9.
do $strict$
declare v_bank jsonb; v_min integer; v_grade jsonb;
begin
 select b.questions_a,b.minimum_score into v_bank,v_min
 from training_private.exam_banks b
 join public.lessons l on l.id=b.lesson_id where l.code='EXAM-PASS-SCORE';
 if v_min is distinct from 9 then
   raise exception 'pass_score=9 ignorado na migracao: %',v_min;
 end if;
 v_grade:=training_private.grade_exam(v_bank,'[0,0,0,0,0,0,0,0,1,1]'::jsonb,v_min);
 if (v_grade->>'score')::integer is distinct from 8
   or (v_grade->>'critical')::integer is distinct from 0
   or (v_grade->>'passed')::boolean is distinct from false then
   raise exception '8/10 foi aceito contra criterio 9/10: %',v_grade;
 end if;
end
$strict$;

-- As aulas novas so ficam visiveis DEPOIS da migracao dos gabaritos.
update public.lessons set is_published=true
where code in ('EXAM-APROVA','EXAM-RETESTE','F1-D30-A01','EXAM-PASS-SCORE');

-- REGRESSAO: a migracao nao pode deixar futuras publicacoes vazarem
-- gabaritos por INSERT ou UPDATE de lessons.content, nem via postgres.
select public.test_expect_error($sql$
 update public.lessons
 set content=jsonb_set(content,'{questions_b}','[]'::jsonb)
 where code='EXAM-APROVA'
$sql$,'Gabarito de prova nao pode ser armazenado');
select public.test_expect_error($sql$
 insert into public.lessons(id,module_id,code,content,is_published)
 values('dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        '55555555-5555-4555-8555-555555555555',
        'EXAM-CHAVE-EXPOSTA','{"questions_a":[]}'::jsonb,false)
$sql$,'Gabarito de prova nao pode ser armazenado');
-- Atualizacao de conteudo editorial sem gabarito permanece permitida.
update public.lessons
set content=jsonb_set(content,'{editorial_guard_test}','true'::jsonb)
where code='EXAM-APROVA';

set role authenticated;
select set_config('app.test_uid','11111111-1111-4111-8111-111111111111',false);

-- RLS profiles_self_update nao pode permitir autoconceder role=admin.
select public.test_expect_error($sql$
 update public.profiles set role='admin'
 where id='11111111-1111-4111-8111-111111111111'
$sql$,'Somente gestor pode alterar papel');
-- Uma prova publicada antes da migracao nao pode ser aplicada com gabarito vazado.
select public.test_expect_error($sql$
 select public.training_exam_questions(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a')
$sql$,'Prova anteriormente exposta');
-- NULL nao pode contornar o gate do reteste B via CASE ... ELSE.
select public.test_expect_error($sql$
 select public.training_exam_questions(
 '66666666-6666-4666-8666-666666666666',NULL::text)
$sql$,'Acesso nao autorizado');
-- B so abre apos reprovacao teorica e revisao do gestor.
select public.test_expect_error($sql$
 select public.training_exam_questions(
 '66666666-6666-4666-8666-666666666666','b')
$sql$,'Reteste nao autorizado');
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

-- Regra historica: 56 aulas reais usam minimum_score/retest_rule sem
-- bancos A/B. Esses metadados legados NAO ativam o gate transacional.
do $legacy$
declare v_content jsonb;
begin
  select content into v_content from public.lessons where code='HISTORICA';
  -- Rodando como authenticated: o schema privado deve continuar inacessivel.
  -- Ausencia de banco decorre da fixture sem questions_a/questions_b.
  if not (v_content ? 'minimum_score' and v_content ? 'retest_rule')
     or v_content ? 'exam_required' then
    raise exception 'Fixture historica nao reproduz aula real sem A/B';
  end if;
end
$legacy$;
-- Atualizar progresso historico concluido continua permitido.
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
-- NULL nunca pode ser interpretado implicitamente como needs_revision.
select public.test_expect_error($sql$
 select public.training_review_exam(
 '77777777-7777-4777-8777-777777777777',NULL::text,9,true,
 'Decisao nula nao pode gerar revisao gerencial.')
$sql$,'Decisao, nota pratica');
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

-- Marco 30: servidor exige duas simulacoes distintas, ambas >=8 e sem erro critico.
set role authenticated;
select set_config('app.test_uid','11111111-1111-4111-8111-111111111111',false);
insert into public.submissions(id,user_id,lesson_id,submission_type,text_content,status)
values(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 '11111111-1111-4111-8111-111111111111',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','lesson_exam_a',
 jsonb_build_object('version',1,'stage','a','requires_manager_validation',true,
  'answers',jsonb_build_array(0,0,0,0,0,0,0,0,0,0),
  'evidence',repeat('Simulacao de marco com projeto e peca e registro. ',3))::text,'pending'
);
select set_config('app.test_uid','22222222-2222-4222-8222-222222222222',false);
select public.test_expect_error($sql$
 select public.training_review_exam(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc','approve',9,true,
  'Aprovacao sem os dois casos nao e valida.')
$sql$,'Marco 30 exige');
select public.test_expect_error($sql$
 select public.training_review_exam(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc','approve',8,true,
  'Erro critico em simulacao impede conclusao.',
  '[{"case":"project","score":9,"critical_error":true,"evidence":"Evidencia detalhada do projeto com observacoes de escuta e circulacao e arquiteto."},{"case":"piece","score":8,"critical_error":false,"evidence":"Evidencia detalhada da peca com medidas de ambiente, uso e prazo confirmados."}]'::jsonb)
$sql$,'Simulacao sem nota valida');
select public.training_review_exam(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','approve',8,true,
 'Duas simulacoes observadas e validadas, sem erros criticos.',
 '[{"case":"project","score":9,"critical_error":false,"evidence":"Evidencia detalhada do projeto: medidas e arquiteto confirmados, uso e prazo alinhados, proximo passo agendado."},{"case":"piece","score":8,"critical_error":false,"evidence":"Evidencia detalhada da peca: foto e circulacao conferidas, investimento discutido e retorno com data definida."}]'::jsonb
);

reset role;

-- Integridade: uma prova A/B enviada congela banco e criterio de correcao.
select public.test_expect_error($sql$
 update training_private.exam_banks
 set questions_a=jsonb_set(questions_a,'{0,0}','"Questao alterada"'::jsonb)
 where lesson_id='44444444-4444-4444-8444-444444444444'
$sql$,'Banco de prova imutavel apos primeiro envio');
select public.test_expect_error($sql$
 update training_private.exam_banks
 set minimum_score=10
 where lesson_id='44444444-4444-4444-8444-444444444444'
$sql$,'Banco de prova imutavel apos primeiro envio');
select public.test_expect_error($sql$
 delete from training_private.exam_banks
 where lesson_id='44444444-4444-4444-8444-444444444444'
$sql$,'Banco de prova imutavel apos primeiro envio');

-- Quarentena: nao basta limpar a flag, mesmo trocando A e B diretamente.
select public.test_expect_error($sql$
 update training_private.exam_banks set keys_previously_public=false
 where lesson_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
$sql$,'Prova exposta exige troca integral');
select public.test_expect_error($sql$
 update training_private.exam_banks
 set keys_previously_public=false,
 questions_a=jsonb_set(questions_a,'{0,0}','"Nova A"'::jsonb),
 questions_b=jsonb_set(questions_b,'{0,0}','"Nova B"'::jsonb)
 where lesson_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
$sql$,'Desbloqueio de prova exposta exige migracao auditada');

-- Antes do primeiro envio, uma edicao controlada de banco valido permanece possivel.
update training_private.exam_banks
 set questions_a=jsonb_set(questions_a,'{0,0}','"Pergunta revisada A"'::jsonb),
     questions_b=jsonb_set(questions_b,'{0,0}','"Pergunta revisada B"'::jsonb)
 where lesson_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
do $bank_check$
begin
 if not exists(
   select 1 from training_private.exam_banks
   where lesson_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
   and questions_a->0->>0='Pergunta revisada A'
   and questions_b->0->>0='Pergunta revisada B'
 ) then raise exception 'Rotacao pre-envio nao foi persistida'; end if;
end
$bank_check$;

do $fn$
declare n integer;
begin
 select count(*) into n from public.lesson_progress where status='completed';
 if n<>4 then raise exception 'Conclusoes esperadas 4, obtidas %',n; end if;
 select count(*) into n from training_private.exam_decisions;
 if n<>4 then raise exception 'Auditorias gerenciais esperadas 4, obtidas %',n; end if;
 select count(*) into n from public.submissions where status='approved';
 if n<>3 then raise exception 'Provas aprovadas esperadas 3, obtidas %',n; end if;
 if not exists(select 1 from training_private.exam_decisions
   where lesson_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     and jsonb_array_length(practice_cases)=2)
 then raise exception 'Evidencias das duas simulacoes do Marco 30 nao preservadas'; end if;
 if not exists(select 1 from public.lesson_progress where
  lesson_id='33333333-3333-4333-8333-333333333333' and status='completed')
 then raise exception 'Conclusao historica perdida'; end if;
end
$fn$;
select 'GATE SQL ISOLADO APROVADO' as result;
