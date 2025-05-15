# Guía de Contribución

¡Gracias por tu interés en contribuir a Agenda App! Este documento proporciona las pautas y mejores prácticas para contribuir al proyecto.

## Proceso de Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Realiza tus cambios
4. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
5. Push a la rama (`git push origin feature/AmazingFeature`)
6. Abre un Pull Request

## Estándares de Código

### Python (Backend)
- Sigue PEP 8
- Usa type hints
- Documenta las funciones y clases
- Escribe tests unitarios para nueva funcionalidad

### TypeScript/React (Frontend)
- Sigue las guías de estilo de ESLint
- Usa componentes funcionales y hooks
- Mantén los componentes pequeños y reutilizables
- Documenta los props de los componentes

## Tests

- Asegúrate de que todos los tests pasen antes de enviar un PR
- Añade nuevos tests para nueva funcionalidad
- Mantén la cobertura de código alta

## Commits

- Usa mensajes de commit descriptivos
- Sigue el formato: `tipo(alcance): descripción`
- Tipos comunes: feat, fix, docs, style, refactor, test, chore

## Pull Requests

- Describe claramente los cambios realizados
- Referencia issues relacionados
- Incluye capturas de pantalla para cambios visuales
- Asegúrate de que los tests pasen
- Solicita review de al menos un mantenedor

## Reportar Bugs

- Usa el sistema de issues de GitHub
- Incluye pasos para reproducir el bug
- Menciona tu entorno (OS, navegador, versiones)
- Adjunta logs relevantes

## Proponer Features

- Abre un issue para discutir la feature antes de implementarla
- Explica el caso de uso
- Considera el impacto en la base de código existente
- Proporciona mockups/wireframes si aplica

## Código de Conducta

Este proyecto sigue el [Código de Conducta del Contribuyente](https://www.contributor-covenant.org/es/version/2/0/code_of_conduct/). Al participar, se espera que respetes este código. 