# Documentación para Embedding de la Agenda

Este documento explica cómo embeber el componente de Agenda en cualquier sitio web usando un iframe.

## Uso Básico

Para embeber la agenda, simplemente agrega un iframe con la siguiente estructura:

```html
<iframe 
    src="https://agenda-recitales-production.up.railway.app/embed"
    width="100%" 
    height="600px" 
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
></iframe>
```

## Parámetros Disponibles

Puedes personalizar la agenda usando los siguientes parámetros en la URL:

| Parámetro | Tipo | Descripción | Valor por defecto |
|-----------|------|-------------|-------------------|
| `theme` | string | Tema de la agenda | `light` |
| `limit` | number | Número inicial de eventos a mostrar | `12` |
| `city` | string | Filtrar por ciudad | `null` |
| `genre` | string | Filtrar por género | `null` |

### Ejemplos de Uso

1. Agenda con tema oscuro:
```html
<iframe src="https://agenda-recitales-production.up.railway.app/embed?theme=dark"></iframe>
```

2. Agenda con límite personalizado:
```html
<iframe src="https://agenda-recitales-production.up.railway.app/embed?limit=24"></iframe>
```

3. Agenda filtrada por ciudad:
```html
<iframe src="https://agenda-recitales-production.up.railway.app/embed?city=Buenos%20Aires"></iframe>
```

4. Combinación de parámetros:
```html
<iframe src="https://agenda-recitales-production.up.railway.app/embed?theme=dark&limit=24&city=Buenos%20Aires&genre=Rock"></iframe>
```

## Características

- **Responsive**: La agenda se adapta automáticamente al ancho del contenedor
- **Temas**: Soporta tema claro y oscuro
- **Filtros**: Incluye filtros por ciudad, género y fecha
- **Paginación**: Carga más eventos automáticamente al hacer scroll
- **Búsqueda**: Incluye barra de búsqueda para filtrar eventos
- **Ordenamiento**: Los eventos se muestran ordenados por fecha

## Dimensiones Recomendadas

- **Altura mínima**: 400px
- **Altura recomendada**: 600px
- **Ancho**: 100% del contenedor

## Ejemplo Completo

```html
<div style="width: 100%; max-width: 1200px; margin: 0 auto;">
    <iframe 
        src="https://agenda-recitales-production.up.railway.app/embed?theme=light&limit=12"
        width="100%" 
        height="600px" 
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
    ></iframe>
</div>
```

## Notas Importantes

1. La URL debe ser exactamente `https://agenda-recitales-production.up.railway.app/embed`
2. Los parámetros deben ser codificados correctamente (usar `encodeURIComponent` para valores con espacios)
3. El iframe debe tener una altura mínima de 400px para una correcta visualización
4. Se recomienda usar `width="100%"` para que la agenda sea responsive

## Soporte

Si necesitas ayuda o tienes preguntas sobre la implementación, por favor contacta al equipo de desarrollo. 