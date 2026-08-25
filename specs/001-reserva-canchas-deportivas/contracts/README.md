# Contratos

**Fase 1** · 2026-08-24 · [plan.md](../plan.md) · [research.md](../research.md)

Los contratos son la mitad del trabajo de esta feature, porque el frontend y el backend avanzan a
ambos lados de ellos: las ocho pantallas ya existen y esperan datos; los servicios todavía no
existen y tienen que producirlos. Estos documentos son lo que permite que ambas cosas ocurran en
paralelo, y son la entrada del trabajo, no su resumen.

| Archivo | Servicio | Puerto | Rutas |
|---|---|---|---|
| [auth-usuarios.yaml](./auth-usuarios.yaml) | `ms-usuarios` | 8081 | `/api/auth/**`, `/api/usuarios/**` |
| [canchas.yaml](./canchas.yaml) | `ms-canchas` | 8082 | `/api/canchas/**` |
| [reservas.yaml](./reservas.yaml) | `ms-reservas` | 8083 | `/api/reservas/**` |
| [reportes.yaml](./reportes.yaml) | `ms-reportes` | 8084 | `/api/reportes/**` |

Todos se publican además como Swagger UI en `/swagger-ui.html` de cada servicio, generado por
springdoc-openapi 3.0.2 a partir de las anotaciones sobre los controladores. El contrato escrito aquí
y el Swagger generado tienen que decir lo mismo: si divergen, manda este documento hasta que alguien
lo enmiende.

## Cómo viaja una petición

```text
navegador → edge (:80) → gateway (:8080) → microservicio (:808x) → su base
              │              │
              │              └─ verifica la credencial, escribe X-User-Id y X-User-Role
              └─ mismo origen para todo: shell, remotes y /api
```

El navegador solo conoce `http://localhost`. Nunca llama al puerto de un microservicio, ni en
desarrollo: el servidor de desarrollo del shell ya reenvía `/api` al gateway.

## Autenticación y autorización

Autenticación **HTTP Basic**, verificada por el gateway en cada petición (R-003).

- El cliente envía `Authorization: Basic base64(username:password)` en toda petición a `/api/**`,
  salvo las dos rutas públicas: `POST /api/auth/login` y `POST /api/auth/registro`.
- El gateway verifica la credencial contra `ms-usuarios` y, si es válida y la cuenta está activa,
  reenvía la petición añadiendo dos cabeceras:

  | Cabecera | Contenido |
  |---|---|
  | `X-User-Id` | Identificador numérico del usuario autenticado |
  | `X-User-Role` | `USUARIO_FINAL` o `ADMINISTRADOR` |

- **El gateway elimina cualquier cabecera `X-User-*` que venga del cliente antes de escribir las
  suyas.** Es lo que hace segura la confianza entre gateway y microservicios: un microservicio cree
  lo que dice `X-User-Id` precisamente porque nadie más puede escribirla.
- Los microservicios no reciben nunca las credenciales del usuario y no vuelven a autenticar. Leen
  las dos cabeceras y aplican RN-03 y RN-07 sobre ellas.
- Una cuenta inactiva falla la verificación: **401**, y la petición no llega al microservicio.

## Vocabulario

Valores canónicos, idénticos en la base de datos, en el contrato y en el frontend:

| Concepto | Valores | Decisión |
|---|---|---|
| Rol | `USUARIO_FINAL` · `ADMINISTRADOR` | R-001 |
| Estado de reserva | `CONFIRMADA` · `CANCELADA` · `FINALIZADA` | R-007 |
| Deporte | `PADEL` · `TENIS` · `BASQUET` | R-008 |

Enumeraciones cerradas: un valor fuera de la lista se rechaza con **400**, no se acepta como texto
libre.

## Formatos

| Dato | Formato | Ejemplo |
|---|---|---|
| Fecha | `date` ISO-8601 | `2026-09-15` |
| Hora | `HH:mm`, 24 h | `19:00` |
| Instante | `date-time` ISO-8601, hora local de la instalación | `2026-09-15T19:00:00` |
| Identificador | entero de 64 bits | `42` |

Una sola zona horaria en todo el sistema, la local de la instalación (supuesto del spec). No hay
paginación en ningún listado: la escala es de un club y añadirla sería complejidad sin criterio de
rúbrica que la respalde.

## Cuerpo de error

**Uniforme en los cuatro servicios.** Lo produce el `ErrorHandler` de `adapter/in/web/`, que es el
único punto donde una excepción de dominio se convierte en código HTTP. Las excepciones de
`domain/exception/` no llevan `HttpStatus` (Principio III).

```json
{
  "timestamp": "2026-09-15T18:42:11",
  "status": 409,
  "error": "Conflict",
  "message": "El bloque 19:00-20:00 de la cancha 3 ya está reservado",
  "path": "/api/reservas"
}
```

Nunca un `200` con un campo `error` dentro (Principio VI).

## Catálogo de códigos

| Código | Cuándo | Excepción de dominio | Regla |
|---|---|---|---|
| **200** | Consulta resuelta | — | |
| **201** | Recurso creado — reserva, cancha, usuario | — | |
| **204** | Operación sin cuerpo de respuesta — cambio de estado | — | |
| **400** | Cuerpo inválido, enumeración fuera de lista, rango de fechas invertido | `jakarta.validation` | FR-044 |
| **401** | Credenciales ausentes, inválidas, o cuenta inactiva | `InvalidCredentialsException` | FR-003, FR-005 |
| **403** | Autenticado pero el rol no permite la operación | `ForbiddenOperationException` | RN-03, RN-07 · FR-006 |
| **404** | Cancha, reserva o usuario inexistente | `NotFoundException` | |
| **409** | **Bloque horario ya ocupado** | `SlotAlreadyBookedException` | **RN-02** |
| **409** | Tope de reservas activas alcanzado | `ActiveBookingLimitExceededException` | RN-06 |
| **409** | Cancelación de una reserva ya iniciada | `PastBookingCancellationException` | RN-04 |
| **409** | Registro con un `username` ya existente | `UserAlreadyExistsException` | FR-002 |
| **422** | La cancha existe pero está inactiva, o el bloque cae fuera de su horario | `CourtNotBookableException` | FR-011, FR-016 |
| **503** | Un servicio del que depende un reporte no responde | `UpstreamUnavailableException` | |

Tres precisiones que evitan discusiones durante la implementación:

- **403 frente a 401.** 401 significa "no sé quién eres"; 403, "sé quién eres y no puedes". Cancelar
  la reserva de otro es 403, no 404: fingir que no existe oculta el motivo real y complica depurar.
- **409 frente a 422.** 409 es un conflicto con el estado actual del sistema que puede desaparecer
  solo —el bloque puede liberarse—. 422 es una petición que no va a funcionar por reintentar: la
  cancha está inactiva o el bloque no existe en su horario.
- **El 409 de RN-02 llega por dos caminos** y con el mismo cuerpo en ambos: la comprobación previa
  de `BookingService`, que cubre el caso normal, y la restricción `EXCLUDE` de PostgreSQL traducida
  por `BookingRepositoryAdapter`, que cubre la carrera entre dos peticiones simultáneas (R-004). El
  cliente no puede distinguirlos, y no debe.

## Qué pantalla consume qué

Es el mapa del trabajo de frontend: hoy cada una de estas pantallas se alimenta de un arreglo fijo
declarado en su propio archivo.

| Pantalla | Archivo | Consume |
|---|---|---|
| Login | `shell/src/pages/Login.tsx` | `POST /api/auth/login` |
| Registro | `shell/src/pages/Login.tsx` | `POST /api/auth/registro` |
| Perfil (solo lectura, R-006) | `shell/src/pages/Perfil.tsx` | nada: usa la prop `sesion` |
| Disponibilidad | `mf-reservas/src/pages/Disponibilidad.tsx` | `GET /api/canchas` · `GET /api/reservas/disponibilidad` |
| Nueva reserva | `mf-reservas/src/pages/NuevaReserva.tsx` | `POST /api/reservas` (409 visible en pantalla) |
| Mis reservas | `mf-reservas/src/pages/MisReservas.tsx` | `GET /api/reservas/mias` · `POST /api/reservas/{id}/cancelacion` |
| Gestión de canchas | `mf-administracion/src/pages/GestionCanchas.tsx` | `GET/POST/PUT /api/canchas` · `PATCH /api/canchas/{id}/estado` · `/api/canchas/{id}/bloqueos` |
| Gestión de reservas | `mf-administracion/src/pages/GestionReservas.tsx` | `GET /api/reservas` · `POST /api/reservas/{id}/cancelacion` |
| Gestión de usuarios | `mf-administracion/src/pages/GestionUsuarios.tsx` | `GET /api/usuarios` · `PATCH /api/usuarios/{id}/estado` |
| Panel del administrador | `mf-administracion/src/pages/Panel.tsx` | `/api/reportes/**` acotado al día en curso (R-005) |
| Reportes | `mf-reportes/src/pages/ReportesYEstadisticas.tsx` | los cuatro indicadores de `/api/reportes/**` |
