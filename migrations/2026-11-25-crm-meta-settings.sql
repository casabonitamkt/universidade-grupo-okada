BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE public.crm_meta_settings (
  id smallint PRIMARY KEY CHECK (id = 1),
  dataset_id text NOT NULL CHECK (dataset_id ~ '^[0-9]{5,30}$')
);
ALTER TABLE public.crm_meta_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_meta_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.crm_meta_settings TO service_role;
COMMIT;
