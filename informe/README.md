# Informe del proyecto integrador — plantilla LaTeX

Plantilla vacía, ya compilando. Contiene la estructura de secciones; el
contenido se escribe dentro de `secciones/`.

## Compilar

```bash
make            # genera informe.pdf
make watch      # recompila al guardar
make clean      # borra intermedios, conserva el PDF
```

Sin `make`, el equivalente directo es:

```bash
latexmk -pdf informe.tex
```

Requiere una distribución LaTeX con `latexmk` y `biber` (TeX Live, MacTeX o
MiKTeX). MiKTeX instala los paquetes que falten en la primera compilación, así
que esa pasada tarda más.

En VS Code, la extensión **LaTeX Workshop** usa el `Makefile` y el `latexmkrc`
sin configuración adicional.

## Estructura

```
informe.tex              ensamblador: solo \input, sin texto
config/
  datos.tex              ← autores, docente, universidad, fecha
  preambulo.tex          paquetes y estilo
  portada.tex            portada (toma los datos de datos.tex)
secciones/
  00-resumen.tex         resumen y palabras clave
  01-introduccion.tex    contexto, problema, justificación
  02-objetivos.tex       objetivo general y específicos
  03-alcance-funcional.tex  roles, módulos, casos de uso, exclusiones
  04-arquitectura.tex    vista general, frontend, backend, seguridad
  05-modelo-datos.tex    DER, diccionario, integridad entre bases
  06-reglas-negocio.tex  catálogo de reglas y su implementación
  07-despliegue.tex      contenerización, compose, puesta en marcha
  08-pruebas.tex         estrategia, casos y resultados
  09-resultados.tex      cumplimiento de criterios, limitaciones
  10-conclusiones.tex    conclusiones, lecciones, trabajo futuro
  A-anexos.tex           scripts, colecciones, capturas
referencias.bib          bibliografía (formato IEEE)
figuras/                 imágenes: PDF, PNG o JPG
```

Para escribir, empieza por `config/datos.tex` y luego ve sección por sección.
No hace falta tocar `informe.tex` salvo que agregues o quites una sección.

## Convenciones

**Figuras** — el `\graphicspath` ya apunta a `figuras/`, así que basta el
nombre del archivo:

```latex
\begin{figure}[H]
    \centering
    \includegraphics[width=0.9\textwidth]{arquitectura.png}
    \caption{Vista general de la arquitectura.}
    \label{fig:arquitectura}
\end{figure}
```

**Referencias cruzadas** — con `\cref` no se escribe la palabra «figura»:

```latex
Como se observa en \cref{fig:arquitectura}...   % -> "en la figura 3"
```

**Código** — los lenguajes `Java`, `SQL`, `JavaScript`, `yaml` y `json` ya
están configurados:

```latex
\begin{lstlisting}[language=Java,caption={Validación de disponibilidad.},label={lst:validacion}]
// ...
\end{lstlisting}
```

**Atajos definidos** — `\rn{02}` → **RN-02**, `\ent{1}` → **E1**,
`\id{ms-reservas}` → `ms-reservas` en monoespaciado.

**Citas** — agrega la entrada en `referencias.bib` y cita con `\cite{clave}`.
Solo aparecen en el PDF las referencias efectivamente citadas. Las cuatro
entradas de ejemplo del `.bib` hay que reemplazarlas.

## Notas

- Los índices de figuras y tablas salen vacíos hasta que agregues la primera.
  Si el informe final no lleva ninguno, comenta `\listoffigures` y
  `\listoftables` en `informe.tex`.
- El estilo bibliográfico es IEEE. Para APA, cambia `style=ieee` por
  `style=apa` en `config/preambulo.tex`.
- Si necesitas entregar en Word, `pandoc informe.tex -o informe.docx` da una
  base aproximada, pero se pierde el formato de tablas y código.
