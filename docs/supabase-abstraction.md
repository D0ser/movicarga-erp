# Mejora en la Abstracción de Supabase

## Descripción del Problema

En la implementación anterior, cada componente y servicio debía interactuar directamente con el cliente de Supabase, lo que resultaba en:

1. **Código repetitivo**: El patrón `supabase.from().select()` se repetía en muchos lugares.
2. **Manejo inconsistente de errores**: Cada implementación manejaba los errores de forma diferente.
3. **Tipado manual**: Cada servicio debía implementar manualmente el tipado de datos.
4. **Difícil mantenimiento**: Cambios en la estructura de consultas requerían modificar múltiples archivos.

## Solución Implementada

Se ha creado una capa de abstracción llamada `SupabaseService` en `src/lib/supabaseClient.ts` que:

1. **Proporciona métodos genéricos**: Para realizar operaciones CRUD comunes.
2. **Implementa tipado genérico**: Permite especificar tipos para los datos retornados.
3. **Maneja errores de forma consistente**: Implementa un patrón uniforme para el manejo de errores.
4. **Mantiene compatibilidad**: El cliente original sigue disponible para casos especiales.

## Cómo Usar la Nueva Abstracción

### Operaciones Básicas

```typescript
import { db } from '@/lib/supabaseClient';
import { Cliente } from '@/lib/supabaseServices';

// Obtener todos los registros
const clientes = await db.getAll<Cliente>('clientes', 'razon_social');

// Obtener por ID
const cliente = await db.getById<Cliente>('clientes', id);

// Consulta por condición
const clientesActivos = await db.getWhere<Cliente>('clientes', 'estado', true);

// Crear nuevo registro
const nuevoCliente = await db.create<Cliente>('clientes', clienteData);

// Actualizar registro
const clienteActualizado = await db.update<Cliente>('clientes', id, cambios);

// Eliminar registro
await db.delete('clientes', id);
```

### Consultas Avanzadas

Para consultas más complejas, se puede acceder directamente al cliente:

```typescript
// Usando from()
const { data, error } = await db
  .from('viajes')
  .select('id, origen, destino, cliente_id')
  .eq('estado', 'activo')
  .order('fecha_salida');

// Acceso directo al cliente
const { data, error } = await db.db
  .from('viajes')
  .select(
    `
    id, 
    origen,
    destino,
    clientes(id, razon_social)
  `
  )
  .eq('estado', 'activo');
```

## Guía de Migración

Para migrar código existente:

1. **Servicios**:

   - Reemplazar implementaciones directas de consultas con llamadas a los métodos de abstracción.
   - Ejemplo: `supabase.from('clientes').select('*')` → `db.getAll<Cliente>('clientes')`

2. **Componentes**:

   - Usar servicios abstractos en lugar de consultas directas.
   - Si es necesario acceso directo, usar `db.from()` para mantener consistencia.

3. **Consultas complejas**:
   - Mantener la implementación actual pero considerar moverlas a servicios específicos.
   - Usar el patrón uniforme de manejo de errores.

## Beneficios

- **Código más limpio**: Menos repetición, más claridad
- **Mantenimiento más sencillo**: Cambios centralizados
- **Mayor seguridad de tipos**: Tipado genérico
- **Mejor manejo de errores**: Patrón uniforme
- **Facilita pruebas**: Servicios más fáciles de probar

## Ejemplos de Implementación

Consultar el archivo `src/lib/db-example.ts` para ejemplos completos de uso.
