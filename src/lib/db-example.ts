/**
 * Este archivo muestra ejemplos de cómo usar la abstracción de Supabase
 * para operaciones de base de datos.
 */

import { db } from './supabaseClient';
import { Cliente, Vehiculo } from './supabaseServices';

// ==============================================
// === EJEMPLOS DE USO DE LA ABSTRACCIÓN DB ===
// ==============================================

// Ejemplo 1: Obtener todos los registros de una tabla
async function getAllClientes() {
  // Obtiene todos los clientes ordenados por razón social
  const clientes = await db.getAll<Cliente>('clientes', 'razon_social');

  return clientes;
}

// Ejemplo 2: Obtener un registro por su ID
async function getClienteById(id: string) {
  try {
    // Obtiene un cliente por su ID
    const cliente = await db.getById<Cliente>('clientes', id);
    return cliente;
  } catch (error) {
    console.error('Cliente no encontrado:', error);
    return null;
  }
}

// Ejemplo 3: Obtener registros según una condición
async function getVehiculosPorMarca(marca: string) {
  // Obtiene todos los vehículos de una marca específica
  const vehiculos = await db.getWhere<Vehiculo>('vehiculos', 'marca', marca, {
    orderColumn: 'placa',
  });

  return vehiculos;
}

// Ejemplo 4: Crear un nuevo registro
async function crearCliente(clienteData: Omit<Cliente, 'id'>) {
  try {
    // Crea un nuevo cliente
    const nuevoCliente = await db.create<Cliente>('clientes', clienteData);
    return nuevoCliente;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
}

// Ejemplo 5: Actualizar un registro
async function actualizarVehiculo(id: string, datosActualizados: Partial<Vehiculo>) {
  try {
    // Actualiza un vehículo existente
    const vehiculoActualizado = await db.update<Vehiculo>('vehiculos', id, datosActualizados);
    return vehiculoActualizado;
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    throw error;
  }
}

// Ejemplo 6: Eliminar un registro
async function eliminarCliente(id: string) {
  try {
    // Elimina un cliente
    await db.delete('clientes', id);
    return { success: true, message: 'Cliente eliminado correctamente' };
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return { success: false, message: 'Error al eliminar cliente' };
  }
}

// Ejemplo 7: Para operaciones más complejas, acceso directo al cliente
async function operacionCompleja() {
  try {
    // Acceso directo al cliente de Supabase para operaciones avanzadas
    const { data, error } = await db.db
      .from('viajes')
      .select(
        `
        id, 
        origen,
        destino,
        clientes(id, razon_social),
        vehiculos(id, placa)
      `
      )
      .eq('estado', 'activo')
      .order('fecha_salida', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error en operación compleja:', error);
    return null;
  }
}

// Ejemplo 8: Uso del método from para consultas personalizadas
async function consultaPersonalizada(clienteId: string) {
  try {
    const { data, error } = await db
      .from('viajes')
      .select('*')
      .eq('cliente_id', clienteId)
      .in('estado', ['pendiente', 'en_curso'])
      .order('fecha_salida', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error en consulta personalizada:', error);
    return [];
  }
}
