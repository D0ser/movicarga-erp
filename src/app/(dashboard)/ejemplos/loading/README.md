# Componentes de Carga (Loading)

Este módulo proporciona componentes y utilidades para mostrar indicadores de carga (spinners) en la aplicación.

## Componentes disponibles

### 1. Spinner

Componente básico que muestra un indicador de carga giratorio.

```tsx
import { Spinner } from "@/components/ui/spinner";

// Uso básico
<Spinner />

// Con tamaño personalizado
<Spinner size="sm" />  // small
<Spinner size="md" />  // medium (default)
<Spinner size="lg" />  // large

// Con etiqueta
<Spinner label="Cargando datos..." />

// Con clase personalizada
<Spinner className="text-red-500" />
```

### 2. Loading

Componente contenedor que puede mostrar un estado de carga o su contenido hijo.

```tsx
import { Loading } from "@/components/ui/loading";

// Como contenedor simple
<Loading isLoading={true}>
  <div>Este contenido se oculta mientras isLoading sea true</div>
</Loading>

// Como overlay sobre el contenido
<Loading isLoading={true} overlay>
  <div>El contenido sigue visible pero con un overlay de carga encima</div>
</Loading>

// A pantalla completa
<Loading isLoading={true} fullPage />

// Con mensaje personalizado
<Loading isLoading={true} message="Obteniendo datos..." />
```

## Hooks

### useLoading

Hook personalizado para gestionar estados de carga.

```tsx
import { useLoading } from '@/hooks/use-loading';

function MyComponent() {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

  // Método 1: Manual
  const handleClick = async () => {
    startLoading();
    try {
      await fetchSomeData();
    } finally {
      stopLoading();
    }
  };

  // Método 2: Automático con withLoading
  const handleFetch = async () => {
    try {
      const data = await withLoading(fetchSomeData());
      // withLoading maneja automáticamente el estado de carga
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={handleClick}>Cargar datos (manual)</button>
      <button onClick={handleFetch}>Cargar datos (automático)</button>

      <Loading isLoading={isLoading}>
        <div>Contenido de la página</div>
      </Loading>
    </div>
  );
}
```

## Notificaciones de carga

También puedes usar el servicio de notificaciones para mostrar toasts de carga.

```tsx
import notificationService from '@/services/notificationService';

const handleProcess = async () => {
  const toastId = notificationService.loading('Procesando datos...');

  try {
    await procesarDatos();
    notificationService.dismiss(); // Ocultar toast de carga
    notificationService.success('Datos procesados correctamente');
  } catch (error) {
    notificationService.dismiss(); // Ocultar toast de carga
    notificationService.error('Error al procesar los datos');
  }
};
```

## Integración con DataTable

El componente DataTable ya está integrado con estos componentes de carga. Solo necesitas pasar la prop `isLoading`:

```tsx
<DataTable columns={columns} data={data} title="Mi Tabla" isLoading={isLoading} />
```
