# Frontend — ReservaSport

Shell (host) + tres microfrontends (remotes), integrados con Module
Federation sobre Rsbuild. Para el detalle de cómo está armado el patrón de
microfrontends, ver [`GUIA-MODULE-FEDERATION.md`](./GUIA-MODULE-FEDERATION.md).
Para el inventario de pantallas, ver [`PANTALLAS.md`](./PANTALLAS.md).

## Estructura

| App | Puerto | Rol |
|---|---|---|
| `shell` | `3000` | Host: login, sesión, enrutamiento, monta los remotes |
| `mf-reservas` | `3001` | Remote: reservas del cliente |
| `mf-administracion` | `3002` | Remote: panel de administración |
| `mf-reportes` | `3003` | Remote: reportes y estadísticas (admin) |

## Requisitos

- Node ≥ 20 (referencia: v24.18.0)
- npm ≥ 10 (referencia: 11.16.0)

## Instalación

Cada app es un proyecto npm independiente: instala en las cuatro carpetas.

```bash
cd frontend/shell             && npm install && cd ../..
cd frontend/mf-reservas       && npm install && cd ../..
cd frontend/mf-administracion && npm install && cd ../..
cd frontend/mf-reportes       && npm install && cd ../..
```

## Levantar en desarrollo

Se necesitan **4 terminales**, una por app. Arranca primero los tres remotes
y al final el shell — si el shell arranca solo, al navegar a una sección no
encuentra su `remoteEntry.js`.

```bash
# terminal 1
cd frontend/mf-reservas && npm run dev

# terminal 2
cd frontend/mf-administracion && npm run dev

# terminal 3
cd frontend/mf-reportes && npm run dev

# terminal 4
cd frontend/shell && npm run dev
```

Abre **http://localhost:3000**.

Para apagar todo: `Ctrl+C` en cada terminal, o desde cualquier lado:

```bash
pkill -f rsbuild
```

## Acceso (credenciales de prueba)

El login todavía no está conectado a un backend real: valida contra una
lista fija de usuarios en `shell/src/auth/AuthContext.tsx`. Hay dos roles,
cada uno ve secciones distintas del menú lateral:

| Usuario | Contraseña | Rol | Qué ve |
|---|---|---|---|
| `cliente` | `cliente` | Cliente | `mf-reservas` — Mis reservas, Nueva reserva, Disponibilidad |
| `admin` | `admin` | Administrador | `mf-administracion` — Panel, Reservas, Usuarios, Canchas — y `mf-reportes` |

Si un cliente intenta entrar a una URL de administración (o viceversa), se lo
redirige automáticamente a la sección de su propio rol.

La sesión se guarda en `localStorage` (`reservasport_token` /
`reservasport_role`) y se pasa a cada remote como prop `token`. "Cerrar
Sesión" está disponible en el menú lateral de cada vista.

## Build de producción / Docker

Ver el paso 13 de [`GUIA-MODULE-FEDERATION.md`](./GUIA-MODULE-FEDERATION.md#paso-13--construir-para-producción-y-dockerizar)
y [`../DESPLIEGUE.md`](../DESPLIEGUE.md).
