\set ON_ERROR_STOP on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE TABLE public.crm_pilot_leads (
  id integer PRIMARY KEY,
  stage text NOT NULL,
  next_contact_on date,
  next_contact_action text
);
CREATE TABLE public.crm_pilot_messages (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id integer NOT NULL REFERENCES public.crm_pilot_leads(id),
  source text NOT NULL,
  direction text NOT NULL,
  kind text NOT NULL,
  body text,
  event_at timestamptz NOT NULL
);
\ir ../migrations/2026-11-26-crm-retorno-confirmado.sql

BEGIN;
SET LOCAL TIME ZONE 'America/Sao_Paulo';
INSERT INTO public.crm_pilot_leads (id, stage) VALUES
  (1,'proposta'), (2,'proposta'), (3,'ganho'), (4,'proposta'),
  (5,'proposta'), (6,'proposta'), (7,'proposta'), (8,'proposta');
UPDATE public.crm_pilot_leads
SET next_contact_on=current_date+1,next_contact_action='Retorno manual'
WHERE id=4;
INSERT INTO public.crm_pilot_messages (lead_id,source,direction,kind,body,event_at)
SELECT id,'zapi','saida','text',
  CASE id
    WHEN 5 THEN 'Posso te ligar dia 31/02/2026?'
    WHEN 8 THEN 'Posso te ligar amanhã?'
    ELSE 'Posso te ligar dia '||to_char(current_date+2,'DD/MM/YYYY')||'?'
  END, now()-interval '1 hour'
FROM public.crm_pilot_leads;
INSERT INTO public.crm_pilot_messages (lead_id,source,direction,kind,body,event_at)
VALUES (7,'zapi','saida','text','Você recebeu a proposta?',now()-interval '10 minutes');
INSERT INTO public.crm_pilot_messages (lead_id,source,direction,kind,body,event_at)
SELECT id,CASE WHEN id=6 THEN 'other' ELSE 'zapi' END,'entrada','text',
  CASE WHEN id=2 THEN 'Talvez' ELSE 'Sim, pode!' END,now()
FROM public.crm_pilot_leads;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.crm_pilot_leads WHERE id=1 AND next_contact_on=current_date+2
      AND next_contact_action='Ligar para o cliente (confirmado na conversa)'
  ) THEN
    RAISE EXCEPTION 'Retorno confirmado não foi registrado';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.crm_pilot_leads WHERE id=4 AND next_contact_on=current_date+1
      AND next_contact_action='Retorno manual'
  ) THEN
    RAISE EXCEPTION 'O retorno manual foi alterado';
  END IF;
  IF EXISTS (SELECT 1 FROM public.crm_pilot_leads WHERE id NOT IN (1,4) AND next_contact_on IS NOT NULL) THEN
    RAISE EXCEPTION 'Um evento inelegível agendou retorno';
  END IF;
END;
$$;
ROLLBACK;
