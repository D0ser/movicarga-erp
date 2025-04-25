# Instrucciones para Consolidar Migraciones

Para crear un archivo `20250425033326_consolidado_sql.sql` con todas las migraciones, por favor sigue estos pasos en orden:

1. Crear un nuevo archivo llamado `20250425033326_consolidado_sql.sql` en el directorio `supabase/migrations/`
2. Copiar en orden el contenido de los siguientes archivos (sin incluir los encabezados repetitivos como la creación de extensiones):

## Orden de migraciones a consolidar

1. Copia el encabezado preparado:

```sql
-- ******************************************************************
-- ARCHIVO CONSOLIDADO DE MIGRACIONES PARA MOVICARGA ERP
-- Fecha de consolidación: 29/04/2025
-- ******************************************************************
-- Este archivo combina todas las migraciones existentes en un solo script
-- para facilitar la implementación y mantenimiento.
--
-- CONTENIDO:
-- 1. Esquema inicial (20240424220500_initial_schema.sql)
-- 2. Políticas de seguridad (20240424220600_seguridad.sql)
-- 3. Corrección de funciones (20240424220700_fix_function.sql)
-- 4. Cambios en la tabla de usuarios (20250425002008_cambio_table_usuarios.sql)
-- 5. Factores de seguridad adicionales (20250425012141_nuevos_factores_de_seguridad.sql)
-- 6. Migración de contraseñas (20250426012142_password_migration.sql)
-- 7. Autenticación JWT (20250427012143_jwt_authentication.sql)
-- 8. Autenticación de dos factores (20250428012144_two_factor_auth.sql)
-- ******************************************************************

-- Asegurarse de que todas las extensiones necesarias estén habilitadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ******************************************************************
-- 1. ESQUEMA INICIAL
-- ******************************************************************
```

2. Copia todo el contenido de `20240424220500_initial_schema.sql`, excepto las primeras líneas que hacen referencia a la extensión uuid-ossp que ya incluimos en el encabezado.

3. Agrega este separador:

```sql
-- ******************************************************************
-- 2. POLÍTICAS DE SEGURIDAD
-- ******************************************************************
```

4. Copia todo el contenido de `20240424220600_seguridad.sql`, omitiendo cualquier instrucción CREATE EXTENSION.

5. Agrega este separador:

```sql
-- ******************************************************************
-- 3. CORRECCIÓN DE FUNCIONES
-- ******************************************************************
```

6. Copia todo el contenido de `20240424220700_fix_function.sql`.

7. Agrega este separador:

```sql
-- ******************************************************************
-- 4. CAMBIOS EN LA TABLA DE USUARIOS
-- ******************************************************************
```

8. Copia todo el contenido de `20250425002008_cambio_table_usuarios.sql`.

9. Agrega este separador:

```sql
-- ******************************************************************
-- 5. FACTORES DE SEGURIDAD ADICIONALES
-- ******************************************************************
```

10. Copia todo el contenido de `20250425012141_nuevos_factores_de_seguridad.sql`, omitiendo cualquier instrucción CREATE EXTENSION.

11. Agrega este separador:

```sql
-- ******************************************************************
-- 6. MIGRACIÓN DE CONTRASEÑAS
-- ******************************************************************
```

12. Copia todo el contenido de `20250426012142_password_migration.sql`, omitiendo cualquier instrucción CREATE EXTENSION.

13. Agrega este separador:

```sql
-- ******************************************************************
-- 7. AUTENTICACIÓN JWT
-- ******************************************************************
```

14. Copia todo el contenido de `20250427012143_jwt_authentication.sql`, omitiendo cualquier instrucción CREATE EXTENSION.

15. Agrega este separador:

```sql
-- ******************************************************************
-- 8. AUTENTICACIÓN DE DOS FACTORES
-- ******************************************************************
```

16. Copia todo el contenido de `20250428012144_two_factor_auth.sql`, omitiendo cualquier instrucción CREATE EXTENSION.

Una vez completado, revisa el archivo para asegurarte de que no haya duplicación de código, especialmente en lo que respecta a:

- Instrucciones CREATE EXTENSION
- Creación de tablas o campos que podrían estar duplicados

## Una vez consolidado

Después de consolidar el archivo, puedes eliminar los archivos individuales de migración o moverlos a un directorio de respaldo. En producción, solo necesitarás aplicar este archivo consolidado.

```

IMPORTANTE: Este archivo consolidado solo debe ser usado para nuevas instalaciones. No debe ser aplicado sobre bases de datos existentes que ya tengan algunas de estas migraciones aplicadas, ya que podría causar errores o duplicación de datos.
```
