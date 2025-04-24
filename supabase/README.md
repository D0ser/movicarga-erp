# Gestión de Base de Datos con Supabase CLI

## Estructura del Directorio

```
supabase/
  ├── migrations/                # Archivos de migración para cambios en la BD
  │   ├── 20240424220500_*.sql   # Migración inicial (esquema)
  │   ├── 20240424220600_*.sql   # Migración para políticas de seguridad
  │   └── ...                    # Otras migraciones
  ├── seed.sql                   # Datos iniciales para la BD
  ├── config.toml                # Configuración de Supabase
  ├── GUIDELINES.md              # Lineamientos para crear migraciones
  └── migration-template.sql     # Plantilla para nuevas migraciones
```

## Flujo de Trabajo Automatizado

Este proyecto está configurado para aplicar automáticamente las migraciones a la base de datos en Supabase cuando se hace push a la rama principal. El proceso es el siguiente:

1. Creas un nuevo archivo de migración en `supabase/migrations/`
2. Haces commit y push a la rama principal
3. GitHub Actions detecta los cambios y ejecuta el workflow
4. El workflow aplica las migraciones a la base de datos en Supabase

## Comandos Útiles

```bash
# Crear una nueva migración
npx supabase migration new nombre_descriptivo

# Iniciar Supabase localmente (requiere Docker)
npx supabase start

# Aplicar migraciones localmente
npx supabase db reset

# Obtener un diff entre local y remoto
npx supabase db diff -f cambios_pendientes
```

## Mejores Prácticas

1. **Usar la plantilla**: Copia `migration-template.sql` cuando crees una nueva migración
2. **Seguir los lineamientos**: Revisa `GUIDELINES.md` antes de crear migraciones
3. **Pruebas locales**: Prueba siempre tus migraciones localmente antes de hacer push
4. **Cambios incrementales**: Realiza cambios pequeños e incrementales
5. **Documentación**: Añade comentarios descriptivos a tus migraciones

## Solución de Problemas

Si el workflow falla, puedes:

1. Verificar los logs en GitHub Actions
2. Probar las migraciones localmente con `npx supabase db reset`
3. Crear una nueva migración que corrija los problemas
4. Hacer commit y push nuevamente

## Enlaces Útiles

- [Documentación de Supabase CLI](https://supabase.com/docs/guides/cli)
- [Migraciones de PostgreSQL](https://supabase.com/docs/guides/database/migrations)
- [Foro de Soporte de Supabase](https://github.com/supabase/supabase/discussions)
