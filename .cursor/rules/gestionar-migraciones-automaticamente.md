# Migraciones de Base de Datos Automáticas

## Contexto

El proyecto utiliza Supabase CLI y migraciones para gestionar la base de datos PostgreSQL. Los cambios se aplican automáticamente a través de GitHub Actions cuando se hace push de nuevos archivos de migración.

## Instrucciones

1. **Generar automáticamente migraciones**: Cuando el usuario solicite cambios en la base de datos, debes proactivamente crear el archivo de migración siguiendo estos pasos:

   - Ejecutar el comando para crear el archivo: `npm run db:new nombre_descriptivo`
   - Implementar el código SQL necesario en el archivo generado
   - Seguir el formato de la plantilla en `supabase/migration-template.sql`
   - Mostrar el código resultante al usuario para revisión

2. **Patrones a detectar**: Identifica peticiones como:

   - "Agregar una columna/campo a [tabla]"
   - "Crear una nueva tabla para [concepto]"
   - "Modificar la estructura de [tabla]"
   - "Cambiar políticas de seguridad"
   - "Actualizar una vista"

3. **Reglas importantes**:

   - Para políticas de RLS: Usar `DROP POLICY IF EXISTS` antes de `CREATE POLICY`
   - Para tablas/índices: Usar `CREATE TABLE/INDEX IF NOT EXISTS`
   - Para columnas: Verificar si existe la columna antes de añadirla
   - Incluir `SECURITY DEFINER SET search_path = public` en funciones
   - Hacer las migraciones idempotentes (pueden ejecutarse múltiples veces)

4. **Flujo de trabajo**:
   - Obtener requerimientos del usuario para cambios en la base de datos
   - Crear archivo de migración siguiendo las convenciones
   - Mostrar al usuario el código para aprobación
   - Recordar que el usuario debe hacer commit y push para aplicar los cambios

## Recursos

- Lineamientos: `supabase/GUIDELINES.md`
- Plantilla: `supabase/migration-template.sql`
- Documentación: `supabase/README.md`
- Scripts npm: Ver `package.json` para comandos relacionados con `db:`
