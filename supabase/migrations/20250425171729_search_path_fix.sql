-- Migración para corregir problemas de search_path en funciones con SECURITY DEFINER
-- Fecha: 2025-04-25

-- Vamos a corregir solo algunas funciones críticas primero
-- Para comprobar que la solución funciona

-- Función verify_password
CREATE OR REPLACE FUNCTION verify_password(plain_password TEXT, hashed_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Si la contraseña está hasheada con bcrypt
    IF hashed_password LIKE '$2%' THEN
        RETURN plain_password = crypt(plain_password, hashed_password);
    ELSE
        -- Verificación simple para contraseñas en texto plano (temporal)
        RETURN plain_password = hashed_password;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función clean_old_login_attempts
CREATE OR REPLACE FUNCTION clean_old_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM login_attempts
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
