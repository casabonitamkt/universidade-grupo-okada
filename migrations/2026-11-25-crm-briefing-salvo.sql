BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.crm_pilot_leads
  ADD COLUMN review_snapshot jsonb,
  ADD CONSTRAINT crm_pilot_leads_review_snapshot_shape CHECK (
    review_snapshot IS NULL OR (
      jsonb_typeof(review_snapshot) = 'object'
      AND octet_length(review_snapshot::text) <= 16000
      AND review_snapshot ?& ARRAY['savedAt','summary','topics']
      AND jsonb_typeof(review_snapshot->'savedAt') = 'string'
      AND jsonb_typeof(review_snapshot->'summary') = 'string'
      AND jsonb_typeof(review_snapshot->'topics') = 'array'
    )
  );

GRANT UPDATE (review_snapshot) ON public.crm_pilot_leads TO authenticated;

COMMIT;
