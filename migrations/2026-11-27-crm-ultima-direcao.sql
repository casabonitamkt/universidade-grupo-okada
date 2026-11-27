BEGIN;

CREATE FUNCTION public.crm_last_message_direction(lead public.crm_pilot_leads)
RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT m.direction::text
  FROM public.crm_pilot_messages m
  WHERE m.lead_id = lead.id AND m.source = 'zapi'
  ORDER BY m.event_at DESC, m.id DESC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_last_message_direction(public.crm_pilot_leads) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_last_message_direction(public.crm_pilot_leads) TO authenticated;

COMMIT;
