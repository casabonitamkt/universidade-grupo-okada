BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.crm_pilot_leads
  ADD COLUMN is_builder boolean NOT NULL DEFAULT false;
GRANT UPDATE (is_builder) ON public.crm_pilot_leads TO authenticated;

CREATE FUNCTION public.crm_thiago_builder_prospecting()
RETURNS TABLE (lead_id uuid, display_name text, last_contact_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $$
  WITH week AS (
    SELECT date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo') AS start_local
  )
  SELECT l.id, l.display_name::text, max(m.event_at)
  FROM public.crm_pilot_leads l
  JOIN public.crm_pilot_messages m ON m.lead_id = l.id AND m.direction = 'saida'
  CROSS JOIN week
  WHERE l.owner_consultant_id = 'c6e732c0-30d8-4d70-85b1-573a853f71e8'
    AND l.source = 'zapi' AND l.is_builder AND m.source = 'zapi'
    AND m.event_at >= (week.start_local AT TIME ZONE 'America/Sao_Paulo')
    AND m.event_at < ((week.start_local + interval '1 week') AT TIME ZONE 'America/Sao_Paulo')
    AND m.event_at <= now()
  GROUP BY l.id, l.display_name
  ORDER BY max(m.event_at) DESC, l.id;
$$;
REVOKE ALL ON FUNCTION public.crm_thiago_builder_prospecting() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_thiago_builder_prospecting() TO authenticated, service_role;

COMMIT;
