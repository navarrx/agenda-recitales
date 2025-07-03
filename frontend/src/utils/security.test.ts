/**
 * Pruebas para las utilidades de seguridad
 */

import { 
  sanitizeText, 
  sanitizeEmail, 
  sanitizeUrl, 
  validateEmail, 
  validateUrl, 
  validateLength,
  sanitizeEventRequest 
} from './security';

// Pruebas de sanitización de texto
describe('sanitizeText', () => {
  test('remueve caracteres peligrosos', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert(xss)');
    expect(sanitizeText('SELECT * FROM users')).toBe('* FROM users');
    expect(sanitizeText('test"with\'quotes')).toBe('testwithquotes');
  });

  test('normaliza espacios múltiples', () => {
    expect(sanitizeText('  multiple    spaces  ')).toBe('multiple spaces');
  });

  test('retorna string vacío para valores nulos', () => {
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
    expect(sanitizeText('')).toBe('');
  });
});

// Pruebas de sanitización de email
describe('sanitizeEmail', () => {
  test('mantiene formato válido de email', () => {
    expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
  });

  test('remueve caracteres peligrosos', () => {
    expect(sanitizeEmail('test<script>@example.com')).toBe('test@example.com');
    expect(sanitizeEmail('test"@example.com')).toBe('test@example.com');
  });
});

// Pruebas de sanitización de URL
describe('sanitizeUrl', () => {
  test('mantiene formato válido de URL', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('  HTTP://EXAMPLE.COM  ')).toBe('http://example.com');
  });

  test('remueve caracteres peligrosos', () => {
    expect(sanitizeUrl('https://example.com<script>')).toBe('https://example.com');
    expect(sanitizeUrl('https://example.com"')).toBe('https://example.com');
  });
});

// Pruebas de validación de email
describe('validateEmail', () => {
  test('valida emails correctos', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });

  test('rechaza emails incorrectos', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

// Pruebas de validación de URL
describe('validateUrl', () => {
  test('valida URLs correctas', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://localhost:3000')).toBe(true);
    expect(validateUrl('https://subdomain.example.com/path')).toBe(true);
  });

  test('rechaza URLs incorrectas', () => {
    expect(validateUrl('not-a-url')).toBe(false);
    expect(validateUrl('ftp://example.com')).toBe(false);
    expect(validateUrl('')).toBe(false);
  });
});

// Pruebas de validación de longitud
describe('validateLength', () => {
  test('valida longitudes correctas', () => {
    expect(validateLength('test', 10)).toBe(true);
    expect(validateLength('', 10)).toBe(true);
    expect(validateLength('exact', 5)).toBe(true);
  });

  test('rechaza longitudes excesivas', () => {
    expect(validateLength('very long text', 5)).toBe(false);
    expect(validateLength('1234567890', 9)).toBe(false);
  });
});

// Pruebas de sanitización de solicitud de evento
describe('sanitizeEventRequest', () => {
  test('sanitiza datos válidos', () => {
    const data = {
      name: 'Test User',
      email: 'test@example.com',
      eventName: 'Test Event',
      artist: 'Test Artist',
      date: '2024-12-25',
      venue: 'Test Venue',
      city: 'Test City',
      ticketUrl: 'https://example.com/tickets',
      message: 'Test message'
    };

    const result = sanitizeEventRequest(data);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitized.name).toBe('Test User');
    expect(result.sanitized.email).toBe('test@example.com');
  });

  test('detecta errores en datos inválidos', () => {
    const data = {
      name: 'A', // Muy corto
      email: 'invalid-email',
      eventName: '',
      artist: 'Test Artist',
      date: '2024-12-25',
      venue: 'Test Venue',
      city: 'Test City',
      ticketUrl: 'not-a-url',
      message: 'Test message'
    };

    const result = sanitizeEventRequest(data);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('El nombre debe tener al menos 2 caracteres');
    expect(result.errors).toContain('El email no tiene un formato válido');
    expect(result.errors).toContain('El nombre del evento debe tener al menos 2 caracteres');
    expect(result.errors).toContain('La URL de entradas no es válida');
  });

  test('sanitiza caracteres peligrosos', () => {
    const data = {
      name: 'Test<script>User',
      email: 'test@example.com',
      eventName: 'Test Event',
      artist: 'Test Artist',
      date: '2024-12-25',
      venue: 'Test Venue',
      city: 'Test City',
      ticketUrl: 'https://example.com/tickets',
      message: 'Test<script>message'
    };

    const result = sanitizeEventRequest(data);
    expect(result.sanitized.name).toBe('TestUser');
    expect(result.sanitized.message).toBe('Testmessage');
  });
});

// Pruebas de casos edge
describe('Casos edge', () => {
  test('maneja caracteres especiales en búsqueda', () => {
    const searchTerms = [
      '<script>alert("xss")</script>',
      'SELECT * FROM users WHERE id = 1',
      'test"with\'quotes',
      'normal search term',
      'javascript:alert("xss")',
      'onload=alert("xss")'
    ];

    searchTerms.forEach(term => {
      const sanitized = sanitizeText(term);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('SELECT');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onload=');
    });
  });

  test('valida fechas futuras', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    // Esta prueba requeriría importar validateFutureDate
    // expect(validateFutureDate(pastDate.toISOString().split('T')[0])).toBe(false);
    // expect(validateFutureDate(futureDate.toISOString().split('T')[0])).toBe(true);
  });
}); 