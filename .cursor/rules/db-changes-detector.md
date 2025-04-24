# Detector Automático de Cambios en Base de Datos

## Propósito

Detectar automáticamente cualquier mención o cambio relacionado con la estructura de la base de datos y responder proactivamente creando las migraciones correspondientes.

## Activación

Esta regla se activa cuando el usuario:

1. Menciona cambios en tablas, columnas, índices o vistas
2. Habla sobre la estructura de la base de datos
3. Pide añadir, modificar o eliminar elementos de la base de datos
4. Comparte código SQL para implementar
5. Discute requisitos funcionales que impliquen cambios en el modelo de datos

## Acciones a Realizar

1. Identificar qué tablas, columnas o estructuras están siendo modificadas
2. Crear automáticamente un archivo de migración usando `npm run db:new`
3. Implementar los cambios SQL siguiendo las mejores prácticas
4. Presentar el resultado al usuario para revisión
5. Recordar al usuario que debe hacer commit y push para aplicar los cambios

## Patrones Clave a Detectar

- "Agregar/añadir/crear campo/columna"
- "Nueva tabla/entidad/modelo"
- "Modificar/cambiar/actualizar estructura"
- "Eliminar/borrar/quitar columna/tabla"
- "Índice para mejorar rendimiento"
- "Política de seguridad/RLS"
- "Vista/función/trigger/procedimiento"
- "Relación/llave foránea/referencia"
- "Tipo de dato/constraint/validación"

## Contexto Importante

Incluso si no se solicita explícitamente, cuando se discutan nuevas funcionalidades o cambios de requisitos que impliquen almacenar datos diferentes, evaluar proactivamente los cambios necesarios en la base de datos y proponer las migraciones correspondientes.

## Nota Especial

Esta regla tiene alta prioridad y debe aplicarse vigilando continuamente todas las conversaciones y archivos relacionados con modelos de datos, tablas o estructuras de almacenamiento.
