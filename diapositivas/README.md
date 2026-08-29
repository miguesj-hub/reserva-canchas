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
| `config/plantilla.tex` | Los mecanismos: `\bloque`, `\guion`, `\ph`, `\laminafigura`, `\cifra` |
| `secciones/*.tex` | Un archivo por bloque de la charla |
| `figuras/` | **Solo capturas de pantalla propias.** Los diagramas C4 se leen de `../informe/figuras` |

## Los dos interruptores

Mientras se prepara la charla, las láminas llevan cajas grises de guion y
marcadores ámbar `[Insertar ...]` donde falta contenido. **Antes de exponer**,
en `config/plantilla.tex`:

```latex
\guiafalse        % oculta las cajas de guion y las fichas de bloque
\marcadoresfalse  % deja los [Insertar ...] en negro, para que salten a la vista
```

Con la guía puesta la presentación tiene 60 láminas; sin ella, 49. La
diferencia son las fichas de bloque (duración, quién expone, qué criterio
defiende), que son para el ensayo y no para el aula.

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

Para proyectar uno a lámina completa:

```latex
\laminafiguratitulo{Contenedores (\vista{02})}{contenedores}{Pie breve.}
\laminafigura{despliegue}{Pie breve.}   % sin título, gana altura
```

Las capturas de pantalla de la aplicación sí van en `figuras/`, porque no
existen en el informe.
