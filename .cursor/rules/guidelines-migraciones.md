# Directrices para Migraciones de Base de Datos

## Reglas Fundamentales

Estas directrices son OBLIGATORIAS para cualquier migración de base de datos:

1. **NUNCA usar `CREATE POLICY IF NOT EXISTS`** - Esta sintaxis no es compatible con PostgreSQL.

   - ✅ CORRECTO: Usar `DROP POLICY IF EXISTS` seguido de `CREATE POLICY`
   - ❌ INCORRECTO: Usar `CREATE POLICY IF NOT EXISTS`

2. **SIEMPRE usar `IF NOT EXISTS` para tablas e índices**

   - ✅ CORRECTO: `CREATE TABLE IF NOT EXISTS mi_tabla (...)`
   - ❌ INCORRECTO: `CREATE TABLE mi_tabla (...)`

3. **SIEMPRE verificar existencia antes de modificar**

   ```sql
   DO $$
   BEGIN
     IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'mi_tabla' AND column_name = 'nueva_columna') THEN
       ALTER TABLE mi_tabla ADD COLUMN nueva_columna TEXT;
     END IF;
   END
   $$;
   ```

4. **SIEMPRE usar `SECURITY DEFINER` con `search_path` en funciones**

   ```sql
   CREATE OR REPLACE FUNCTION mi_funcion()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Lógica
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
   ```

5. **SIEMPRE usar `ON CONFLICT` para inserciones**
   ```sql
   INSERT INTO mi_tabla (campo1, campo2) VALUES ('valor1', 'valor2')
   ON CONFLICT DO NOTHING;
   ```

## Estructura de Migraciones

Cada migración debe seguir esta estructura:

1. Encabezado descriptivo (título, fecha, autor, descripción)
2. Cambios en esquema - tablas nuevas
3. Cambios en esquema - modificaciones
4. Cambios en políticas (RLS)
5. Vistas y funciones
6. Datos iniciales (si aplica)

## Convenciones

1. **Nombrado**: Usar formato snake_case para nombres de tablas y columnas
2. **Comentarios**: Incluir comentarios claros explicando el propósito de cada cambio
3. **Idempotencia**: Toda migración debe poder ejecutarse múltiples veces sin error
4. **Transacciones**: Considerar envolver cambios críticos en transacciones
5. **Rollback**: Para cambios críticos, incluir lógica de rollback

## Verificación Obligatoria

Antes de finalizar cualquier migración, VERIFICAR:

- ¿El código usa `DROP POLICY IF EXISTS` antes de `CREATE POLICY`?
- ¿Las tablas e índices usan `IF NOT EXISTS`?
- ¿Las modificaciones de columnas verifican existencia primero?
- ¿Las funciones usan `SECURITY DEFINER SET search_path = public`?
- ¿Las inserciones manejan conflictos con `ON CONFLICT`?
- ¿La migración es idempotente (puede ejecutarse más de una vez)?
