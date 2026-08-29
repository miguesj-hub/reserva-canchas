---
description: "Task list for feature 003 — el chrome del frontend vive en el shell"
---

# Tasks: El chrome del frontend vive en el shell

**Input**: Design documents from `/specs/003-chrome-en-el-shell/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md)

**Tests**: sin pruebas automatizadas nuevas. No hay lógica de negocio: lo que hay
que demostrar —que el menú no se remonta al cambiar de microfrontend— se verifica
en un navegador real, y esas verificaciones son tareas con su propio identificador.

**Numeración**: continúa la de 002, que llegó a **T159**.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos)
- **[Story]**: US1, US2 o US3
- Toda tarea lleva su ruta exacta

---

## Phase 1: Setup · Phase 2: Foundational

**No aplican.** Ni proyecto que inicializar, ni dependencias nuevas, ni nada que
bloquee: el shell ya tiene Tailwind, los mismos tokens y las fuentes (R-012).

---

## Phase 3: User Story 1 — Navegar sin que se remonte la aplicación (P1) 🎯 MVP

**Goal**: el menú vive en el shell, montado una sola vez, y al pulsar una entrada
solo cambia el contenido central.

**Independent Test**: como administrador, ir de *Canchas* a *Reportes* —que cruza
de `mf-administracion` a `mf-reportes`— y comprobar que el menú no se remonta.

### Recorrido 1 — el shell aprende a pintar el chrome

- [ ] T160 [US1] Crear `frontend/shell/src/navegacion.ts` con la única definición de las entradas del menú: la lista del administrador (Dashboard, Reservas, Canchas, Disponibilidad, Usuarios, Configuración, Reportes) y la del socio (Mis Reservas, Disponibilidad), más `RUTAS_SIN_CHROME` con `/reservas/nueva` (FR-061, FR-062)
- [ ] T161 [US1] Crear `frontend/shell/src/components/Chrome.tsx` trasladando el marco desde los layouts de los remotes: barra lateral fija; en móvil, cabecera con menú desplegable para el administrador y barra inferior con la acción *Nueva* para el socio. Elige variante por `sesion.rol` y lee la sesión de `useAuth()` (FR-057, FR-058)
- [ ] T162 [US1] Reproducir en `Chrome.tsx` el envoltorio del contenido que hoy pone cada layout: `md:ml-64` en las dos variantes, y `p-container-margin` con el hueco inferior solo en la del socio, porque las páginas de administración ya traen el suyo
- [ ] T163 [US1] Envolver en `frontend/shell/src/App.tsx` las rutas autenticadas con `Chrome`, dejando fuera `/login`, y que `Chrome` entregue el contenido sin marco cuando la ruta esté en `RUTAS_SIN_CHROME`, sin duplicar el punto de montaje del remote (FR-059, FR-062)
- [ ] T164 [US1] Verificar en el navegador que el menú del shell aparece y navega, aunque de momento se vea duplicado con el de los remotes

**Checkpoint intermedio**: el menú del shell funciona; todavía convive con el de
los remotes.

### Recorrido 2 — los remotes se quedan solo con sus páginas

- [ ] T165 [P] [US1] Borrar `frontend/mf-administracion/src/components/Layout.tsx` y `CurtainTransition.tsx`, y dejar en su `App.tsx` solo las rutas de sus páginas (FR-060, FR-063)
- [ ] T166 [P] [US1] Lo mismo en `frontend/mf-reportes/src/`: borrar `components/Layout.tsx`, que además lleva su cortina incrustada, y simplificar su `App.tsx`
- [ ] T167 [P] [US1] Lo mismo en `frontend/mf-reservas/src/`, conservando que `/reservas/nueva` siga siendo una ruta suya: el que decide no pintar marco es el shell
- [ ] T168 [P] [US1] Quitar de los tres `src/App.css` la variable `--curtain-duration`, la clase `.curtain-panel` y los `@keyframes curtain-sweep` (FR-063)
- [ ] T169 [US1] Comprobar que los cuatro paquetes pasan `tsc --noEmit` y `npm run build` por separado, sin compilar el shell ni los otros remotes (SC-016, compuerta 2)

**Checkpoint**: un único menú, el del shell. Ir de *Canchas* a *Reportes* no lo
remonta.

---

## Phase 4: User Story 2 — Una sola copia del menú (P2)

- [ ] T170 [US2] Verificar SC-015: buscar en todo `frontend/` las definiciones de la lista de navegación; debe haber exactamente una, en el shell
- [ ] T171 [US2] Verificar SC-018: no queda ninguna referencia a `curtain`, `Cortina` ni `navItems` fuera de `frontend/shell/`

---

## Phase 5: User Story 3 — Modelo, informe y figuras (P3)

- [ ] T172 [US3] Precisar en `diagramas/workspace.dsl` la vista 09 y las descripciones que lo necesiten: el shell aporta el marco y los remotes solo el contenido (FR-064)
- [ ] T173 [US3] Reexportar los diagramas y regenerar las figuras afectadas en `informe/figuras/`, comprobando que ninguna otra cambia de geometría
- [ ] T174 [US3] Revisar §4 de `informe/secciones/04-arquitectura.tex`: lo que afirma sobre el shell pasa a ser cierto; añadir la precisión de que los microfrontends aportan solo el contenido (FR-064)
- [ ] T175 [US3] Recompilar el informe y la presentación, y comprobar que no hay errores ni referencias sin resolver

---

## Phase 6: Verificación en vivo y cierre

- [ ] T176 Reconstruir los cuatro contenedores del frontend y comprobar que quedan sanos
- [ ] T177 Verificar SC-014 y SC-017 en un navegador real: recorrer las siete opciones del administrador y las dos del socio, comprobar que en todas está el menú completo, que ir de *Canchas* a *Reportes* no remonta el menú, y medir el tiempo del salto entre remotes frente a los 2 592 ms de referencia
- [ ] T178 Verificar los casos de borde: `/reservas/nueva` sigue a pantalla completa sin menú, `/login` sin menú, y `/perfil` **con** menú, que hoy lo pierde
- [ ] T179 Actualizar `docs/AUDITORIA-ALCANCE.md` con este hallazgo y su cierre

---

## Dependencies & Execution Order

- **T160 → T161 → T162 → T163 → T164**: estrictamente en ese orden; el chrome del shell tiene que funcionar antes de vaciar ningún remote.
- **T165, T166, T167, T168**: en paralelo entre sí, pero todas **después** de T164.
- **T169** cierra el recorrido 2.
- Fase 4 después de la 3; fase 5 después de la 4; fase 6 al final.

## Implementation Strategy

El recorrido 1 deja el sistema funcionando con dos menús a la vez: feo, pero en
ningún momento roto. Es deliberado: si algo falla, el estado intermedio sigue
siendo usable y se puede revertir sin prisa. El recorrido 2 es el que borra código
y el que hace visible el resultado.

Si al terminar algo no queda funcionando, se revierte la feature entera. No se
entrega a medias, a pocos días de la defensa.
