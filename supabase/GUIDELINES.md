# Lineamientos para Migraciones de Base de Datos

## Reglas Importantes

1. **NUNCA uses `CREATE POLICY IF NOT EXISTS`** - Esta sintaxis no es compatible con PostgreSQL. Para políticas, primero usa `DROP POLICY IF EXISTS` y luego `CREATE POLICY`.

2. **Usa `IF NOT EXISTS` para tablas e índices** - Esta sintaxis funciona correctamente con `CREATE TABLE` y `CREATE INDEX`.

3. **Archivo por cambio** - Crea un nuevo archivo de migración para cada cambio en la estructura de la base de datos.

4. **Nombres de archivos** - Usa el formato `[timestamp]_[descripción].sql` (ej. `20240425000000_add_new_field.sql`).

5. **Haz migraciones idempotentes** - Las migraciones deben poder ejecutarse varias veces sin errores.

## Pasos para Crear una Nueva Migración

1. Genera un nuevo archivo de migración:

```bash
npx supabase migration new mi_nueva_migracion
```

2. Edita el archivo generado en `supabase/migrations/[timestamp]_mi_nueva_migracion.sql`

3. Para cambios en esquema:

```sql
-- Para crear una tabla
CREATE TABLE IF NOT EXISTS nueva_tabla (...);

-- Para añadir una columna (verificar si existe primero)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'mi_tabla' AND column_name = 'nueva_columna'
  ) THEN
    ALTER TABLE mi_tabla ADD COLUMN nueva_columna TEXT;
  END IF;
END
$$;
```

4. Para políticas:

```sql
-- Primero eliminar si existe
DROP POLICY IF EXISTS "Nombre de mi política" ON mi_tabla;
-- Luego crear
CREATE POLICY "Nombre de mi política" ON mi_tabla ...;
```

5. Prueba localmente:

```bash
npx supabase db reset
```

6. Haz commit de tus cambios y push - ¡El workflow aplicará automáticamente las migraciones!

## Consejos Adicionales

- Incluye comentarios descriptivos en tus migraciones
- Evita hacer `DROP TABLE` en entornos de producción
- Considera el impacto de cada cambio en los datos existentes
- Mantén las migraciones pequeñas y enfocadas
- Valida manualmente los cambios críticos antes de hacer push
