# Aules · Pendientes de corregir

Extensión para Chrome (y navegadores Chromium: Edge, Brave…) que, en la página de inicio de un curso de Aules, añade bajo las fechas de cada **tarea** una línea con las entregas que faltan por corregir:

```
Práctica 1.1 - Instalación de sistemas operativos
Apertura: lunes, 28 de septiembre de 2026, 00:00   Cierre: domingo, 18 de octubre de 2026, 23:59
🔴 Pendientes de corregir: 2 de 30 entregas
```

- 🔴: hay entregas sin corregir (pone también cuántas entregas hay en total).
- Check verde ✓: no falta ninguna ("Todo corregido", o "Sin entregas" si nadie ha entregado todavía).
- Al pinchar en la línea se abre la lista de entregas de esa tarea.

Solo se tienen en cuenta las tareas (no cuestionarios, foros, etc.).

## Instalación

1. Descarga la extensión: botón verde **Code** → **Download ZIP**, y descomprime el archivo.
2. Abre `chrome://extensions`.
3. Activa **Modo de desarrollador** (arriba a la derecha).
4. Pulsa **Cargar descomprimida** y elige la carpeta descomprimida (la que contiene `manifest.json`).
5. Recarga la página del curso en Aules.

No borres ni muevas la carpeta después: Chrome carga la extensión desde ahí.

Para actualizarla, descarga de nuevo el ZIP, sustituye la carpeta y pulsa el botón de recargar de la extensión en `chrome://extensions`.

## Cómo funciona

Para cada tarea del curso, la extensión abre en segundo plano su página (`mod/assign/view.php?id=…`) con tu sesión de Aules y lee la fila **Pendientes por calificar** del sumario de calificaciones, que es el mismo número que ves al entrar en la tarea. Hace como mucho 4 peticiones a la vez. No envía datos a ningún sitio fuera de Aules.

Si vuelves a la pestaña del curso después de corregir en otra pestaña, los números se actualizan solos (como mucho una vez cada 30 segundos).

Funciona en cualquier subsitio de Aules (`/semipresencial/`, `/docent/`…) y también con el modo de edición activado. Si entras como alumno no se muestra nada, porque esa información solo la ve el profesorado.
