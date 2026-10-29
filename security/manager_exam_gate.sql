-- PROPOSTA DE HOMOLOGACAO. NAO EXECUTAR NA PRODUCAO SEM TESTES AUTENTICADOS.
-- Banco real inspecionado em 29/10/2026: 57 aulas publicadas, 9 ocultas,
-- 42 evidencias mission pendentes; preserva os registros historicos.
-- Instalar somente apos backup, QA e aprovacao explicita de rollout.
BEGIN;

-- Uma prova A e um reteste B por aluno/aula. Impede corrida entre requisições.
CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_exam_stage_per_lesson
 ON public.submissions(user_id,lesson_id,submission_type)
 WHERE submission_type IN ('lesson_exam_a','lesson_exam_b');

-- O trigger roda como INVOKER; o RPC administrativo abaixo roda como postgres.
-- Bloqueia adulteracao direta de prova por qualquer usuario da API.
CREATE OR REPLACE FUNCTION public.guard_lesson_exam_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $fn$
DECLARE payload jsonb;
BEGIN
 IF TG_OP = 'DELETE' THEN
   IF OLD.submission_type IN ('lesson_exam_a','lesson_exam_b') AND current_user <> 'postgres'
   THEN RAISE EXCEPTION 'Prova nao pode ser excluida diretamente' USING ERRCODE='42501'; END IF;
   RETURN OLD;
 END IF;
 IF TG_OP = 'UPDATE' AND
    (OLD.submission_type IN ('lesson_exam_a','lesson_exam_b') OR NEW.submission_type IN ('lesson_exam_a','lesson_exam_b'))
    AND current_user <> 'postgres'
 THEN RAISE EXCEPTION 'Prova so pode ser revisada pelo fluxo gerencial' USING ERRCODE='42501'; END IF;
 IF TG_OP = 'INSERT' AND NEW.submission_type IN ('lesson_exam_a','lesson_exam_b') THEN
   IF current_user <> 'authenticated' OR (SELECT auth.uid()) IS DISTINCT FROM NEW.user_id
      OR NEW.status <> 'pending' OR NEW.reviewer_id IS NOT NULL
      OR NEW.reviewed_at IS NOT NULL OR NEW.reviewer_feedback IS NOT NULL
      OR NEW.file_url IS NOT NULL
   THEN RAISE EXCEPTION 'Envio de prova exige consultor autenticado e status pendente' USING ERRCODE='42501'; END IF;
   BEGIN payload := NEW.text_content::jsonb;
   EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'JSON de prova invalido'; END;
   IF payload->>'stage' IS DISTINCT FROM right(NEW.submission_type,1)
      OR payload->'version' IS DISTINCT FROM '1'::jsonb
      OR payload->'requires_manager_validation' IS DISTINCT FROM 'true'::jsonb
      OR jsonb_typeof(payload->'answers') IS DISTINCT FROM 'array'
      OR jsonb_array_length(payload->'answers') <> 10
      OR NOT EXISTS (
        SELECT 1 FROM public.lessons l JOIN public.modules m ON m.id=l.module_id
        WHERE l.id=NEW.lesson_id AND l.is_published AND m.is_published
          AND jsonb_typeof(l.content->'questions_a')='array'
          AND jsonb_typeof(l.content->'questions_b')='array'
      )
   THEN RAISE EXCEPTION 'Prova ou aula nao homologada'; END IF;
   IF NEW.submission_type='lesson_exam_a' AND length(trim(coalesce(payload->>'evidence',''))) < 80
   THEN RAISE EXCEPTION 'Evidencia pratica insuficiente'; END IF;
   IF NEW.submission_type='lesson_exam_b' AND length(trim(coalesce(payload->>'review',''))) < 80
   THEN RAISE EXCEPTION 'Revisao escrita insuficiente'; END IF;
 END IF;
 RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS lesson_exam_submission_guard ON public.submissions;
CREATE TRIGGER lesson_exam_submission_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_lesson_exam_submission();

-- Protege a conclusao mesmo que o consultor ignore o frontend.
-- Nao altera o fluxo de aulas historicas sem prova.
CREATE OR REPLACE FUNCTION public.guard_exam_lesson_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $fn$
BEGIN
 IF current_user <> 'postgres'
    AND (NEW.status='completed' OR NEW.completed_at IS NOT NULL)
    AND EXISTS (
       SELECT 1 FROM public.lessons l WHERE l.id=NEW.lesson_id
         AND (l.content ? 'questions_a' OR l.content ? 'questions_b'
              OR l.content ? 'minimum_score' OR l.content ? 'retest_rule')
    )
 THEN RAISE EXCEPTION 'Conclusao exige aprovacao gerencial no servidor' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS exam_lesson_progress_guard ON public.lesson_progress;
CREATE TRIGGER exam_lesson_progress_guard
BEFORE INSERT OR UPDATE ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.guard_exam_lesson_progress();

-- Correcao independente, deterministica e fail-closed. Nunca aceita nota do browser.
CREATE OR REPLACE FUNCTION public.grade_exam_answers(p_bank jsonb,p_answers jsonb,p_minimum integer)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = ''
AS $fn$
DECLARE i integer; q jsonb; answer integer; correct integer;
        score integer:=0; critical integer:=0;
BEGIN
 IF jsonb_typeof(p_bank) IS DISTINCT FROM 'array' OR jsonb_array_length(p_bank) <> 10
    OR jsonb_typeof(p_answers) IS DISTINCT FROM 'array' OR jsonb_array_length(p_answers) <> 10
    OR p_minimum IS NULL OR p_minimum < 1 OR p_minimum > 10
 THEN RETURN jsonb_build_object('valid',false); END IF;
 FOR i IN 0..9 LOOP
   q:=p_bank->i;
   IF jsonb_typeof(q) IS DISTINCT FROM 'array' OR jsonb_array_length(q)<4
      OR jsonb_typeof(q->1) IS DISTINCT FROM 'array' OR jsonb_array_length(q->1)<2
      OR jsonb_typeof(q->2) IS DISTINCT FROM 'number' OR jsonb_typeof(q->3) IS DISTINCT FROM 'boolean'
      OR jsonb_typeof(p_answers->i) IS DISTINCT FROM 'number'
   THEN RETURN jsonb_build_object('valid',false); END IF;
   BEGIN
     correct:=(q->>2)::integer; answer:=(p_answers->>i)::integer;
   EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('valid',false); END;
   IF correct<0 OR correct>=jsonb_array_length(q->1)
      OR (q->>2)::numeric <> correct
      OR answer<0 OR answer>=jsonb_array_length(q->1)
      OR (p_answers->>i)::numeric <> answer
   THEN RETURN jsonb_build_object('valid',false); END IF;
   IF answer=correct THEN score:=score+1;
   ELSIF (q->>3)::boolean THEN critical:=critical+1; END IF;
 END LOOP;
 RETURN jsonb_build_object('valid',true,'score',score,'critical',critical,
                            'passed',(score>=p_minimum AND critical=0));
END;
$fn$;
REVOKE ALL ON FUNCTION public.grade_exam_answers(jsonb,jsonb,integer) FROM PUBLIC,anon,authenticated;

-- Ponto unico de aprovacao: autentica gestor, revalida A/B e pratica,
-- atualiza a prova e a conclusao na MESMA transacao.
CREATE OR REPLACE FUNCTION public.manager_review_lesson_exam(
 p_submission_id uuid,p_practice_approved boolean,p_feedback text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE s public.submissions%ROWTYPE; l public.lessons%ROWTYPE;
        payload jsonb; bank jsonb; grade jsonb;
        prior public.submissions%ROWTYPE; prior_payload jsonb; prior_grade jsonb;
        decision public.submission_status; manager_id uuid := auth.uid();
BEGIN
 IF manager_id IS NULL OR NOT EXISTS(
    SELECT 1 FROM public.profiles WHERE id=manager_id AND role='admin'
 ) THEN RAISE EXCEPTION 'Somente gestor autorizado' USING ERRCODE='42501'; END IF;
 IF p_practice_approved IS NULL OR length(trim(coalesce(p_feedback,''))) < 20
 THEN RAISE EXCEPTION 'Informe decisao e feedback gerencial (minimo 20 caracteres)'; END IF;
 SELECT * INTO s FROM public.submissions WHERE id=p_submission_id FOR UPDATE;
 IF NOT FOUND OR s.submission_type NOT IN ('lesson_exam_a','lesson_exam_b')
    OR s.status <> 'pending'
 THEN RAISE EXCEPTION 'Prova pendente nao encontrada'; END IF;
 SELECT * INTO l FROM public.lessons WHERE id=s.lesson_id AND is_published;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.modules m WHERE m.id=l.module_id AND m.is_published)
 THEN RAISE EXCEPTION 'Aula ou modulo nao publicado'; END IF;
 BEGIN payload:=s.text_content::jsonb;
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Registro da prova invalido'; END;
 IF payload->'version' IS DISTINCT FROM '1'::jsonb
    OR payload->'requires_manager_validation' IS DISTINCT FROM 'true'::jsonb
    OR payload->>'stage' IS DISTINCT FROM right(s.submission_type,1)
 THEN RAISE EXCEPTION 'Metadados da prova inconsistentes'; END IF;
 IF (SELECT count(*) FROM public.submissions
     WHERE user_id=s.user_id AND lesson_id=s.lesson_id AND submission_type=s.submission_type) <> 1
 THEN RAISE EXCEPTION 'Prova duplicada'; END IF;
 bank:=CASE WHEN s.submission_type='lesson_exam_a' THEN l.content->'questions_a'
            ELSE l.content->'questions_b' END;
 grade:=public.grade_exam_answers(bank,payload->'answers',(l.content->>'minimum_score')::integer);
 IF grade->'valid' IS DISTINCT FROM 'true'::jsonb
 THEN RAISE EXCEPTION 'Banco ou respostas invalidos'; END IF;
 IF s.submission_type='lesson_exam_a' AND length(trim(coalesce(payload->>'evidence','')))<80
 THEN RAISE EXCEPTION 'Pratica escrita insuficiente'; END IF;
 IF s.submission_type='lesson_exam_b' THEN
   IF length(trim(coalesce(payload->>'review','')))<80 THEN RAISE EXCEPTION 'Revisao escrita insuficiente'; END IF;
   SELECT * INTO prior FROM public.submissions
    WHERE user_id=s.user_id AND lesson_id=s.lesson_id AND submission_type='lesson_exam_a';
   IF NOT FOUND THEN RAISE EXCEPTION 'Reteste B sem prova A'; END IF;
   BEGIN prior_payload:=prior.text_content::jsonb;
   EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Prova A invalida'; END;
   IF prior_payload->'version' IS DISTINCT FROM '1'::jsonb
      OR prior_payload->>'stage' IS DISTINCT FROM 'a'
      OR prior_payload->'requires_manager_validation' IS DISTINCT FROM 'true'::jsonb
      OR length(trim(coalesce(prior_payload->>'evidence','')))<80
   THEN RAISE EXCEPTION 'Prova A inconsistente'; END IF;
   prior_grade:=public.grade_exam_answers(l.content->'questions_a',
          prior_payload->'answers',(l.content->>'minimum_score')::integer);
   IF prior_grade->'valid' IS DISTINCT FROM 'true'::jsonb
      OR prior_grade->'passed' IS DISTINCT FROM 'false'::jsonb
   THEN RAISE EXCEPTION 'Reteste B exige reprovacao valida na prova A'; END IF;
 END IF;
 IF grade->'passed'='true'::jsonb AND p_practice_approved THEN
   decision:='approved';
 ELSE
   decision:='needs_revision';
 END IF;
 UPDATE public.submissions SET status=decision,reviewer_id=manager_id,
       reviewer_feedback=p_feedback,reviewed_at=now() WHERE id=s.id;
 IF decision='approved' THEN
   INSERT INTO public.lesson_progress(user_id,lesson_id,status,started_at,completed_at,updated_at)
   VALUES(s.user_id,s.lesson_id,'completed',now(),now(),now())
   ON CONFLICT(user_id,lesson_id) DO UPDATE SET
      status='completed',completed_at=coalesce(public.lesson_progress.completed_at,now()),
      updated_at=now();
 END IF;
 RETURN jsonb_build_object('decision',decision,'score',grade->'score',
          'critical',grade->'critical','passed',grade->'passed',
          'practice_approved',p_practice_approved);
END;
$fn$;
REVOKE ALL ON FUNCTION public.manager_review_lesson_exam(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manager_review_lesson_exam(uuid,boolean,text) TO authenticated;
COMMIT;
