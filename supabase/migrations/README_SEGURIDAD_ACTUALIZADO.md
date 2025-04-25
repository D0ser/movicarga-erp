# Migraciones de Seguridad para MoviCarga ERP (Actualizado)

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

### 3. `20250427012143_jwt_authentication.sql`

Implementa la autenticación basada en tokens JWT en la base de datos:

- **Tabla de tokens**: Almacena y gestiona tokens JWT emitidos
- **Gestión de sesiones**: Permite múltiples sesiones por usuario con revocación selectiva
- **Seguridad mejorada**: Controla caducidad de tokens y dispositivos autorizados
- **Limpieza automática**: Elimina tokens antiguos y mantiene la base de datos optimizada

### 4. `20250428012144_two_factor_auth.sql`

Implementa la autenticación de dos factores (2FA) a nivel de base de datos:

- **TOTP nativo**: Implementación completa del algoritmo TOTP (RFC 6238)
- **Códigos de recuperación**: Sistema para generar y verificar códigos de recuperación
- **Integración completa**: Funciones para activar/desactivar 2FA y verificar códigos
- **Seguridad por capas**: Políticas RLS para proteger la información sensible

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
- Los tokens JWT proporcionan un método seguro de autenticación sin estado

## Implementación en Código

El cliente frontend ya ha sido actualizado para trabajar con estas nuevas características:

- Verificación de contraseñas hasheadas
- Soporte para autenticación de dos factores con QR y códigos de recuperación
- Gestión de bloqueos de cuentas y límites de intentos
- Validación de complejidad de contraseñas
- Autenticación basada en tokens JWT

## Pruebas y Verificación

Para verificar que las migraciones se han aplicado correctamente:

```sql
-- Verificar tablas creadas
SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'login_attempts');
SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'auth_tokens');
SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'two_factor_recovery_codes');

-- Verificar campos en usuarios
SELECT column_name FROM information_schema.columns
WHERE table_name = 'usuarios' AND column_name LIKE 'two_factor%';

-- Verificar funciones creadas
SELECT proname FROM pg_proc WHERE proname LIKE '%password%' OR proname LIKE '%token%' OR proname LIKE '%totp%';
```

## Funciones Relevantes

### JWT y Autenticación

- `create_auth_token(user_id, expires_in, device_info, ip_address)`: Crea un nuevo token
- `verify_auth_token(token)`: Verifica si un token es válido
- `revoke_auth_token(token)`: Revoca un token específico
- `revoke_all_user_tokens(user_id)`: Revoca todos los tokens de un usuario
- `clean_expired_tokens()`: Limpia tokens expirados

### Autenticación de Dos Factores

- `generate_totp_code(secret)`: Genera un código TOTP actual
- `verify_totp(user_id, code)`: Verifica un código TOTP
- `generate_recovery_codes(user_id)`: Genera códigos de recuperación
- `use_recovery_code(user_id, code)`: Utiliza un código de recuperación
- `enable_two_factor_auth(user_id, secret, verification_code)`: Activa 2FA
- `disable_two_factor_auth(user_id)`: Desactiva 2FA

### Gestión de Contraseñas

- `hash_password(plain_password)`: Hashea una contraseña
- `verify_password(plain_password, hashed_password)`: Verifica una contraseña
- `validate_password_complexity(password)`: Verifica la complejidad de una contraseña
- `migrate_plain_passwords()`: Migra las contraseñas en texto plano a hashes
