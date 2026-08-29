# Research — Fase 0

**Feature**: 003 · [plan.md](./plan.md) · [spec.md](./spec.md) · 2026-08-29

La numeración continúa la de 002, que llegó a R-011.

## Lo que no se investigó, porque ya estaba medido

- El shell (`AppLayout`) renderiza `<main>`, el guardia de inactividad y las
  rutas. No pinta cabecera ni menú.
- El chrome vive en `components/Layout.tsx` de los tres remotes: 220 líneas en
  `mf-administracion`, 221 en `mf-reportes`, 144 en `mf-reservas`.
- El menú de administración está duplicado en los dos primeros (95 y 119 líneas)
  y ya se desincronizó una vez.
- Dentro de un remote: 155–232 ms y solo cambia el centro. Entre remotes:
  2 592 ms y se remonta todo.

## R-012 — El shell puede pintar el chrome sin mover estilos

**Contexto**: el chrome usa clases de Tailwind sobre un sistema de tokens
(`bg-primary-container`, `font-headline-md`, `text-on-primary`…) definido con
`@theme` en el `App.css` de cada remote. Si el shell no tuviera esos tokens,
subir el chrome exigiría además mover o duplicar el sistema de diseño, y el coste
de la feature cambiaría de escala.

**Decisión**: no hay que mover nada. El shell ya carga `pluginTailwindcss` y su
`App.css` define **el mismo conjunto de tokens** que el de `mf-administracion`;
comparados uno a uno, la diferencia es vacía. También carga ya las fuentes del
diseño y los *Material Symbols* que usan los iconos del menú.

**Consecuencia**: el chrome se traslada tal cual, con sus clases intactas. La
feature es un movimiento de componentes, no una reescritura de estilos.

---

## R-013 — Dos chromes, elegidos por rol, y una excepción explícita

**Contexto**: los remotes no tienen un chrome, tienen dos. El de administración
—`mf-administracion` y `mf-reportes`, idénticos entre sí— lleva barra lateral fija
y, en móvil, cabecera con menú desplegable. El del socio —`mf-reservas`— lleva
barra lateral fija y, en móvil, **barra inferior de pestañas con una acción
propia, «Nueva»**. Además `/reservas/nueva` se abre hoy a pantalla completa, sin
menú, por diseño.

**Decisión**: el shell pinta un chrome u otro **según el rol de la sesión**, que
ya conoce, conservando las dos variantes móviles tal como están. Y mantiene una
lista explícita de rutas sin chrome:

```ts
const RUTAS_SIN_CHROME = ['/reservas/nueva'];
```

**Rationale**: elegir por rol es más simple y más correcto que elegir por remote,
porque el menú **es** del rol: el administrador ve el suyo tanto en
`/administracion` como en `/reportes`, que son dos remotes distintos. Y decidido
con el equipo: `/reservas/nueva` conserva su diseño a pantalla completa.

**El coste, dicho claro**: esa lista acopla el shell a una ruta interna de un
remote, y el Principio V dice que cada remote es dueño de sus rutas. Es un
acoplamiento de una línea, explícito y con nombre, frente a la alternativa de
inventar un contrato para que el remote pida «móntame sin chrome», que sería más
maquinaria de la que este alcance justifica. Se asume y se documenta.

**Cómo se implementa sin duplicar el montaje**: el shell no enruta
`/reservas/nueva` por separado. Monta el remote una sola vez para `/reservas/*` y
es el envoltorio de chrome el que, mirando la ruta actual, decide si dibuja el
marco o entrega el contenido desnudo. Así el remote sigue resolviendo sus
subrutas y el shell no duplica puntos de montaje.

**Alternativas descartadas**:

- *Un único chrome para los dos roles*: obligaría a unificar la barra inferior del
  socio con la cabecera del administrador, que son decisiones de diseño distintas
  y ya construidas.
- *Elegir el chrome por prefijo de ruta en vez de por rol*: falla justo en el caso
  que motiva la feature, `/reportes`, que es otro remote y el mismo menú.
- *Que cada remote siga pintando su chrome y solo se comparta la lista*: no hay
  paquete compartido entre remotes y el Principio V prohíbe importar entre ellos;
  seguiría habiendo dos copias que desincronizar.

---

## R-014 — La cortina se borra, no se desactiva

**Contexto**: `CurtainTransition` y `CortinaDeEntrada` existían para encubrir el
remontado de la interfaz al cambiar de sección. Están hoy en 0 ms, desactivadas.

**Decisión**: se eliminan del código de los tres remotes, junto con sus
`@keyframes` y su variable CSS.

**Rationale**: desaparece el remontado que encubrían, así que dejan de tener
motivo. Dejarlas en 0 ms sería conservar 130 líneas y una variable CSS que nadie
puede explicar dentro de un año. Si en el futuro se quiere una transición entre
secciones, se diseña sobre el chrome del shell, que es donde ahora tiene sentido.

---

## R-015 — Las variantes responsive de Tailwind no cruzan la frontera del remote

**Encontrado al implementar, no previsto en la Fase 0.** Trasladado el chrome, la
cabecera móvil aparecía en escritorio: `md:hidden` no surtía efecto.

**Causa**: el shell y **cada remote** inyectan su propia hoja de Tailwind. La del
remote se carga después, y sus utilidades base —`.flex`, `.hidden`, `.ml-64`— se
declaran más tarde en la cascada. Como una variante responsive tiene la misma
especificidad que la utilidad base, el orden decide: `.flex` del remote ganaba a
`@media (min-width: 48rem) { .md\:hidden }` del shell. Mientras el chrome vivía
dentro del remote las dos reglas salían de la misma hoja y el problema no existía.

**Decisión**: la responsividad del chrome se escribe como CSS propio en el
`App.css` del shell, con nombres que ningún remote genera —`.chrome-escritorio`,
`.chrome-movil`, `.chrome-contenido`—. Los colores y el espaciado siguen siendo
utilidades de Tailwind: ahí una redefinición del remote produce exactamente la
misma regla, porque los tokens son idénticos (R-012), y el orden da igual.

**Lo que esto enseña**: en Module Federation, dos paquetes con Tailwind comparten
un espacio de nombres de clases sin coordinarse. Todo lo que dependa del ORDEN de
la cascada es frágil entre paquetes; lo que dependa solo del valor, no. Vale la
pena recordarlo si algún día se comparte más marco.

---

## Resumen de decisiones

| # | Decisión | Toca |
|---|---|---|
| R-012 | El shell ya tiene Tailwind y los mismos tokens: el chrome se traslada sin tocar estilos | `frontend/shell/` |
| R-013 | Dos chromes elegidos por rol, y `RUTAS_SIN_CHROME` con una entrada explícita | `frontend/shell/src/` |
| R-014 | Las cortinas se borran, no se desactivan | los tres remotes |
| R-015 | La responsividad del chrome va en CSS propio, no en variantes de Tailwind, porque entre paquetes manda el orden de la cascada | `frontend/shell/src/App.css` |

Sin `NEEDS CLARIFICATION` pendientes.
