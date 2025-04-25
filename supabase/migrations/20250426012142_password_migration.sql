-- Migración para convertir las contraseñas en texto plano a hashes bcrypt
-- Creado: 26-04-2025

-- Función que permite hashear contraseñas en el lado del servidor
-- Nota: Esta función debe ser eliminada después de la migración de contraseñas
CREATE OR REPLACE FUNCTION hash_password(plain_password TEXT)
RETURNS TEXT AS $$
    SELECT crypt(plain_password, gen_salt('bf', 10));
$$ LANGUAGE SQL SECURITY DEFINER;

-- Asegurarse de que la extensión pgcrypto esté habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear una vista temporal para identificar contraseñas que necesitan ser hasheadas
-- (Las que no comienzan con el prefijo de bcrypt '$2')
CREATE OR REPLACE VIEW usuarios_por_hashear AS 
SELECT id, password 
FROM usuarios 
WHERE password IS NOT NULL 
  AND (password NOT LIKE '$2%' OR password = '')
  AND estado = true;

-- Comentado: Código para actualizar automáticamente todas las contraseñas existentes
-- ADVERTENCIA: En producción, es recomendable un enfoque más gradual
-- 
-- DO $$ 
-- DECLARE
--     usuario_record RECORD;
-- BEGIN
--     FOR usuario_record IN SELECT * FROM usuarios_por_hashear LOOP
--         IF usuario_record.password != '' THEN
--             UPDATE usuarios 
--             SET password = hash_password(usuario_record.password),
--                 password_last_changed = NOW()
--             WHERE id = usuario_record.id;
--         END IF;
--     END LOOP;
-- END $$;

-- Crear una función que se puede ejecutar manualmente para hashear todas las contraseñas pendientes
CREATE OR REPLACE FUNCTION migrate_plain_passwords()
RETURNS INTEGER AS $$
DECLARE
    usuario_record RECORD;
    contador INTEGER := 0;
BEGIN
    FOR usuario_record IN SELECT * FROM usuarios_por_hashear LOOP
        IF usuario_record.password != '' THEN
            UPDATE usuarios 
            SET password = hash_password(usuario_record.password),
                password_last_changed = NOW()
            WHERE id = usuario_record.id;
            contador := contador + 1;
        END IF;
    END LOOP;
    
    RETURN contador; -- Retorna el número de contraseñas actualizadas
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Desencadenador para hashear contraseñas automáticamente al insertarlas o actualizarlas
CREATE OR REPLACE FUNCTION hash_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo hashear si la contraseña es texto plano (no comienza con $2)
    IF NEW.password IS NOT NULL AND NEW.password != '' AND NEW.password NOT LIKE '$2%' THEN
        NEW.password := hash_password(NEW.password);
        NEW.password_last_changed := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger para hashear contraseñas automáticamente
CREATE TRIGGER hash_passwords_before_save
BEFORE INSERT OR UPDATE OF password ON usuarios
FOR EACH ROW
EXECUTE FUNCTION hash_password_trigger();

-- Crear una función para verificar contraseñas (útil para procedimientos almacenados)
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
$$ LANGUAGE plpgsql SECURITY DEFINER; 