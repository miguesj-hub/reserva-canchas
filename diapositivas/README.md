# Presentación final — entregable E6

Plantilla LaTeX (beamer) para la presentación del proyecto integrador.
El guion diapositiva a diapositiva está en **[ESTRUCTURA.md](ESTRUCTURA.md)**.

## Compilar

```bash
make          # presentacion.pdf        — la que se proyecta
make notas    # presentacion-notas.pdf  — con notas al lado, para el ponente
make watch    # recompila al guardar
make clean    # borra intermedios, conserva los PDF
```

Se compila con **lualatex**: el tema `metropolis` carga Fira Sans vía
`fontspec` y pdflatex no sabe hacerlo. El Makefile ya lo usa; si compilas a
mano, `latexmk -lualatex presentacion.tex`.

## Qué hay en cada archivo

| Archivo | Para qué |
|---|---|
| `presentacion.tex` | Documento maestro: solo el orden de los bloques |
| `config/datos.tex` | **El único archivo con datos propios**: equipo, docente, reparto de la exposición |
| `config/portada.tex` | Portada. Lee de `datos.tex`; no editar |
| `config/tema.tex` | Identidad visual: metropolis + la paleta del informe |
| `config/preambulo.tex` | Paquetes e idioma. No es específico del proyecto |
| `config/plantilla.tex` | Los mecanismos: `\bloque`, `\guion`, `\ph`, `\laminafigura`, `\cifra`, `\caja` |
| `secciones/*.tex` | Un archivo por bloque de la charla |
| `figuras/` | **Solo capturas de pantalla propias.** Los diagramas C4 se leen de `../informe/figuras` |

## Estado

**Cerrada y lista para proyectar.** Los dos interruptores de
`config/plantilla.tex` ya están en `\guiafalse` y `\marcadoresfalse`: no hay
cajas de guion ni marcadores `[Insertar ...]` pendientes. Para volver a
maquetar con la guía a la vista, ponlos en `\guiatrue` y `\marcadorestrue`.

29 láminas: portada, 12 de contenido, la de cierre y 15 de respaldo. Las de
respaldo van tras `\appendix` y no cuentan en la numeración ni en la barra de
progreso.

Lo único que queda por decidir en `config/datos.tex` es la **ciudad** de la
portada y **quién expone cada bloque** (`\exponeArquitectura` y compañía).
Con `\guiafalse` el reparto no llega a imprimirse, así que no bloquea nada.

## Presupuesto de tiempo — 15 minutos

Quince minutos en total: **7:30 de diapositivas** y el resto de demostración
en vivo del sistema corriendo.

| Lámina | | Lámina | |
|---|---|---|---|
| Portada | 0:15 | Modelo de datos | 0:45 |
| El encargo | 0:45 | Reglas de negocio (2) | 1:10 |
| Cómo lo construimos | 0:50 | Reportes | 0:35 |
| Arquitectura | 0:50 | Calidad y despliegue | 0:35 |
| Frontend | 0:50 | Guion de la demo | 0:20 |
| Backend | 0:45 | Cierre | 0:40 |

Todo lo que sobre es demostración. Si hay que recortar, se recorta «Cómo lo
construimos» y luego «Arquitectura»; **nunca la demo**, que es donde se
defiende el 25 % del alcance funcional.

## Las tres piezas de la plantilla que conviene conocer

**`\bloque{Título}{minutos}{quién}{criterio de la rúbrica}`** abre cada bloque.
El minutaje va impreso a propósito: obliga a que la suma quepa en el tiempo
asignado en vez de descubrirlo ensayando.

**`\guion{...}` frente a `\note{...}`.** El guion se imprime en la lámina
mientras se prepara (se apaga con `\guiafalse`); la nota va a la pantalla del
ponente con `make notas` y nunca al proyector. Guion corto y uno por lámina:
dos guiones largos desbordan la diapositiva.

**`\ph{...}`** marca lo que falta. Al poner `\marcadoresfalse` quedan en negro
sobre la lámina: si alguno se quedó sin rellenar, se ve enseguida.

## Diagramas

No se duplican. `\graphicspath` apunta a `../informe/figuras`, que es donde
Structurizr los exporta para el informe (E1). Un diagrama corregido lo está en
los dos documentos a la vez.

**Ninguna vista C4 se proyecta en el cuerpo de la charla.** Las exportaciones
de Structurizr salen más altas que anchas —la de contenedores mide 2254 × 2720
puntos—, y en una lámina 16:9 se quedan en un quinto del ancho: las etiquetas
dejan de leerse desde el fondo del aula. En su lugar, la lámina de arquitectura
lleva un mapa hecho con `\caja{}`, con los mismos colores de Structurizr. Las
cuatro vistas completas están en el respaldo, para proyectarlas si preguntan.

Para proyectar uno a lámina completa:

```latex
\laminafiguratitulo{Contenedores (\vista{02})}{contenedores}{Pie breve.}
\laminafigura{despliegue}{Pie breve.}   % sin título, gana altura
```

Las capturas de pantalla de la aplicación sí van en `figuras/`, porque no
existen en el informe.
