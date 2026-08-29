# Feature Specification: Sistema de Reserva de Canchas Deportivas

**Feature Branch**: `001-reserva-canchas-deportivas`

**Created**: 2026-08-24

**Status**: Draft

**Input**: Especificación del sistema completo de reserva de canchas deportivas (pádel, tenis y básquet) para usuario final y administrador, derivada de `Alcance_Funcional_Reserva_Canchas_v2.md` §3.1 (permisos por rol), §3.2 (pantallas), §3.3 (detalle funcional), §3.4 (RN-01 a RN-08) y §7 (criterios de aceptación).

## User Scenarios & Testing *(mandatory)*

Cada historia es una rebanada vertical demostrable por sí sola: se ejercita desde la pantalla
hasta el dato persistido, sin que el evaluador tenga que imaginar las piezas que faltan. Ninguna
capa del sistema constituye una historia.

Las historias están priorizadas por los criterios de aceptación de §7, que es lo que se califica.
Los criterios §7.5 y §7.6 son estructurales y no producen historias: se satisfacen por la forma
en que se construyen las cuatro primeras. La Historia 5 no traza a §7 sino a RN-06, por la vía que
abre la constitución 1.3.0.

---

### User Story 1 - Reservar y cancelar una cancha como usuario final (Priority: P1)

Una persona que quiere jugar entra al sistema, se registra si es la primera vez, elige un deporte
y una cancha, mira qué bloques horarios están libres en la fecha que le interesa, reserva uno,
lo ve después en su listado de reservas, y puede cancelarlo si le cambian los planes.

El acceso al sistema —registro e inicio de sesión, módulo Seguridad de §3.2— forma parte de esta
rebanada y no de una historia aparte: sin una identidad y un rol no existen RN-03 (cancelar solo
lo propio) ni RN-06 (tope de reservas activas), y sin poder entrar no hay nada que demostrar.

**Why this priority**: Es el corazón del sistema y el criterio de aceptación §7.1 completo. La
rúbrica asigna 25% a "Alcance funcional implementado" y §6.1 fija el nivel Suficiente en "cumple
el alcance funcional mínimo (reserva, consulta y cancelación)". Sin esta historia no hay proyecto
que presentar; con ella sola ya hay una demostración de punta a punta.

**Independent Test**: Se demuestra completa sin ninguna otra historia, partiendo de un catálogo de
canchas precargado: registrarse, iniciar sesión, consultar la disponibilidad de una cancha de
pádel para mañana, reservar un bloque libre, verlo aparecer ocupado al volver a consultar,
encontrarlo en "Mis reservas", cancelarlo, y ver el bloque libre otra vez. Cubre §7.1 y §7.3.

**Acceptance Scenarios**:

1. **Given** una persona sin cuenta, **When** se registra con sus datos y una contraseña, **Then**
   queda creada como usuario final activo y puede iniciar sesión con esas credenciales.
2. **Given** un usuario final autenticado, **When** selecciona una cancha activa y una fecha,
   **Then** ve todos los bloques horarios dentro del horario de atención de esa cancha, cada uno
   marcado como libre u ocupado.
3. **Given** un bloque libre en una cancha activa, **When** el usuario final lo reserva, **Then**
   la reserva queda confirmada, asociada a él, y ese bloque pasa a mostrarse ocupado para cualquier
   usuario que consulte la misma cancha y fecha.
4. **Given** un bloque ya ocupado por otra reserva confirmada, **When** el usuario final intenta
   reservarlo, **Then** el sistema rechaza la operación, explica que el bloque no está disponible,
   y no se crea ninguna reserva (RN-02).
5. **Given** dos usuarios finales distintos que envían la solicitud de reserva sobre la misma
   cancha, fecha y bloque en el mismo instante, **When** ambas llegan al sistema, **Then**
   exactamente una queda confirmada y la otra es rechazada con la explicación de que el bloque
   acaba de ocuparse; en ningún caso quedan dos reservas confirmadas sobre el mismo bloque (RN-02).
6. **Given** un usuario final que ya alcanzó el tope de reservas activas simultáneas, **When**
   intenta crear una más, **Then** el sistema la rechaza e indica cuál es el tope y cuántas tiene
   activas (RN-06).
7. **Given** un usuario final con reservas creadas, **When** abre "Mis reservas", **Then** ve
   únicamente las suyas, cada una con su cancha, fecha, bloque horario y estado.
8. **Given** una reserva propia confirmada cuya hora de inicio aún no ha ocurrido, **When** el
   usuario final la cancela, **Then** la reserva pasa a estado Cancelada y su bloque vuelve a
   ofrecerse como libre a cualquier usuario (RN-05).
9. **Given** una reserva propia cuya hora de inicio ya pasó, **When** el usuario final intenta
   cancelarla, **Then** el sistema lo impide y explica que no se cancelan reservas pasadas (RN-04).
10. **Given** una reserva que pertenece a otro usuario, **When** un usuario final intenta
    cancelarla, **Then** el sistema lo impide por falta de permiso y la reserva permanece
    confirmada (RN-03).
11. **Given** un bloque liberado por una cancelación, **When** otro usuario final consulta esa
    cancha y fecha, **Then** el bloque aparece libre y puede reservarlo con éxito (RN-05).

---

### User Story 2 - Administrar el catálogo de canchas y cancelar cualquier reserva (Priority: P2)

El administrador mantiene el catálogo con el que trabaja todo el sistema: da de alta canchas de
pádel, tenis y básquet, define su horario de atención, corrige datos, e inactiva las que dejan de
prestar servicio. Registra bloqueos de mantenimiento sobre una cancha para que nadie pueda
reservarla en ese lapso. Y desde un listado global de reservas puede cancelar cualquiera del
sistema, por ejemplo cuando un mantenimiento imprevisto deja una cancha fuera de servicio.

**Why this priority**: Es el criterio de aceptación §7.2 completo. Sin catálogo administrable, las
canchas de la Historia 1 son datos fijos que alguien cargó a mano, y el rol de administrador —la
mitad de §3.1— no tiene nada que demostrar. La cancelación administrativa es además la contraparte
de RN-03 que distingue los dos roles.

**Independent Test**: Con la Historia 1 en pie, se demuestra sola: crear una cancha de básquet con
horario 07:00–22:00, verla aparecer disponible para un usuario final, editarle el horario y ver
cambiar los bloques ofrecidos, inactivarla y comprobar que deja de ofrecerse, registrar un bloqueo
de mantenimiento y comprobar que sus bloques no se pueden reservar, cancelar desde el listado
global la reserva de otro usuario, y consultar la disponibilidad de una cancha sin poder reservar
ninguno de sus bloques. Cubre §7.2.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea una cancha indicando nombre, deporte
   (pádel, tenis o básquet), horario de atención y estado activo, **Then** la cancha queda
   disponible y sus bloques horarios aparecen en la consulta de disponibilidad de cualquier
   usuario (RN-07).
2. **Given** una cancha existente, **When** el administrador edita su nombre, su deporte o su
   horario de atención, **Then** los cambios se reflejan en la consulta de disponibilidad, que
   pasa a ofrecer los bloques del nuevo horario.
3. **Given** una cancha activa, **When** el administrador la inactiva, **Then** deja de ofrecerse
   para nuevas reservas y no aparece en la consulta de disponibilidad, mientras que las reservas
   ya confirmadas sobre ella se conservan y siguen visibles para sus dueños.
4. **Given** un usuario final autenticado, **When** intenta crear, editar o inactivar una cancha,
   **Then** el sistema se lo impide por falta de permiso (RN-07).
5. **Given** una cancha activa, **When** el administrador registra un bloqueo de mantenimiento
   sobre un rango de fecha y horas, **Then** los bloques comprendidos dejan de ofrecerse como
   libres y ningún usuario puede reservarlos mientras el bloqueo esté vigente.
6. **Given** reservas creadas por varios usuarios finales, **When** el administrador abre el
   listado global de reservas, **Then** ve todas las del sistema con su cancha, fecha, bloque,
   usuario y estado, sin importar quién las creó.
7. **Given** una reserva confirmada de otro usuario cuya hora de inicio aún no ha ocurrido,
   **When** el administrador la cancela, **Then** pasa a estado Cancelada, su bloque queda libre, y
   el dueño la ve cancelada en "Mis reservas" (RN-03, RN-05).
8. **Given** cualquier reserva cuya hora de inicio ya pasó, **When** el administrador intenta
   cancelarla, **Then** el sistema lo impide: RN-04 aplica también al administrador.
9. **Given** un administrador autenticado, **When** consulta la disponibilidad de una cancha para
   una fecha, **Then** ve los mismos bloques libres y ocupados que vería un usuario final, y la
   pantalla no le ofrece acción de reservar, porque §3.1 no le atribuye la creación de reservas
   (FR-007).

---

### User Story 3 - Consultar los reportes de uso (Priority: P3)

El administrador abre el módulo de reportes, elige un rango de fechas, y ve cuánto se están usando
las canchas: cuántas reservas hubo por cancha y por deporte, qué porcentaje de su horario
disponible estuvo efectivamente reservado, cuántas cancelaciones hubo, y qué canchas son las más y
las menos demandadas.

**Why this priority**: Es el criterio de aceptación §7.4 y un criterio propio de la rúbrica
(10%, "datos consistentes respecto a las reservas registradas"). Va después de las historias 1 y 2
porque un reporte sin reservas ni catálogo no tiene nada que mostrar: depende de que existan datos
que reportar.

**Independent Test**: Con reservas registradas por las historias anteriores, se demuestra sola:
elegir un rango de fechas y verificar contra un conteo manual que los cuatro indicadores coinciden
con las reservas visibles en el listado global. Cubre §7.4.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado y un rango de fechas, **When** consulta el reporte de
   reservas, **Then** ve el número de reservas por cancha y el número por deporte dentro de ese
   rango, y los totales coinciden con las reservas registradas en ese rango.
2. **Given** un rango de fechas, **When** consulta la ocupación, **Then** ve, por cancha, el
   porcentaje de horas reservadas sobre las horas disponibles de su horario de atención en ese
   rango.
3. **Given** un rango de fechas con reservas canceladas, **When** consulta las cancelaciones,
   **Then** ve el número de cancelaciones ocurridas en ese período.
4. **Given** un rango de fechas con demanda desigual entre canchas, **When** consulta el ranking,
   **Then** ve el listado de canchas ordenado por demanda, identificando las de mayor y las de
   menor demanda.
5. **Given** un usuario final autenticado, **When** intenta acceder al módulo de reportes,
   **Then** el sistema se lo impide por falta de permiso.
6. **Given** un rango de fechas sin ninguna reserva, **When** el administrador consulta cualquiera
   de los cuatro indicadores, **Then** el sistema muestra el indicador en cero o vacío con un
   mensaje que lo explica, sin error.
7. **Given** cualquier reporte a la vista, **When** el administrador cancela una reserva
   comprendida en el rango y vuelve a consultar, **Then** los indicadores reflejan el cambio: una
   reserva menos y una cancelación más.

---

### User Story 4 - Gestionar el acceso de los usuarios (Priority: P4)

El administrador consulta los usuarios registrados y puede inactivar a quien ya no debe usar el
sistema, o reactivarlo después. Un usuario inactivo no puede entrar.

**Why this priority**: §3.1 atribuye "Gestionar usuarios (activar/inactivar)" al administrador, y
la constitución del proyecto la declara dentro del alcance implementado aunque §3.2 no la liste
como pantalla. Va al final porque no bloquea ninguna otra historia y no aparece en los criterios
de aceptación de §7: es alcance, pero es el alcance menos crítico.

**Independent Test**: Se demuestra sola: listar los usuarios, inactivar a un usuario final,
intentar iniciar sesión con sus credenciales y ser rechazado, reactivarlo, y volver a entrar con
éxito. Cubre la fila de gestión de usuarios de §3.1.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre la gestión de usuarios, **Then** ve los
   usuarios registrados con su rol y su estado (activo o inactivo).
2. **Given** un usuario final activo, **When** el administrador lo inactiva, **Then** queda
   marcado como inactivo y sus intentos de inicio de sesión son rechazados con un mensaje que
   indica que la cuenta está inactiva.
3. **Given** un usuario final inactivo, **When** el administrador lo activa, **Then** vuelve a
   poder iniciar sesión y usar el sistema con normalidad.
4. **Given** un usuario final con reservas confirmadas futuras, **When** el administrador lo
   inactiva, **Then** sus reservas se conservan y siguen ocupando sus bloques; no se cancelan
   automáticamente.
5. **Given** un usuario final autenticado, **When** intenta acceder a la gestión de usuarios,
   **Then** el sistema se lo impide por falta de permiso.

---

### User Story 5 - Configurar el tope de reservas activas (Priority: P5)

El administrador consulta cuántas reservas activas simultáneas puede tener un usuario final y
cambia ese número cuando la política del club cambia. El nuevo valor rige para las reservas que se
creen a partir de ese momento, sin reiniciar nada.

**Why this priority**: RN-06 exige que el límite sea "configurable", pero §3.1 no le da fila y §3.2
no le da pantalla. La constitución del proyecto (enmienda 1.3.0) lo declara dentro del alcance
implementado por traza a la regla, con el mismo criterio con el que ya declaró la gestión de
usuarios. Va en último lugar porque no bloquea ninguna otra historia y no aparece en los criterios
de aceptación de §7: sin ella, RN-06 sigue cumpliéndose con su valor por defecto.

**Independent Test**: Se demuestra sola, con la Historia 1 en pie: leer el tope vigente, bajarlo a
1, intentar crear una segunda reserva activa con un usuario final y ser rechazado citando el tope
nuevo, devolverlo a 3, y comprobar que la misma reserva ahora se confirma. Cubre RN-06.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre la configuración de reservas, **Then** ve
   el tope de reservas activas simultáneas vigente en el sistema.
2. **Given** un tope vigente de 3, **When** el administrador lo cambia a 1, **Then** el sistema
   confirma el cambio y un usuario final con una reserva activa que intenta crear otra es
   rechazado indicando que el tope es 1 y que ya tiene 1 activa (RN-06).
3. **Given** un tope recién reducido a 1 y un usuario final que ya tenía 3 reservas activas,
   **When** se consultan sus reservas, **Then** las 3 se conservan confirmadas y siguen ocupando
   sus bloques: el tope se evalúa al crear, no retroactivamente.
4. **Given** un administrador autenticado, **When** intenta fijar un tope de 0, negativo o no
   entero, **Then** el sistema rechaza el cambio, explica el valor admitido, y el tope anterior
   sigue vigente.
5. **Given** un usuario final autenticado, **When** intenta consultar o modificar el tope,
   **Then** el sistema se lo impide por falta de permiso.

---

### Edge Cases

- **Dos solicitudes simultáneas sobre el mismo bloque**: exactamente una se confirma; la otra
  recibe un rechazo explicado. Es el escenario central de RN-02 y se prueba explícitamente, no se
  asume.
- **Reserva sobre un bloque fuera del horario de atención**: el sistema no lo ofrece como
  disponible y lo rechaza si se solicita de todos modos.
- **Reserva sobre una fecha y hora ya pasadas**: se rechaza; solo se reserva hacia el futuro.
- **Reserva sobre una cancha inactiva o inexistente**: se rechaza, aunque el bloque esté libre.
- **Cancha inactivada con reservas futuras confirmadas**: las reservas se conservan; el
  administrador decide si las cancela una por una desde el listado global.
- **Tope de reservas activas reducido por debajo de lo que algún usuario ya tiene**: sus reservas
  se conservan y siguen ocupando sus bloques. El tope se evalúa al crear una reserva, nunca sobre
  las ya confirmadas; ese usuario simplemente no puede crear más hasta bajar del nuevo tope.
- **Bloqueo de mantenimiento que se solapa con reservas ya confirmadas**: el bloqueo impide nuevas
  reservas, pero no cancela las existentes; el administrador las cancela explícitamente.
- **Cancelación de una reserva ya cancelada**: la operación no tiene efecto y se informa que la
  reserva ya estaba cancelada.
- **Reserva cuyo bloque está en curso** (empezó pero no ha terminado): no se puede cancelar, porque
  su hora de inicio ya ocurrió (RN-04).
- **Usuario en el tope de reservas activas que cancela una**: recupera un cupo y puede volver a
  reservar (RN-05 con RN-06).
- **Reservas cumplidas y el tope**: una reserva ya finalizada no cuenta contra el tope de activas.
- **Rango de fechas invertido o vacío en reportes**: se informa el problema al administrador sin
  romper la pantalla.
- **Cancha sin ninguna reserva dentro del rango consultado**: aparece en el reporte con ocupación
  0% y como la de menor demanda, no se omite.
- **Sesión de un usuario inactivado mientras la tenía abierta**: sus siguientes operaciones son
  rechazadas y debe volver a autenticarse.
- **Registro con un identificador ya usado**: se rechaza indicando que ya existe una cuenta.

## Requirements *(mandatory)*

### Functional Requirements

**Acceso e identidad (§3.1, §3.2 módulo Seguridad)**

- **FR-001**: El sistema MUST permitir que una persona se registre creando una cuenta de usuario
  final activa, con las credenciales que usará para entrar.
- **FR-002**: El sistema MUST rechazar un registro cuyo identificador ya pertenezca a otra cuenta,
  indicando el motivo.
- **FR-003**: El sistema MUST autenticar a usuarios finales y administradores con sus credenciales,
  y MUST rechazar credenciales inválidas sin revelar cuál de los dos datos falló.
- **FR-004**: El sistema MUST reconocer exactamente dos roles —usuario final y administrador— y
  MUST resolver cada permiso según la tabla de §3.1.
- **FR-005**: El sistema MUST impedir el inicio de sesión de una cuenta inactiva, indicando que la
  cuenta está inactiva.
- **FR-006**: El sistema MUST rechazar toda operación que exceda los permisos del rol de quien la
  solicita, sin ejecutarla ni parcialmente.

**Consulta de disponibilidad (§3.3.1)**

- **FR-007**: Los usuarios autenticados de ambos roles MUST poder consultar la disponibilidad de
  una cancha para una fecha determinada.
- **FR-008**: El sistema MUST presentar, para esa cancha y fecha, todos los bloques horarios
  comprendidos en el horario de atención de la cancha, cada uno identificado como libre u ocupado.
- **FR-009**: El sistema MUST considerar ocupado un bloque que tenga una reserva confirmada, y
  libre uno cuya única reserva esté cancelada (RN-05).
- **FR-010**: El sistema MUST excluir de la disponibilidad los bloques comprendidos en un bloqueo
  de mantenimiento vigente.
- **FR-011**: El sistema MUST ofrecer únicamente canchas activas para nuevas reservas.

**Creación de reservas (§3.3.2, RN-01, RN-02, RN-06, RN-08)**

- **FR-012**: Un usuario final MUST poder crear una reserva sobre una cancha específica, una fecha
  y un bloque horario predefinido (RN-01).
- **FR-013**: El sistema MUST impedir la creación de una reserva sobre un bloque horario que ya
  tenga una reserva confirmada para la misma cancha, e informar el motivo del rechazo (RN-02).
- **FR-014**: Ante dos o más solicitudes concurrentes sobre la misma cancha, fecha y bloque, el
  sistema MUST confirmar exactamente una y rechazar las demás. El sistema MUST garantizar que en
  ningún momento existan dos reservas confirmadas sobre el mismo bloque de la misma cancha (RN-02).
- **FR-015**: El sistema MUST impedir que un usuario final supere un tope configurable de reservas
  activas simultáneas, informando el tope y su conteo actual al rechazar (RN-06).
- **FR-016**: El sistema MUST rechazar reservas sobre bloques fuera del horario de atención de la
  cancha, sobre canchas inactivas o inexistentes, y sobre fechas y horas ya transcurridas.
- **FR-017**: El sistema MUST registrar toda reserva creada en estado Confirmada (RN-08).
- **FR-018**: El sistema MUST impedir que un administrador cree reservas: §3.1 asigna esa acción
  únicamente al usuario final.

**Cancelación de reservas (§3.3.3, RN-03, RN-04, RN-05)**

- **FR-019**: Un usuario final MUST poder cancelar sus propias reservas y MUST NOT poder cancelar
  las de otros (RN-03).
- **FR-020**: Un administrador MUST poder cancelar cualquier reserva del sistema (RN-03).
- **FR-021**: El sistema MUST permitir cancelar únicamente reservas cuya fecha y hora de inicio no
  hayan ocurrido todavía, para ambos roles (RN-04).
- **FR-022**: Al cancelar, el sistema MUST cambiar el estado de la reserva a Cancelada y MUST
  liberar su bloque horario, dejándolo disponible para cualquier otro usuario (RN-05, RN-08).
- **FR-023**: El sistema MUST tratar una cancelación sobre una reserva ya cancelada como una
  operación sin efecto, informándolo, sin alterar el estado ni los reportes.
- **FR-024**: El sistema MUST descontar del conteo de reservas activas de un usuario toda reserva
  cancelada, devolviéndole el cupo (RN-05 con RN-06).

**Historial propio (§3.2 "Mis reservas")**

- **FR-025**: Un usuario final MUST poder consultar el listado de sus propias reservas con cancha,
  deporte, fecha, bloque horario y estado.
- **FR-026**: El listado de un usuario final MUST NOT incluir reservas de otros usuarios.

**Estados de la reserva (RN-08)**

- **FR-027**: Toda reserva MUST tener en todo momento exactamente uno de tres estados: Confirmada,
  Cancelada o Finalizada.
- **FR-028**: El sistema MUST considerar Finalizada una reserva confirmada cuyo bloque horario ya
  transcurrió por completo, y MUST NOT contarla como reserva activa ni permitir su cancelación.

**Gestión del catálogo de canchas (§3.3.4, RN-07)**

- **FR-029**: Un administrador MUST poder crear una cancha indicando nombre, deporte (pádel, tenis
  o básquet), horario de atención y estado.
- **FR-030**: Un administrador MUST poder editar los datos de una cancha existente, incluido su
  horario de atención.
- **FR-031**: Un administrador MUST poder inactivar y reactivar una cancha. Una cancha inactiva
  MUST NOT ofrecerse para nuevas reservas.
- **FR-032**: El sistema MUST conservar las reservas ya confirmadas sobre una cancha que se
  inactiva, sin cancelarlas automáticamente.
- **FR-033**: El sistema MUST impedir que un usuario final cree, edite o inactive canchas o defina
  horarios de atención (RN-07).
- **FR-034**: Un administrador MUST poder registrar bloqueos de mantenimiento sobre una cancha para
  un rango de fecha y horas, y MUST poder retirarlos.

**Gestión global de reservas (§3.2 "Gestión de reservas")**

- **FR-035**: Un administrador MUST poder consultar el listado de todas las reservas del sistema
  con su cancha, fecha, bloque horario, usuario y estado.
- **FR-036**: Un administrador MUST poder cancelar cualquier reserva desde ese listado, con las
  mismas restricciones temporales de FR-021.

**Reportes (§3.3.5) — los cuatro indicadores**

- **FR-037**: Un administrador MUST poder seleccionar un rango de fechas que acote todos los
  indicadores.
- **FR-038**: El sistema MUST presentar el número de reservas por cancha y el número de reservas
  por deporte dentro del rango seleccionado.
- **FR-039**: El sistema MUST presentar, por cancha, el porcentaje de ocupación, calculado como
  horas reservadas sobre horas disponibles del horario de atención de esa cancha dentro del rango.
- **FR-040**: El sistema MUST presentar el número de cancelaciones ocurridas dentro del rango.
- **FR-041**: El sistema MUST presentar el listado de canchas ordenado por demanda, identificando
  las de mayor y las de menor demanda dentro del rango.
- **FR-042**: Los cuatro indicadores MUST ser consistentes con las reservas registradas: un conteo
  manual sobre el listado global de reservas del mismo rango MUST arrojar los mismos números.
- **FR-043**: El módulo de reportes MUST ser de solo lectura y MUST estar disponible únicamente
  para el administrador.
- **FR-044**: El sistema MUST responder a un rango sin datos mostrando los indicadores en cero o
  vacíos con un mensaje explicativo, sin error.

**Gestión de usuarios (§3.1)**

- **FR-045**: Un administrador MUST poder consultar los usuarios registrados con su rol y su
  estado.
- **FR-046**: Un administrador MUST poder activar e inactivar usuarios.
- **FR-047**: El sistema MUST conservar las reservas de un usuario inactivado, sin cancelarlas
  automáticamente.
- **FR-048**: El sistema MUST impedir que un usuario final acceda a la gestión de usuarios.

**Configuración del tope de reservas activas (RN-06)**

- **FR-049**: Un administrador MUST poder consultar el valor vigente del tope de reservas activas
  simultáneas de un usuario final.
- **FR-050**: Un administrador MUST poder cambiar ese tope, y el valor nuevo MUST regir para las
  reservas que se creen a partir de ese momento, sin reiniciar ningún servicio ni redesplegar.
- **FR-051**: El sistema MUST rechazar un tope que no sea un entero mayor o igual a 1, explicando
  el valor admitido y dejando vigente el anterior.
- **FR-052**: El sistema MUST conservar las reservas activas que superen un tope recién reducido:
  el tope se evalúa al crear una reserva y nunca retroactivamente (ver Edge Cases).
- **FR-053**: El sistema MUST impedir que un usuario final consulte o modifique el tope.

### Key Entities

- **Usuario**: Persona que usa el sistema. Tiene credenciales, un rol y un estado (activo o
  inactivo). Es dueño de sus reservas.
- **Rol**: Usuario final o administrador. Determina qué acciones de §3.1 puede ejecutar.
- **Cancha**: Espacio reservable. Tiene nombre, un deporte (pádel, tenis o básquet), un horario de
  atención y un estado (activa o inactiva).
- **Horario de atención**: Franja diaria dentro de la cual una cancha puede reservarse; delimita
  qué bloques existen.
- **Bloque horario**: Unidad reservable de duración predefinida dentro del horario de atención de
  una cancha en una fecha. Es libre u ocupado.
- **Bloqueo de mantenimiento**: Lapso durante el cual una cancha no admite reservas, registrado por
  el administrador.
- **Reserva**: Vínculo entre un usuario, una cancha, una fecha y un bloque horario, con un estado
  (Confirmada, Cancelada o Finalizada) y la traza de cuándo se creó y cuándo se canceló.
- **Parámetro de configuración**: Valor ajustable sin cambiar el comportamiento del sistema; el
  único requerido es el tope de reservas activas simultáneas por usuario (RN-06).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona que no conoce el sistema completa el recorrido de registrarse, iniciar
  sesión, encontrar un bloque libre y confirmar una reserva en menos de 3 minutos, sin ayuda y sin
  instrucciones previas.
- **SC-002**: Los 6 criterios de aceptación de §7 se demuestran en vivo, uno tras otro, en una
  sesión de 15 minutos o menos.
- **SC-003**: Las 8 reglas de negocio RN-01 a RN-08 se demuestran en vivo, cada una con un caso que
  la cumple y un caso que la viola, y en los 8 casos de violación el sistema rechaza la operación
  con un mensaje que explica el motivo.
- **SC-004**: En 10 intentos consecutivos de reservar simultáneamente el mismo bloque desde dos
  sesiones distintas, en los 10 queda exactamente una reserva confirmada y una rechazada. En cero
  de los 10 quedan dos reservas confirmadas sobre el mismo bloque.
- **SC-005**: Un bloque liberado por una cancelación vuelve a aparecer como disponible en la
  siguiente consulta de disponibilidad de cualquier usuario, en menos de 5 segundos desde la
  cancelación.
- **SC-006**: Los cuatro indicadores de §3.3.5 coinciden al 100% con un conteo manual hecho sobre
  el listado global de reservas del mismo rango de fechas, verificado en al menos 3 rangos
  distintos.
- **SC-007**: Toda operación que un rol no tiene permitida según §3.1 es rechazada en el 100% de
  los intentos, incluidos los que se hacen sin pasar por la pantalla correspondiente.
- **SC-008**: La consulta de disponibilidad de una cancha para una fecha devuelve resultados en
  menos de 2 segundos con el sistema cargado con al menos 500 reservas.
- **SC-009**: Un usuario inactivado no logra iniciar sesión en el 100% de los intentos, y recupera
  el acceso inmediatamente después de ser reactivado.
- **SC-010**: Las tres canchas de los tres deportes —pádel, tenis y básquet— se pueden reservar y
  cancelar, demostrado con al menos una reserva completa por deporte.
- **SC-011**: Un cambio del tope de reservas activas hecho desde la interfaz de administración rige
  para la siguiente reserva que se intente crear, sin reiniciar ningún servicio, y el rechazo cita
  el valor nuevo.

## Fuera de Alcance

Lo que §3.5 excluye queda excluido sin excepción, y ninguna historia lo introduce por la puerta de
atrás:

- Pasarela de pagos o cobro en línea de las reservas.
- Notificaciones automáticas por correo electrónico, SMS o push. Los rechazos y confirmaciones se
  comunican en pantalla, en el momento.
- Reservas recurrentes o recurrencia de horarios.
- Gestión de torneos, ligas o inscripciones grupales.
- Aplicación móvil nativa. El sistema es web y responsive.
- Reportes analíticos, de inteligencia de negocio o exportación a formatos analíticos. Los reportes
  son los cuatro indicadores de §3.3.5, en pantalla.

Adicionalmente, y por no trazar a ninguna funcionalidad de §3.2 ni a ninguna RN, quedan fuera:
recuperación de contraseña por autoservicio, edición del perfil propio, lista de espera sobre
bloques ocupados, reprogramación de una reserva existente (se cancela y se crea otra), calificación
o comentarios sobre canchas, y cualquier pantalla de configuración de parámetros del sistema.

## Trazabilidad

| Historia | Criterio §7 | Funcionalidades §3 | Reglas de negocio |
| --- | --- | --- | --- |
| US1 — Reservar y cancelar (P1) | §7.1, §7.3 | §3.2 Seguridad, §3.3.1, §3.3.2, §3.3.3, §3.2 "Mis reservas" | RN-01, RN-02, RN-03, RN-04, RN-05, RN-06, RN-08 |
| US2 — Catálogo y cancelación administrativa (P2) | §7.2 | §3.3.4, §3.2 "Gestión de canchas", §3.2 "Gestión de reservas", §3.1 horarios y bloqueos, §3.3.1 (consulta del administrador) | RN-03, RN-04, RN-05, RN-07 |
| US3 — Reportes (P3) | §7.4 | §3.3.5 (los cuatro indicadores) | RN-08 |
| US4 — Gestión de usuarios (P4) | — | §3.1 fila "Gestionar usuarios" | — |
| US5 — Configuración del tope (P5) | — | RN-06 vía constitución 1.3.0 | RN-06 |

| Regla | Dónde se verifica |
| --- | --- |
| RN-01 — Reserva sobre cancha, fecha y bloque predefinido | US1 esc. 3; FR-012 |
| RN-02 — Sin solapamiento, incluido acceso concurrente | US1 esc. 4 y 5; FR-013, FR-014; SC-004 |
| RN-03 — Solo lo propio; el administrador, cualquiera | US1 esc. 10; US2 esc. 7; FR-019, FR-020 |
| RN-04 — No se cancela lo ya iniciado | US1 esc. 9; US2 esc. 8; FR-021 |
| RN-05 — Cancelar libera el bloque | US1 esc. 8 y 11; FR-022, FR-024 |
| RN-06 — Tope configurable de reservas activas | US1 esc. 6; US5 esc. 2 a 4; FR-015, FR-049 a FR-053; SC-011 |
| RN-07 — Solo el administrador gestiona canchas | US2 esc. 1 y 4; FR-029 a FR-033 |
| RN-08 — Tres estados de la reserva | US1 esc. 7; FR-017, FR-027, FR-028 |

## Assumptions

Decisiones tomadas por defecto donde el documento de alcance no es explícito. Cada una se eligió
por ser la lectura más simple compatible con §3 y con §3.5, y ninguna amplía el alcance.

- **Duración del bloque horario**: 1 hora, la franja que RN-01 da como ejemplo. Los bloques nacen
  en horas en punto dentro del horario de atención de la cancha.
- **Tope de reservas activas (RN-06)**: 3 por usuario final, el valor que RN-06 da como ejemplo. Es
  un parámetro del sistema ajustable por quien lo opera, no una pantalla de configuración: §3.2 no
  lista ninguna, y añadirla sería alcance nuevo.
- **Reserva activa**: una reserva en estado Confirmada cuyo bloque aún no ha transcurrido. Las
  Canceladas y las Finalizadas no cuentan contra el tope.
- **Transición a Finalizada**: automática por el paso del tiempo, cuando el bloque de una reserva
  confirmada termina. No requiere que nadie la marque.
- **Alta de administradores**: el registro público crea únicamente usuarios finales. Las cuentas de
  administrador se aprovisionan con los datos iniciales del sistema; §3.2 no contempla una pantalla
  para crear administradores.
- **Bloqueos de mantenimiento**: se administran desde la pantalla de gestión de canchas, que es
  donde §3.2 concentra la administración del catálogo. Impiden nuevas reservas pero no cancelan las
  existentes: §3.3.3 describe justamente que el administrador las cancele ante un mantenimiento
  imprevisto.
- **Conteo de "reservas por cancha y por deporte"**: cuenta las reservas Confirmadas y Finalizadas
  cuyo bloque cae dentro del rango. Las Canceladas se reportan aparte, en su propio indicador.
- **Conteo de "cancelaciones por período"**: cuenta las reservas que fueron canceladas dentro del
  rango consultado.
- **Denominador de la ocupación**: las horas del horario de atención de la cancha en **todos** los
  días del rango. No se descuentan los días en que la cancha estuviera inactiva: un supuesto previo
  decía lo contrario, pero descontarlos exigiría un histórico de activación que el modelo de datos
  no guarda, y ni FR-039 ni §3.3.5 lo piden. Una cancha inactiva aparece igualmente en el reporte,
  con la ocupación que tuvo.
- **Ranking de demanda**: se ordena por número de reservas no canceladas en el rango; las canchas
  sin reservas aparecen con cero y ocupan el extremo de menor demanda.
- **Zona horaria**: una sola, la local de la instalación. No hay usuarios en husos distintos.
- **Idioma**: una sola lengua en la interfaz, español. No hay internacionalización.
- **Volumen**: escala de un club —decenas de canchas, cientos de usuarios, miles de reservas—, no
  de una plataforma multi-sede.
- **Datos iniciales**: el sistema se entrega con canchas de los tres deportes, usuarios de ambos
  roles y reservas de ejemplo, para que las historias sean demostrables desde el primer
  arranque.
