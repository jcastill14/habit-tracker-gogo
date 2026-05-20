# Habit Tracker Gogo 🎯

Una app web progresiva (PWA) para trackear tus hábitos diarios con notificaciones, historial y reportes.

## Funcionalidades

- **Vista semanal** con círculos de días para marcar hábitos completados
- **Navegación entre semanas** (semana actual y anteriores)
- **Notificaciones push** configurables:
  - Recordatorio diario a la hora que elijas
  - Recordatorio de fin del día si no completaste el hábito
  - Alerta si el hábito no se completa después de X días seguidos
- **Metas semanales** personalizables por hábito
- **Historial completo** con vista de calendario de los últimos 6 meses
- **Reporte general** con tasa de cumplimiento por hábito, racha actual, total completados
- **Export/Import** de datos (JSON) para backup y transferencia entre dispositivos
- Funciona desde cualquier dispositivo (responsive, PWA instalable)

## Instalación y uso local

```bash
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000)

## Build para producción

```bash
npm run build
```

El build se genera en `/build`. Sube esa carpeta a cualquier hosting estático:
- **Netlify**: Arrastra la carpeta `build` a netlify.com
- **Vercel**: `vercel --prod` desde la raíz
- **GitHub Pages**: usa `gh-pages` package

## Notas sobre notificaciones

Las notificaciones funcionan mientras el navegador esté abierto (scheduler basado en setTimeout). Para notificaciones verdaderas en background (cuando el navegador está cerrado) se requiere un servidor de push (FCM/VAPID), lo cual requiere backend. La app está preparada con el Service Worker listo para esto.

## Cross-device sync

La app guarda datos en `localStorage` del dispositivo. Para sincronizar entre dispositivos:
1. Ve a **Reporte** > **Exportar datos**
2. En el otro dispositivo: **Ajustes** > **Importar backup**

## Tech stack

- React 18
- React Router v6
- date-fns
- CSS custom properties (sin librerías de UI)
- Service Worker para PWA/notificaciones
