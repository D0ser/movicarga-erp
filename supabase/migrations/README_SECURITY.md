# Migraciones de Seguridad para MoviCarga ERP

Este directorio contiene las migraciones de seguridad para implementar mejoras en la autenticación y protección de datos en el sistema MoviCarga ERP.

## Archivos de Migración

### 1. `20250425012141_nuevos_factores_de_seguridad.sql`

Implementa las siguientes características de seguridad:

- **Tabla de intentos de inicio de sesión**: Registra todos los intentos exitosos y fallidos
- **Campos adicionales para usuarios**:
  - Autenticación de dos factores (2FA)
  - Historial de contraseñas
  - Bloqueo de cuentas
- **Funciones automatizadas**:
  - Limpieza de registros antiguos
  - Bloqueo automático después de múltiples intentos fallidos

### 2. `20250426012142_password_migration.sql`

Implementa el hasheo seguro de contraseñas:

- **Extensión pgcrypto**: Utiliza algoritmos criptográficos seguros
- **Funciones de hasheo**: Cifra las contraseñas con bcrypt (10 rondas)
- **Migración gradual**: Permite convertir contraseñas existentes sin interrumpir el servicio
- **Triggers automáticos**: Asegura que todas las contraseñas nuevas sean hasheadas

## Aplicación de las Migraciones

Para aplicar estas migraciones en su ambiente de Supabase:

1. Acceda al panel de administración de su proyecto Supabase
2. Vaya a la sección SQL Editor
3. Ejecute cada archivo de migración en orden secuencial

Alternativamente, si está usando la CLI de Supabase:

```bash
supabase db push
```

## Migración de Contraseñas Existentes

Para hashear las contraseñas existentes en texto plano, debe ejecutar la función `migrate_plain_passwords()`:

```sql
SELECT migrate_plain_passwords();
```

Esto retornará el número de contraseñas que fueron actualizadas.

## Consideraciones de Seguridad

- Las contraseñas hasheadas aparecen con el prefijo `$2` (indicando bcrypt)
- Nunca almacene contraseñas en texto plano en la base de datos
- Después de la migración completa, todos los usuarios deberían tener contraseñas hasheadas
- Las políticas RLS (Row Level Security) limitan el acceso a la información sensible

## Implementación en Código

El cliente frontend ya ha sido actualizado para trabajar con estas nuevas características:

- Verificación de contraseñas hasheadas
- Soporte para autenticación de dos factores
- Gestión de bloqueos de cuentas
- Validación de complejidad de contraseñas
