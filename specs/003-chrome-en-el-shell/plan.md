# Implementation Plan: El chrome del frontend vive en el shell

**Branch**: `fix/brechas-auditoria-alcance` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-chrome-en-el-shell/spec.md`

## Summary

Mover el menú lateral y la cabecera desde el layout de cada microfrontend al
shell, de modo que al navegar solo se reemplace el contenido central. Es un
**movimiento de componentes, no una reescritura**: el shell ya tiene Tailwind y
exactamente los mismos tokens de diseño (R-012), así que el chrome se traslada
con sus clases intactas.

El shell pinta dos variantes, elegidas por el rol de la sesión, y mantiene una
lista explícita de rutas sin chrome con una única entrada, `/reservas/nueva`
(R-013). Las cortinas de transición se borran, porque desaparece el remontado que
encubrían (R-014).

Solo frontend. No se toca backend, ni esquema, ni contratos, ni el compose.

## Technical Context

**Language/Version**: TypeScript 5 sobre React 19. Sin cambios.

**Primary Dependencies**: Rsbuild con `@module-federation/rsbuild-plugin`,
`react-router-dom` y Tailwind. **Sin dependencias nuevas**: el shell ya tiene
todas las que el chrome necesita.

**Storage**: N/A. **Testing**: `npm run build` y `tsc --noEmit` por paquete, más
verificación en navegador real, que es donde se comprueba lo que la feature
promete: que el menú no se remonta.

**Target Platform**: los mismos once contenedores.

**Project Type**: microfrontends sobre microservicios.

**Performance Goals**: que cambiar de sección entre remotes deje de costar
2 592 ms y baje al orden de un cambio dentro del mismo remote (155–232 ms
medidos). Es SC-014 y es el motivo de la feature.

**Constraints**: cada remote tiene que seguir compilando y desplegándose solo
(Principio V), y ninguno puede importar código de otro.

**Scale/Scope**: 1 componente nuevo en el shell; 3 layouts y 2 componentes de
cortina eliminados; 3 `App.tsx` de remote simplificados; 3 `App.css` limpiados.
Saldo esperado: se borra bastante más código del que se escribe.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluado contra `.specify/memory/constitution.md` **v1.3.0**. **No se enmienda**:
esta feature no cambia lo que la constitución exige, hace que se cumpla.

| # | Principio | Cómo lo satisface este plan | Estado |
|---|---|---|---|
| I | Alcance cerrado y trazable | Traza al entregable E2 y al Principio V, que hoy se incumple. No añade funcionalidad de negocio: ninguna pantalla nueva, ningún endpoint. | PASA |
| II | Reglas de negocio con prueba | No aplica: no se toca ninguna RN. | N/A |
| III | Regla de dependencia hexagonal | No aplica: no se toca backend. | N/A |
| IV | Independencia de datos | No aplica. | N/A |
| V | Microfrontends autónomos | **Es el principio que la feature viene a cumplir.** «La navegación de nivel superior vive en el shell» pasa de falso a cierto. Cada remote sigue compilando solo, exponiendo `./App` y siendo dueño de sus rutas internas; ninguno importa de otro. | PASA |
| VI | Contrato antes que implementación | No aplica: ningún endpoint nuevo. El contrato de Module Federation (`exposes: './App'`) no cambia. | PASA |
| VII | Levantar con un solo comando | No cambia el compose ni el seed. | PASA |

**Compuerta 9**: el modelo C4 ya dibuja el componente `Layout` en el shell,
descrito como *«Shared visual structure (header, navigation) that wraps the active
remote»*, y §4 del informe ya lo afirma. Esta feature **no los corrige: los hace
ciertos**. Aun así hay trabajo: la vista 09 gana precisión sobre lo que el shell
pinta, y las vistas 10 a 12 dejan de poder insinuar que el remote aporta marco.

**Resultado**: sin violaciones.

### Re-evaluación después de la Fase 1

- **Principio V** — El único acoplamiento nuevo del shell hacia un remote es la
  entrada `/reservas/nueva` de `RUTAS_SIN_CHROME`. Está declarado, tiene nombre y
  su coste se discute en R-013. No es un import: el shell sigue consumiendo solo
  el contrato de Module Federation.
- **Principio I** — No se aprovecha para rediseñar el menú ni unificar las dos
  variantes móviles: se trasladan tal cual. Cualquier mejora visual sería alcance
  no trazado.

Sin violaciones nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/003-chrome-en-el-shell/
├── spec.md               # Tres historias, FR-057 a FR-064
├── plan.md               # Este archivo
├── research.md           # Fase 0: R-012, R-013, R-014
├── speckit-commands.md   # Lo que se le pidió a cada comando de Spec Kit
└── tasks.md              # Fase 2
```

Sin `data-model.md` ni `contracts/`: no hay entidades ni API.

### Source Code (repository root)

```text
frontend/shell/src/
├── components/Chrome.tsx     # NUEVO — el menú y la cabecera, una sola vez
├── navegacion.ts             # NUEVO — la única definición de las entradas
└── App.tsx                   # envuelve las rutas con el chrome

frontend/mf-reservas/src/
├── components/Layout.tsx            # SE BORRA
├── components/CurtainTransition.tsx # SE BORRA
├── App.tsx                          # solo sus páginas
└── App.css                          # fuera los keyframes de la cortina

frontend/mf-administracion/src/      # igual que el anterior
frontend/mf-reportes/src/            # igual, su cortina va dentro del Layout

diagramas/workspace.dsl              # vista 09 y descripciones de los remotes
informe/secciones/04-arquitectura.tex # el reparto, ya cierto, con más precisión
informe/figuras/                      # regeneradas
```

## Orden de Implementación

El orden importa: si se vacían los remotes antes de que el shell pinte el chrome,
la aplicación queda sin menú entre un paso y el siguiente.

### Recorrido 1 — El shell aprende a pintar el chrome (US1, parte 1)

Componente nuevo en el shell con las dos variantes y la lista de rutas sin
chrome. Todavía sin tocar los remotes: en este punto el menú se ve **dos veces**,
lo cual es feo pero seguro y demuestra que el del shell funciona.

### Recorrido 2 — Los remotes se quedan solo con sus páginas (US1, parte 2 · US2)

Se borran los tres `Layout.tsx` y las cortinas, y cada `App.tsx` pasa a exponer
solo sus rutas. Al terminar hay un único menú, el del shell.

**Demostrable**: ir de *Canchas* a *Reportes* sin que el menú se remonte.

### Recorrido 3 — Modelo, informe y figuras (US3)

Compuerta 9: DSL, figuras regeneradas y los dos PDF recompilados.

## Riesgos

| Riesgo | Señal temprana | Respuesta |
|---|---|---|
| El contenido pierde el margen del sidebar y queda debajo del menú | Las páginas empiezan pegadas al borde o tapadas | Cada variante del chrome reproduce el envoltorio que hoy pone el layout del remote: `md:ml-64` en las dos, y el `p-container-margin` solo en la del socio, porque las páginas de administración ya traen el suyo |
| Se rompe el despliegue independiente de un remote | `npm run build` falla en un remote suelto | Ninguna importación nueva entre paquetes. Se verifica compilando los cuatro por separado, que es la compuerta 2 |
| `/reservas/nueva` pierde su pantalla completa | Aparece el menú en el flujo de reserva | `RUTAS_SIN_CHROME`, verificado en navegador dentro de las tareas |
| El refactor rompe la demo a pocos días de la defensa | Cualquier verificación en rojo | Se trabaja en rama, se verifica en navegador real recorriendo las nueve opciones de los dos roles, y si algo no se puede dejar funcionando se revierte entero. No se entrega a medias |
| Quedan restos de cortina o de menú en un remote | Una búsqueda encuentra `curtain` o `navItems` fuera del shell | Tarea de verificación explícita al cierre (SC-015, SC-018) |
