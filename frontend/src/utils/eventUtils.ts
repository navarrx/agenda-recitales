import { Event } from '../types';

/**
 * Determina si un evento es pago basándose en date_types y ticket_price
 */
export const isPaidEvent = (event: Event): boolean => {
  return event.date_types?.includes('pago') || !!event.ticket_price;
};

/**
 * Determina si un evento es gratis basándose en date_types
 */
export const isFreeEvent = (event: Event): boolean => {
  return event.date_types?.includes('gratis') || false;
};

/**
 * Obtiene el texto de precio para mostrar en la UI
 */
export const getEventPriceText = (event: Event): string => {
  // Si tiene precio definido, mostrarlo
  if (event.ticket_price) {
    return `ARS$ ${event.ticket_price.toLocaleString('es-AR')}`;
  }
  
  // Si no tiene precio, verificar date_types
  if (event.date_types && Array.isArray(event.date_types)) {
    if (event.date_types.includes('gratis')) {
      return 'GRATIS';
    } else if (event.date_types.includes('pago')) {
      return 'PAGO';
    }
  }
  
  // Si no tiene date_types definidos, mostrar "PAGO" por defecto
  return 'PAGO';
};

/**
 * Obtiene el texto del botón de compra basándose en el tipo de evento
 */
export const getTicketButtonText = (event: Event): string => {
  if (isFreeEvent(event)) {
    return 'Obtener entradas';
  } else if (isPaidEvent(event)) {
    return 'Comprar entradas';
  } else {
    return 'Ver entradas';
  }
}; 