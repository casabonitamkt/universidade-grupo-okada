BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.crm_pilot_leads
  DROP CONSTRAINT crm_pilot_leads_stage_check,
  DROP CONSTRAINT crm_pilot_leads_stage_allowed,
  ADD CONSTRAINT crm_pilot_leads_stage_allowed CHECK (
    stage IN ('novo', 'em_atendimento', 'levantamento', 'orcamento_a_elaborar',
              'proposta', 'followup', 'negociacao', 'ganho', 'perdido')
  );

COMMIT;
