# Tablero de Comunicación y Seguimiento de OficiosPro

Dashboard estático del Taller #4 (Plan de Comunicación), Licenciatura en Desarrollo y Gestión de Software, Universidad Tecnológica de Panamá.

Sitio de una sola página: HTML, CSS y JavaScript. Los datos viven en `data.js`. No hay backend, base de datos ni paso de build.

## Cómo verlo en local

1. Abre la carpeta del proyecto.
2. Haz doble clic en `index.html` (o ábrelo con el navegador).

Los gráficos usan Chart.js por CDN, así que hace falta conexión a internet la primera vez. No se llama a ninguna API de negocio: todo el contenido sale de `data.js`.

## Cómo editar los datos

Cambia **solo** `data.js`. No toques `app.js` salvo que quieras umbrales (objeto `UMBRALES` al inicio).


## Archivos

- `index.html` — estructura y secciones A–D
- `styles.css` — tema OficiosPro, responsive e impresión
- `data.js` — objeto `DASHBOARD_DATA`
- `app.js` — cálculos, filtros, gráficos y modo presentación
