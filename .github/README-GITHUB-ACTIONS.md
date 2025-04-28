# Configuración de GitHub Actions para Supabase

Este proyecto está configurado con varios workflows de GitHub Actions para mantener la calidad del código y automatizar diferentes procesos.

## Workflows Disponibles

### 1. Update Supabase Database (`update-supabase.yml`)

Este workflow actualiza automáticamente la base de datos de Supabase cada vez que se realiza un push al repositorio y el archivo `create-all-tables.sql` ha sido modificado.

### 2. Apply Supabase Migrations (`supabase-db-migration.yml`)

Aplica las migraciones de Supabase cuando hay cambios en los archivos de migración.

### 3. Code Quality Checks (`code-quality.yml`) - NUEVO

Ejecuta verificaciones de calidad de código:

- **ESLint**: Verifica problemas de estilo y posibles errores en el código
- **TypeScript**: Comprueba que no haya errores de tipos en el código

### 4. Build Check (`build.yml`) - NUEVO

Verifica que el proyecto se pueda construir correctamente, ejecutando `npm run build` en un entorno de CI.

## Requisitos para Supabase

Para que los workflows relacionados con Supabase funcionen correctamente, es necesario configurar los siguientes secretos en el repositorio de GitHub:

### Configurar Secretos en GitHub

1. Ve a tu repositorio en GitHub
2. Haz clic en "Settings" (Configuración)
3. En el menú lateral, selecciona "Secrets and variables" → "Actions"
4. Haz clic en "New repository secret"
5. Agrega los siguientes secretos:

   - **SUPABASE_URL**: La URL de tu proyecto Supabase (ej. `https://bccxjjgpabepwbqglmrn.supabase.co`)
   - **SUPABASE_SERVICE_ROLE_KEY**: La clave de servicio (service role key) de tu proyecto Supabase
   - **NEXT_PUBLIC_SUPABASE_URL**: La URL pública de Supabase (para el build check)
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**: La clave anónima de Supabase (para el build check)

## ¿Dónde encontrar estas claves?

1. Inicia sesión en tu [dashboard de Supabase](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a "Project Settings" (Configuración del proyecto)
4. En "API", encontrarás:
   - URL del proyecto (Project URL)
   - Service Role Key (NO es la anon key, es una clave con más privilegios)
   - Anon Key (para el entorno frontend)

⚠️ **IMPORTANTE**: La Service Role Key tiene permisos elevados. Nunca la uses en un entorno frontend o la expongas públicamente.

## Beneficios de los Nuevos Workflows

Los nuevos workflows de comprobación de código (lint y TypeScript) y build proporcionan estos beneficios:

1. **Detección temprana de errores**: Identifica problemas antes de que lleguen a producción
2. **Consistencia de código**: Mantiene los estándares de código en todo el proyecto
3. **Seguridad de tipos**: Garantiza que los tipos de TypeScript se utilicen correctamente
4. **Verificación de compilación**: Asegura que el proyecto siempre se pueda construir correctamente

## Solución de problemas

Si algún workflow falla, puedes revisar los logs de ejecución en la pestaña "Actions" de tu repositorio de GitHub para identificar el problema específico.
