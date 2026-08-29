# Pomodoro + Tareas

Una app web sencilla que combina un temporizador Pomodoro con una lista de tareas, para ayudarte a concentrarte y llevar el control de tu trabajo.

## Características

- **Temporizador Pomodoro** con tres modos: Enfoque (25 min), Descanso corto (5 min) y Descanso largo (15 min).
- **Lista de tareas**: añade, marca como completadas o elimina tareas.
- **Tarea activa**: selecciona en qué tarea estás trabajando durante cada sesión de enfoque.
- **Contador de pomodoros**: cada tarea acumula los pomodoros completados mientras estaba activa, y se lleva la cuenta total del día.
- **Ciclo automático**: tras completar 4 pomodoros de enfoque, el siguiente descanso es largo; el resto son cortos.
- **Aviso sonoro** al finalizar cada sesión.
- **Persistencia local**: el estado (modo, tareas, contador del día) se guarda en `localStorage`, por lo que se conserva al recargar la página.

## Cómo usarlo

No requiere instalación ni dependencias. Basta con abrir [`index.html`](index.html) en tu navegador.

## Tecnología

HTML, CSS y JavaScript puro (sin frameworks ni build step).
