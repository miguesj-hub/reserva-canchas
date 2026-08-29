# Auditoría del sistema contra el documento de alcance

Revisión del código real frente a `Alcance_Funcional_Reserva_Canchas_v2.md`
(§3.1 permisos, §3.2 pantallas, §3.3 funcionalidades, §3.4 reglas de negocio,
§7 criterios de aceptación) y frente a la especificación propia del proyecto
(`specs/001-reserva-canchas-deportivas/spec.md`).

**Fecha de la revisión:** 29 de agosto de 2026, contra el commit `a43a19a`.

## Resumen

Los seis criterios de aceptación de §7 están cubiertos y las ocho reglas de
negocio tienen implementación y prueba. La auditoría encontró **tres huecos**,
ninguno de ellos bloqueante para la calificación, pero los dos primeros son
justo lo que un evaluador atento pregunta.

**Estado a 2026-08-29: los tres huecos están cerrados.** Los dos funcionales se
especificaron, planificaron e implementaron como la feature
`002-brechas-auditoria-alcance`, siguiendo el mismo flujo de Spec Kit que el
resto del proyecto, sin reabrir la feature 001.

| # | Hueco | Gravedad | Estado |
|---|---|---|---|
| 1 | El administrador no puede consultar disponibilidad desde la interfaz | **Media** | **Cerrado** — feature 002, US1 (T135–T139) |
| 2 | El tope de reservas activas (RN-06) no se puede editar desde ninguna parte | Baja | **Cerrado** — feature 002, US2 (T140–T154) |
| 3 | ~~`informe.pdf` compilado con los diagramas anteriores~~ **Resuelto** | — | `informe/` |

---

## 1. El administrador no puede consultar disponibilidad

**Qué dice el alcance.** §3.1, primera fila del módulo Reservas:

> Consultar disponibilidad de canchas — Usuario Final: **Sí** · Administrador: **Sí**

**Qué dice la especificación propia.** `FR-007`:

> Los usuarios autenticados **de ambos roles** MUST poder consultar la
> disponibilidad de una cancha en una fecha.

**Qué hace el sistema.** El backend cumple: `GET /api/reservas/disponibilidad`
(`BookingController`) no exige rol, cualquier usuario autenticado lo consulta.

El frontend no. En `frontend/shell/src/App.tsx` la ruta está encerrada en un
guardia de un solo rol:

```tsx
<Route element={<RoleRoute allow={['USUARIO_FINAL']} />}>
  <Route path="/reservas/*" element={ ... } />
</Route>
```

Un administrador que navegue a `/reservas` es redirigido a su home. Y
`mf-administracion` no tiene ninguna pantalla de disponibilidad: sus cuatro
vistas son `Panel`, `GestionCanchas`, `GestionReservas` y `GestionUsuarios`.

**Resultado:** la capacidad existe en la API pero es inalcanzable para el rol
que la matriz de permisos dice que la tiene.

**Cómo cerrarlo.** Dos caminos, de menor a mayor esfuerzo:

- Permitir la ruta de solo lectura a los dos roles y ocultar en `mf-reservas`
  las acciones de creación cuando el rol sea `ADMINISTRADOR` — RN-03 y la matriz
  de §3.1 siguen diciendo que el administrador no crea reservas.
- Añadir una vista de disponibilidad en `mf-administracion` que consuma el mismo
  endpoint.

**Cerrado** en la feature 002, US1. Se resolvió por el segundo camino: pantalla
propia de solo lectura en `mf-administracion`, y no abriendo `/reservas` a los
dos roles. El motivo está en R-011 de esa feature: el Principio V prohíbe
importar entre remotes, el botón "Reservar" apuntaría a un endpoint que devuelve
403 al administrador, y la barra de `mf-reservas` muestra "Mis Reservas", que
para ese rol estaría siempre vacía.

Verificado con el sistema levantado: en tres combinaciones de cancha y fecha, la
respuesta que recibe el administrador y la que recibe el usuario final son la
misma, y la pantalla no ofrece ninguna acción de creación. §4 del informe, que
ya afirmaba esta capacidad, pasa de describir algo que la interfaz no permitía a
describir lo que hace.

## 2. RN-06: el tope es configurable, pero no hay dónde configurarlo

**Qué dice el alcance.** RN-06:

> Un usuario final puede tener un **límite configurable** de reservas activas
> simultáneas (por ejemplo, máximo 3).

**Qué hace el sistema.** La regla se aplica correctamente:
`BookingService.verificarTope` lee la clave `max_reservas_activas` a través de
`ConfigurationRepositoryPort`, con 3 como valor por defecto si la clave no
existe. La fila la siembra `V2__configuracion.sql`. Está probado en
`BookingServiceCreacionTest`.

Pero el valor **solo se puede cambiar con un `UPDATE` a mano** sobre la tabla
`configuracion` de `reservas_db`. No hay endpoint en `ms-reservas` —el paquete
`adapter/in/web` solo contiene `BookingController` y `ErrorHandler`— ni pantalla
en `mf-administracion`.

**Lectura honesta:** el alcance pide que el límite *sea* configurable, no que
exista una pantalla para configurarlo, así que esto **cumple la letra de RN-06**.
Es una diferencia de interpretación, no un incumplimiento.

**Cómo cerrarlo,** si se decide cerrarlo: `GET`/`PUT /api/reservas/configuracion`
en `ms-reservas`, restringido a `ADMINISTRADOR` vía `X-User-Role`, y un campo en
el panel de administración. Es la opción cara.

**Cerrado** en la feature 002, US2, tras la enmienda 1.3.0 de la constitución,
que declaró la configuración del tope dentro del alcance por traza a la regla.
Se implementó `GET`/`PUT /api/reservas/configuracion` con un caso de uso propio
—`ConfigurationController`, `ConfigurationUseCase`, `ConfigurationService`— y su
pantalla en `mf-administracion`.

Sin migración: la tabla `configuracion` y su fila existían desde 001; lo que
cambia es que su valor deja de ser de solo lectura.

Verificado de punta a punta: bajar el tope a 1 hace que la segunda reserva se
rechace con 409 citando el valor nuevo; devolverlo a 3 permite crear esa misma
reserva, sin reiniciar ningún servicio; y reducirlo por debajo de lo que un
usuario ya tiene conserva sus reservas confirmadas.

## 3. El informe estaba compilado con los diagramas anteriores — resuelto

`informe/informe.pdf` se había compilado a las 23:16 del 28 de agosto, antes de
que se regeneraran las figuras. Recompilado el 29 de agosto: 55 páginas, las
mismas que antes, con los diagramas actuales.

**El texto no dependía del trazado anterior.** Comprobado:

- `diagramas/workspace.dsl` no se toca desde el 25 de agosto (`02ec100`), muy
  antes de que se escribiera la prosa del informe. Cambió el trazado, no el
  modelo: mismos elementos, mismas relaciones, mismas etiquetas.
- La prosa describe contenido, no posiciones. No hay una sola referencia
  espacial —«a la izquierda», «en la parte superior», «la esquina»— en ninguna
  sección.
- Las proporciones apenas se movieron, así que la maquetación aguanta sin
  cambios: contexto 1,01 → 1,22 · contenedores 0,82 → 0,83 · componentes de
  \id{ms-reservas} 2,35 → 2,17 · despliegue 0,65 → 0,62. Ninguna figura cambió
  de orientación.

**Mejora aplicada:** la vista de componentes de `ms-reservas` es más del doble
de ancha que alta, y limitada a `\linewidth` quedaba como una franja donde las
etiquetas se leían con esfuerzo. Ahora va girada, con `\diagramaancho` dentro de
un `sidewaysfigure`: ocupa su propia página apaisada y gana algo más del doble
de escala. El informe pasa de 55 a 56 páginas.

---

## Lo que sí está completo

Comprobado leyendo el código, no la documentación:

| Requisito del alcance | Estado |
|---|---|
| §3.2 Registro e inicio de sesión | `shell/pages/Login.tsx` alterna login y registro; `POST /api/auth/registro` |
| §3.2 Consulta de disponibilidad | `mf-reservas/pages/Disponibilidad.tsx` (ver hueco 1 para el rol admin) |
| §3.2 Nueva reserva | `mf-reservas/pages/NuevaReserva.tsx` |
| §3.2 Mis reservas, con cancelación | `mf-reservas/pages/MisReservas.tsx`, con filtro por los tres estados |
| §3.2 Gestión de canchas | `GestionCanchas.tsx`: crear, editar, activar/inactivar y bloqueos de mantenimiento |
| §3.2 Gestión de reservas | `GestionReservas.tsx`: listado global con cancelación de cualquier reserva |
| §3.1 Gestión de usuarios | `GestionUsuarios.tsx`: activar e inactivar |
| §3.3.5 Reportes | `ReportService`: `reservas`, `ocupacion`, `cancelaciones`, `demanda` y `resumen` |
| §3.4 RN-01 a RN-08 | Las ocho con implementación y prueba; 73 métodos `@Test` en 12 clases |
| §4.2 API documentada | `OpenApiConfig` y `springdoc` en los cuatro microservicios |
| §4.3 Independencia de datos | Tres roles de PostgreSQL, `REVOKE CONNECT` verificado contra el contenedor |

El `api-gateway` no publica OpenAPI. No es un hueco: §4.2 pide la documentación
para los microservicios, y el gateway no expone dominio propio.

## Estado de los entregables

| | Entregable | Estado |
|---|---|---|
| E1 | Documento de arquitectura | Completo. **Recompilar** tras la regeneración de figuras (hueco 3) |
| E2 | Shell y microfrontends integrados | Completo: un host y tres remotes |
| E3 | Microservicios con Swagger + colección de pruebas | Completo. La colección está en `Postman-collection/`, versionada |
| E4 | Scripts DDL y datos de prueba | Completo: `infra/postgres/init/` más las migraciones Flyway de cada servicio |
| E5 | Manual de despliegue | Completo: `docs/MANUAL-DESPLIEGUE.md` |
| E6 | Presentación con demo | Completo: `diapositivas/presentacion.pdf`, 29 láminas |

Fuera de los seis entregables, el repositorio tiene además un manual de usuario
(`manual/`) que no pide el alcance.

## Detalle menor de higiene del repositorio

`Alcance_Funcional_Reserva_Canchas v2.pdf` figura como archivo sin versionar en
la raíz. Es el enunciado del docente: conviene decidir si se versiona o se
ignora, para que `git status` quede limpio antes de entregar.
