/**
 * Utilidades de seguridad para sanitización y validación de datos
 */

// Caracteres peligrosos que podrían usarse en ataques
const DANGEROUS_CHARS = /[<>'"&]/g;
const SQL_INJECTION_PATTERNS = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/gi;
const XSS_PATTERNS = /<script[^>]*>.*?<\/script>|<iframe[^>]*>.*?<\/iframe>|<object[^>]*>.*?<\/object>|<embed[^>]*>.*?<\/embed>/gi;

/**
 * Sanitiza texto removiendo caracteres peligrosos y patrones maliciosos
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(DANGEROUS_CHARS, '')
    .replace(SQL_INJECTION_PATTERNS, '')
    .replace(XSS_PATTERNS, '')
    .replace(/\s+/g, ' '); // Normaliza espacios múltiples
}

/**
 * Sanitiza texto de búsqueda permitiendo espacios pero removiendo caracteres peligrosos
 */
export function sanitizeSearchText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(DANGEROUS_CHARS, '')
    .replace(SQL_INJECTION_PATTERNS, '')
    .replace(XSS_PATTERNS, '')
    .replace(/\s+/g, ' '); // Normaliza espacios múltiples pero mantiene espacios
}

/**
 * Sanitiza email removiendo caracteres peligrosos pero manteniendo formato válido
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  // Remover caracteres peligrosos pero mantener @ y .
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>'"&]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Sanitiza URL removiendo caracteres peligrosos pero manteniendo formato válido
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  return url
    .trim()
    .replace(/[<>'"&]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Valida que el texto no exceda la longitud máxima
 */
export function validateLength(text: string, maxLength: number): boolean {
  return text.length <= maxLength;
}

/**
 * Valida formato de email básico
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de URL básico
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida fecha (debe ser futura)
 */
export function validateFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

/**
 * Sanitiza y valida todos los campos de una solicitud de evento
 */
export function sanitizeEventRequest(data: {
  name: string;
  email: string;
  eventName: string;
  artist: string;
  date: string;
  venue: string;
  city: string;
  ticketUrl: string;
  message?: string;
}): {
  sanitized: any;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Sanitizar campos
  const sanitized = {
    name: sanitizeText(data.name),
    email: sanitizeEmail(data.email),
    eventName: sanitizeText(data.eventName),
    artist: sanitizeText(data.artist),
    date: data.date, // La fecha no necesita sanitización
    venue: sanitizeText(data.venue),
    city: sanitizeText(data.city),
    ticketUrl: sanitizeUrl(data.ticketUrl),
    message: data.message ? sanitizeText(data.message) : ''
  };
  
  // Validaciones
  if (!sanitized.name || sanitized.name.length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (!validateLength(sanitized.name, 100)) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }
  
  if (!validateEmail(sanitized.email)) {
    errors.push('El email no tiene un formato válido');
  }
  
  if (!sanitized.eventName || sanitized.eventName.length < 2) {
    errors.push('El nombre del evento debe tener al menos 2 caracteres');
  }
  
  if (!validateLength(sanitized.eventName, 200)) {
    errors.push('El nombre del evento no puede exceder 200 caracteres');
  }
  
  if (!sanitized.artist || sanitized.artist.length < 2) {
    errors.push('El artista debe tener al menos 2 caracteres');
  }
  
  if (!validateLength(sanitized.artist, 100)) {
    errors.push('El artista no puede exceder 100 caracteres');
  }
  
  if (!sanitized.date) {
    errors.push('La fecha es requerida');
  } else if (!validateFutureDate(sanitized.date)) {
    errors.push('La fecha debe ser futura');
  }
  
  if (!sanitized.venue || sanitized.venue.length < 2) {
    errors.push('El lugar debe tener al menos 2 caracteres');
  }
  
  if (!validateLength(sanitized.venue, 200)) {
    errors.push('El lugar no puede exceder 200 caracteres');
  }
  
  if (!sanitized.city || sanitized.city.length < 2) {
    errors.push('La ciudad debe tener al menos 2 caracteres');
  }
  
  if (!validateLength(sanitized.city, 100)) {
    errors.push('La ciudad no puede exceder 100 caracteres');
  }
  
  if (!validateUrl(sanitized.ticketUrl)) {
    errors.push('La URL de entradas no es válida');
  }
  
  if (sanitized.message && !validateLength(sanitized.message, 1000)) {
    errors.push('El mensaje no puede exceder 1000 caracteres');
  }
  
  return { sanitized, errors };
}

/**
 * Previene la inyección de HTML en el DOM
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
} 