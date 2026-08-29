# Lo que se le pidió a Spec Kit en esta feature

Mismo formato que en 002: el comando, el mensaje enviado, y cómo se ejecutó de
verdad.

---

## 1 · `/speckit-constitution`

**No se invocó, y esa es la noticia.**

El Principio V ya exigía que «la autenticación y la navegación de nivel superior
vivan en el shell». Esta feature no cambia lo que la constitución pide: hace que
se cumpla. Enmendarla habría sido justo lo contrario de lo que hacía falta.

*(Se llegó a evaluar la opción de corregir los documentos en vez del código —eso
sí habría exigido enmienda, para sustituir la cláusula por otra verificable— y se
descartó en favor de arreglar el código.)*

---

## 2 · `/speckit-specify`

```
Mover el chrome del frontend —menú lateral y cabecera— desde el layout de cada
microfrontend al shell, para que al pulsar una opción del menú solo se reemplace
el contenido central. Es lo que pide el patrón de Module Federation y lo que el
Principio V ya exige.

El problema medido: el menú de administración está duplicado en mf-administracion
(95 líneas) y mf-reportes (119), y ya se desincronizó al añadir las pantallas de
la feature 002. Cambiar de sección dentro de un remote cuesta 155-232 ms; entre
remotes, 2 592 ms, porque se remonta la interfaz entera. La cortina de 800 ms
existía para encubrir ese remontado.

Tres historias: navegar sin que se remonte la aplicación; una sola copia del
menú; y que el modelo C4 y el informe describan el resultado.

Casos de borde que quiero decididos en el spec: /reservas/nueva sigue a pantalla
completa sin menú, /login sin menú, y /perfil CON menú, que hoy lo pierde porque
es una ruta del shell y el chrome vivía en los remotes.

Continúa la numeración: FR-057 en adelante, SC-014 en adelante. Sin entidades ni
contratos: no se toca el backend.
```

**Cómo se ejecutó**: `create-new-feature.sh` creó el directorio; el spec se
escribió a mano sobre la plantilla, por la razón de siempre —la skill copia la
plantilla en blanco sobre el spec de la feature apuntada—.

---

## 3 · `/speckit-plan`

```
Planifica el traslado. Antes de nada, resuelve en research.md si el shell puede
pintar el chrome sin mover el sistema de diseño: si no tuviera los tokens de
Tailwind, la feature cambia de escala.

Decide también cómo elegir entre los DOS chromes que hay —el del administrador,
con cabecera y menú desplegable en móvil, y el del socio, con barra inferior y su
acción «Nueva»— y cómo mantener /reservas/nueva a pantalla completa sin duplicar
el punto de montaje del remote.

Y decide qué hacer con las cortinas: están en 0 ms desde hace un rato, pero al
desaparecer el remontado dejan de tener motivo.

Orden importante: el shell tiene que saber pintar el chrome ANTES de vaciar
ningún remote. El estado intermedio, con el menú duplicado en pantalla, es feo
pero nunca roto y se puede revertir sin prisa.

Evalúa el Constitution Check contra la v1.3.0 y deja claro que esta feature no la
enmienda: la cumple.
```

**Cómo se ejecutó**: `setup-plan.sh` copió la plantilla y los artefactos se
escribieron sobre ella. R-012, R-013 y R-014 salieron de aquí; **R-015 apareció
implementando** y se añadió después.

---

## 4 · `/speckit-tasks`

```
Veinte tareas, T160 en adelante, en tres historias y seis fases. Las de Setup y
Foundational van vacías con su explicación: no hay nada que inicializar.

El orden dentro de la Historia 1 es estricto —navegacion, Chrome, envoltorio,
rutas, verificación— y solo después se vacían los tres remotes, que sí pueden ir
en paralelo entre sí.

Incluye una fase final de verificación en vivo: recorrer las siete opciones del
administrador y las dos del socio en un navegador real, medir el salto entre
remotes frente a los 2 592 ms de referencia, y comprobar los tres casos de borde.
```

**Cómo se ejecutó**: escrito a mano siguiendo el estilo de 001 y 002.

---

## 5 · `/speckit-implement`

Ejecutado tarea por tarea. Tres cosas que aparecieron implementando:

- **R-015, el hallazgo de verdad.** Trasladado el chrome, la cabecera móvil se
  veía en escritorio: `md:hidden` no surtía efecto. El shell y cada remote
  inyectan su propia hoja de Tailwind, la del remote se carga después, y sus
  utilidades base ganan a las variantes responsive del shell por orden de
  cascada. Se resolvió escribiendo la responsividad del chrome como CSS propio,
  con nombres que ningún remote genera.
- **El exportador de diagramas moría con SIGPIPE.** Encadenarlo a `| head -1`
  cerraba la tubería antes de que escribiera los SVG, y se leían archivos viejos
  durante varios intentos. Parece un detalle de shell y costó tres exportaciones
  aparentemente correctas: conviene dejar que termine y comprobar después.
- **El auto-layout volvió a superponer los componentes nuevos**, igual que en la
  feature 002: `Chrome` cayó encima de `SessionContext`. Se corrigen coordenadas
  a mano y se comprueba que no queden solapamientos antes de convertir a PDF.
