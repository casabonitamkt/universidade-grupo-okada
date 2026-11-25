BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.crm_pilot_leads
  ADD COLUMN next_contact_on date,
  ADD COLUMN next_contact_action text,
  ADD CONSTRAINT crm_pilot_leads_next_contact_pair CHECK (
    (next_contact_on IS NULL AND next_contact_action IS NULL)
    OR (next_contact_on IS NOT NULL AND next_contact_action IS NOT NULL
        AND char_length(trim(next_contact_action)) BETWEEN 1 AND 300)
  );

GRANT UPDATE (next_contact_on, next_contact_action) ON public.crm_pilot_leads TO authenticated;

COMMIT;
