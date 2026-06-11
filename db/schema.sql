BEGIN;

CREATE TABLE IF NOT EXISTS public.shared_diagrams (
  id text PRIMARY KEY,
  code text NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shared_diagrams_code_idx
  ON public.shared_diagrams (code);

CREATE INDEX IF NOT EXISTS shared_diagrams_created_at_idx
  ON public.shared_diagrams (created_at DESC);

CREATE TABLE IF NOT EXISTS public.waitlist (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waitlist_created_at_idx
  ON public.waitlist (created_at DESC);

COMMIT;
