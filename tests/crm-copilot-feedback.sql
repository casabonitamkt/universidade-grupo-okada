\set ON_ERROR_STOP on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT current_setting('request.jwt.claim.sub', true)::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE TABLE public.crm_pilot_leads (id uuid PRIMARY KEY, owner_consultant_id uuid REFERENCES auth.users);
CREATE TABLE public.crm_pilot_messages (id uuid PRIMARY KEY, lead_id uuid REFERENCES public.crm_pilot_leads, direction text);
GRANT SELECT ON public.crm_pilot_leads, public.crm_pilot_messages TO authenticated;
\ir ../migrations/2026-11-27-crm-feedback-copiloto.sql

BEGIN;
INSERT INTO auth.users VALUES
 ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
INSERT INTO public.crm_pilot_leads VALUES
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002');
INSERT INTO public.crm_pilot_messages VALUES
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','entrada'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','entrada'),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','saida');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
INSERT INTO public.crm_copilot_tip_feedback (lead_id,message_id,tip_kind,decision)
VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','medidas','seguida');

DO $$
DECLARE
  entry record;
BEGIN
  IF (SELECT count(*) FROM public.crm_copilot_tip_feedback) <> 1 THEN
    RAISE EXCEPTION 'O consultor precisa ver a própria decisão';
  END IF;
  FOR entry IN SELECT lead, msg FROM (VALUES
    ('10000000-0000-0000-0000-000000000002'::uuid,'20000000-0000-0000-0000-000000000002'::uuid),
    ('10000000-0000-0000-0000-000000000001'::uuid,'20000000-0000-0000-0000-000000000002'::uuid),
    ('10000000-0000-0000-0000-000000000001'::uuid,'20000000-0000-0000-0000-000000000003'::uuid)
  ) AS invalid(lead,msg)
  LOOP
    BEGIN
      INSERT INTO public.crm_copilot_tip_feedback (lead_id,message_id,tip_kind,decision)
      VALUES (entry.lead,entry.msg,'medidas','seguida');
      RAISE EXCEPTION 'Uma decisão fora da própria conversa de entrada foi aceita';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
  END LOOP;
  BEGIN
    INSERT INTO public.crm_copilot_tip_feedback (lead_id,message_id,tip_kind,decision)
    VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','medidas','nao_aplicavel');
    RAISE EXCEPTION 'Feedback duplicado foi aceito';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END;
$$;

SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.crm_copilot_tip_feedback) THEN
    RAISE EXCEPTION 'O consultor viu feedback de outra carteira';
  END IF;
END;
$$;
ROLLBACK;
