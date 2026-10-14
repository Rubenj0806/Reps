# Reps · Diario de entrenamiento

Aplicación web para registrar entrenamientos de gimnasio: creas tus rutinas, apuntas cada serie mientras entrenas, descansas con un temporizador y ves cómo evolucionan tus marcas con gráficas.

**👉 Pruébala: [rubenj0806.github.io/Reps](https://rubenj0806.github.io/Reps/)**

La primera vez se carga con seis semanas de datos de ejemplo para que se vea cómo funciona. Se pueden borrar con un botón y empezar desde cero.

## Qué puedes hacer

- **Rutinas:** crea plantillas con ejercicios, series, repeticiones y tiempo de descanso. Reordena y edita con controles pensados para el móvil.
- **Entreno en curso:** al empezar, cada ejercicio propone automáticamente **los pesos de la última vez**. Marcas cada serie al terminarla y arranca el descanso.
- **Temporizador de descanso:** cuenta atrás con aviso por **vibración y sonido**, y botones de ±15 s.
- **Récords:** al terminar, la app detecta si has superado tu mejor marca en algún ejercicio.
- **Progreso:** gráfica por ejercicio con **1RM estimado**, peso máximo o volumen, con vista de tabla accesible.
- **Historial** agrupado por meses y **catálogo** de 33 ejercicios con buscador (sin importar tildes) y filtro por músculo.
- **Se instala en el móvil** como una app y **funciona sin conexión** (PWA).
- **Guía de bienvenida** la primera vez que se abre, que explica cada sección.
- **Tema claro y oscuro**, adaptado a móvil y escritorio.

## Tecnologías

| | |
|---|---|
| Interfaz | React 19 con TypeScript (modo estricto) |
| Compilación | Vite |
| Estado | `useReducer` + Context, sin librerías externas |
| Gráficas | SVG propio, sin librerías |
| Tests | Vitest |
| Publicación | GitHub Actions → GitHub Pages |

## Decisiones técnicas

- **Lógica separada de la interfaz.** Todos los cálculos (1RM, volumen, récords, rachas por semana) están en `src/lib/stats.ts` como funciones puras, sin React. Así se pueden testear de forma aislada.
- **Un reducer para todo el estado.** Cada cambio (marcar una serie, terminar un entreno…) es una acción con tipo en `src/state/reducer.ts`. TypeScript obliga a tratar todas las acciones, y el estado nunca se modifica directamente.
- **Datos guardados en el dispositivo** con `localStorage`, validando lo que se carga para que unos datos dañados no rompan la app.
- **1RM estimado con la fórmula de Epley** (`peso × (1 + reps / 30)`). En ejercicios sin peso, como las dominadas, el progreso se mide por repeticiones.
- **Gráficas hechas a mano en SVG:** escala con valores redondos, eje de tiempo proporcional y tooltip al tocar o pasar el ratón. Pesan mucho menos que una librería de gráficos.
- **Pensada para usarse en el gimnasio:** botones grandes, teclado numérico en los campos de peso y repeticiones, y coma decimal (62,5 kg).
- **PWA sin librerías:** `public/sw.js` guarda la página y los archivos que enlaza al instalarse. La página se pide primero a la red, para recibir las versiones nuevas, y sin conexión se usa la copia guardada. En Android sale un botón de instalar; en iPhone, las instrucciones de Safari.
- **Accesibilidad:** navegación con teclado, etiquetas para lectores de pantalla, vista de tabla para las gráficas y respeto a la opción de reducir animaciones.

## Estructura

```
src/
├── components/   Piezas reutilizables (gráficas, temporizador, modales…)
├── pages/        Una pantalla por archivo
├── state/        Reducer, datos de ejemplo y persistencia
├── lib/          Cálculos y formato, sin dependencias de React
├── hooks/        Rutas con hash, reloj y medidas
└── data/         Catálogo de ejercicios
```

## Ejecutar en local

```bash
npm install
npm run dev     # servidor de desarrollo
npm test        # tests
npm run build   # comprobación de tipos + versión de producción
```

## Próximos pasos

- [x] Instalable en el móvil como app (PWA) y uso sin conexión.
- [ ] Cuentas de usuario y sincronización entre dispositivos.
- [ ] Compartir rutinas con un enlace.

---

Hecho por **Ruben Medina** · [Portafolio](https://rubenj0806.github.io) · [LinkedIn](https://www.linkedin.com/in/ruben-medina-rodriguez)
