CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  nombre_normalizado TEXT NOT NULL,
  negocio TEXT,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  departamento TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dispositivo_hash, nombre_normalizado)
);
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.actualizar_fecha_modificacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clientes_actualizar_fecha
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_fecha_modificacion();