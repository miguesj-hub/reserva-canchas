# Manual de despliegue — entregable E5

Fuente LaTeX de `despliegue.pdf`, el manual breve de despliegue que pide el
entregable **E5** del documento de alcance (§5), en el formato que ese
entregable exige (PDF).

El contenido es el mismo de [`docs/MANUAL-DESPLIEGUE.md`](../docs/MANUAL-DESPLIEGUE.md).
**Si se cambia uno, hay que cambiar el otro.**

## Compilar

No lleva bibliografía, así que no hace falta `biber`. Dos pasadas, la segunda
para que cuadre el índice:

```bash
cd despliegue
pdflatex -interaction=nonstopmode despliegue.tex
pdflatex -interaction=nonstopmode despliegue.tex
```

En esta máquina `latexmk` no está instalado —BasicTeX pertenece a root y el
modo usuario de `tlmgr` lo rechaza—, por eso no hay `Makefile` como en
`informe/` y `manual/`.

## Estructura

| Archivo | Qué contiene |
|---|---|
| `despliegue.tex` | Documento principal: orden de las secciones |
| `config/preambulo.tex` | Paquetes y estilo visual (copia del de `manual/`, más `fancyvrb`) |
| `config/plantilla.tex` | El entorno `comando` y las cajas de nota y aviso |
| `config/datos.tex` | Datos de portada y metadatos del PDF |
| `config/portada.tex` | Portada |
| `secciones/` | Una sección por archivo |
