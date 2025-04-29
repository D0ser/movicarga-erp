-- Primero, necesitamos ver la definición actual de la función
-- para poder recrearla con la configuración de search_path
SELECT pg_get_functiondef('public.trigger_set_timestamp'::regproc);

-- Basándonos en la suposición de que es una función estándar de timestamp
-- Recreamos la función con un search_path explícito
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public; 