BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.crm_pilot_leads
  ADD COLUMN auto_return_confirmation_at timestamptz;

CREATE FUNCTION public.crm_schedule_confirmed_return()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  proposal record;
  parts text[];
  appointment date;
  confirmed_day date;
  action_label text;
BEGIN
  IF NEW.body IS NULL OR lower(trim(NEW.body)) !~
    '^(sim,? pode|pode sim|combinado|fechado|sim,? combinado)[.!]?$' THEN
    RETURN NEW;
  END IF;

  SELECT m.direction, m.kind, m.body, m.event_at
    INTO proposal
    FROM public.crm_pilot_messages m
    WHERE m.lead_id = NEW.lead_id AND m.id <> NEW.id
    ORDER BY m.event_at DESC, m.id DESC
    LIMIT 1;

  IF NOT FOUND OR proposal.direction <> 'saida' OR proposal.kind <> 'text'
    OR proposal.event_at >= NEW.event_at OR proposal.event_at < NEW.event_at - interval '2 days' THEN
    RETURN NEW;
  END IF;

  parts := regexp_match(lower(trim(proposal.body)),
    '^posso (te ligar|te chamar no whatsapp|te enviar o orçamento|te enviar a proposta) (no )?dia ([0-9]{2})/([0-9]{2})/([0-9]{4})\?$');
  IF parts IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    appointment := make_date(parts[5]::int, parts[4]::int, parts[3]::int);
  EXCEPTION WHEN datetime_field_overflow THEN
    RETURN NEW;
  END;

  confirmed_day := (NEW.event_at AT TIME ZONE 'America/Sao_Paulo')::date;
  IF appointment < greatest(confirmed_day, (now() AT TIME ZONE 'America/Sao_Paulo')::date)
    OR appointment > confirmed_day + 90 THEN
    RETURN NEW;
  END IF;

  action_label := CASE parts[1]
    WHEN 'te ligar' THEN 'Ligar para o cliente'
    WHEN 'te chamar no whatsapp' THEN 'Retomar pelo WhatsApp'
    WHEN 'te enviar o orçamento' THEN 'Enviar o orçamento'
    WHEN 'te enviar a proposta' THEN 'Enviar a proposta'
  END;

  UPDATE public.crm_pilot_leads
     SET next_contact_on = appointment,
         next_contact_action = action_label || ' (confirmado na conversa)',
         auto_return_confirmation_at = NEW.event_at
   WHERE id = NEW.lead_id
     AND stage NOT IN ('ganho', 'perdido')
     AND next_contact_on IS NULL
     AND (auto_return_confirmation_at IS NULL OR auto_return_confirmation_at < NEW.event_at);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_schedule_confirmed_return() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_schedule_confirmed_return() TO service_role;

CREATE TRIGGER crm_schedule_confirmed_return
AFTER INSERT ON public.crm_pilot_messages
FOR EACH ROW
WHEN (NEW.source = 'zapi' AND NEW.direction = 'entrada' AND NEW.kind = 'text')
EXECUTE FUNCTION public.crm_schedule_confirmed_return();

COMMIT;
