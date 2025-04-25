-- Migración para corregir el error de la columna password
-- Fecha: 29/04/2025
-- Descripción: Este script corrige el error donde la columna 'password' se referencia
-- en lugar de 'password_hash' que es la columna real en la tabla usuarios

-- Primero eliminar la vista problemática si existe
DROP VIEW IF EXISTS usuarios_por_hashear;

-- Recrear la vista utilizando el nombre correcto de la columna (password_hash en lugar de password)
CREATE OR REPLACE VIEW usuarios_por_hashear AS 
SELECT id, password_hash as password 
FROM usuarios 
WHERE password_hash IS NOT NULL 
  AND (password_hash NOT LIKE '$2%' OR password_hash = '')
  AND estado = true;

-- Actualizar función de migración de contraseñas para usar el nombre correcto de columna
CREATE OR REPLACE FUNCTION migrate_plain_passwords()
RETURNS INTEGER AS $$
DECLARE
    usuario_record RECORD;
    contador INTEGER := 0;
BEGIN
    FOR usuario_record IN SELECT * FROM usuarios_por_hashear LOOP
        IF usuario_record.password != '' THEN
            UPDATE usuarios 
            SET password_hash = hash_password(usuario_record.password),
                ultimo_cambio_password = NOW()
            WHERE id = usuario_record.id;
            contador := contador + 1;
        END IF;
    END LOOP;
    
    RETURN contador; -- Retorna el número de contraseñas actualizadas
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar el trigger para usar el nombre correcto de columna
CREATE OR REPLACE FUNCTION hash_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo hashear si la contraseña es texto plano (no comienza con $2)
    IF NEW.password_hash IS NOT NULL AND NEW.password_hash != '' AND NEW.password_hash NOT LIKE '$2%' THEN
        NEW.password_hash := hash_password(NEW.password_hash);
        NEW.ultimo_cambio_password := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger para usar el campo correcto
DROP TRIGGER IF EXISTS hash_passwords_before_save ON usuarios;
CREATE TRIGGER hash_passwords_before_save
BEFORE INSERT OR UPDATE OF password_hash ON usuarios
FOR EACH ROW
EXECUTE FUNCTION hash_password_trigger(); 