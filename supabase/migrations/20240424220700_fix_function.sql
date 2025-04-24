-- Migración para corregir la función actualizar_saldo_viaje
-- Actualizado: abril de 2024 - Incluye SECURITY DEFINER y search_path fijo

-- Recrear la función con los parámetros de seguridad adecuados
CREATE OR REPLACE FUNCTION actualizar_saldo_viaje()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure saldo is calculated correctly
  NEW.saldo := NEW.tarifa - NEW.adelanto;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Asegurar que el trigger esté correctamente configurado
DROP TRIGGER IF EXISTS trigger_actualizar_saldo_viaje ON viajes;
CREATE TRIGGER trigger_actualizar_saldo_viaje
BEFORE INSERT OR UPDATE ON viajes
FOR EACH ROW
EXECUTE FUNCTION actualizar_saldo_viaje(); 