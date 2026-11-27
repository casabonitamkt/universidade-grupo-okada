BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE public.crm_copilot_tip_feedback (
  lead_id uuid NOT NULL REFERENCES public.crm_pilot_leads(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.crm_pilot_messages(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_kind text NOT NULL CHECK (tip_kind IN ('medidas','preco','distancia')),
  decision text NOT NULL CHECK (decision IN ('seguida','nao_aplicavel')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, message_id, consultant_id, tip_kind)
);

ALTER TABLE public.crm_copilot_tip_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_copilot_tip_feedback FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.crm_copilot_tip_feedback TO authenticated, service_role;
GRANT INSERT (lead_id, message_id, tip_kind, decision) ON public.crm_copilot_tip_feedback TO authenticated;

CREATE POLICY crm_tip_feedback_read_own ON public.crm_copilot_tip_feedback
FOR SELECT TO authenticated USING (
  consultant_id = (select auth.uid())
  AND EXISTS (SELECT 1 FROM public.crm_pilot_leads l WHERE l.id = crm_copilot_tip_feedback.lead_id AND l.owner_consultant_id = (select auth.uid()))
);

CREATE POLICY crm_tip_feedback_insert_own ON public.crm_copilot_tip_feedback
FOR INSERT TO authenticated WITH CHECK (
  consultant_id = (select auth.uid())
  AND EXISTS (SELECT 1 FROM public.crm_pilot_leads l WHERE l.id = crm_copilot_tip_feedback.lead_id AND l.owner_consultant_id = (select auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.crm_pilot_messages m
    WHERE m.id = crm_copilot_tip_feedback.message_id AND m.lead_id = crm_copilot_tip_feedback.lead_id AND m.direction = 'entrada'
  )
);

COMMIT;
