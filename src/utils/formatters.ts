/**
 * Utilidades para formatear datos
 */

/**
 * Formatea un valor numérico como moneda (soles)
 * @param value - El valor a formatear
 * @returns Cadena formateada como moneda
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatea un valor numérico como número con separador de miles
 * @param value - El valor a formatear
 * @returns Cadena formateada con separador de miles
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-PE').format(value);
};

/**
 * Formatea un valor numérico como porcentaje
 * @param value - El valor a formatear (0-1)
 * @returns Cadena formateada como porcentaje
 */
export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'percent',
    minimumFractionDigits: 2,
  }).format(value);
};
