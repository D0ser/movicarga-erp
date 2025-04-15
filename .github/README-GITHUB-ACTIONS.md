# Configuración de GitHub Actions para Supabase

Este proyecto está configurado para actualizar automáticamente la base de datos de Supabase cada vez que se realiza un push al repositorio y el archivo `create-all-tables.sql` ha sido modificado.

## Requisitos

Para que este proceso funcione correctamente, es necesario configurar los siguientes secretos en el repositorio de GitHub:

### Configurar Secretos en GitHub

1. Ve a tu repositorio en GitHub
2. Haz clic en "Settings" (Configuración)
3. En el menú lateral, selecciona "Secrets and variables" → "Actions"
4. Haz clic en "New repository secret"
5. Agrega los siguientes secretos:

   - **SUPABASE_URL**: La URL de tu proyecto Supabase (ej. `https://bccxjjgpabepwbqglmrn.supabase.co`)
   - **SUPABASE_SERVICE_ROLE_KEY**: La clave de servicio (service role key) de tu proyecto Supabase

## ¿Dónde encontrar estas claves?

1. Inicia sesión en tu [dashboard de Supabase](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a "Project Settings" (Configuración del proyecto)
4. En "API", encontrarás:
   - URL del proyecto (Project URL)
   - Service Role Key (NO es la anon key, es una clave con más privilegios)

⚠️ **IMPORTANTE**: La Service Role Key tiene permisos elevados. Nunca la uses en un entorno frontend o la expongas públicamente.

## Cómo funciona

El workflow de GitHub Actions:

1. Se activa cuando hay un push a la rama principal y el archivo `create-all-tables.sql` ha sido modificado
2. Ejecuta el script SQL en tu base de datos de Supabase
3. Notifica si la operación fue exitosa o si hubo algún error

## Solución de problemas

Si el workflow falla, puedes revisar los logs de ejecución en la pestaña "Actions" de tu repositorio de GitHub para identificar el problema específico.
