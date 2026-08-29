# Manual de usuario — plantilla LaTeX

Manual de usuario de ReservaSport, dirigido a usuarios finales y
administradores del club. No documenta arquitectura ni despliegue —eso vive
en `informe/`—, solo cómo usar la aplicación ya en funcionamiento.

## Compilar

```bash
make            # genera manual.pdf
make watch      # recompila al guardar
make clean      # borra intermedios, conserva el PDF
```

Sin `make`, el equivalente directo es:

```bash
latexmk -pdf manual.tex
```

Requiere una distribución LaTeX con `latexmk` (TeX Live, MacTeX o MiKTeX).
No usa bibliografía, así que no hace falta `biber`.

## Estructura

```
manual.tex                ensamblador: solo \input, sin texto
config/
  datos.tex                autores, docente, universidad, fecha
  preambulo.tex             paquetes y estilo (copia simplificada del informe)
  plantilla.tex             \captura, \nota, \aviso, \boton, \ruta, \campo
  portada.tex               portada (toma los datos de datos.tex)
secciones/
  00-introduccion.tex       qué es este manual, requisitos, cómo se organiza
  01-acceso.tex             crear cuenta, iniciar sesión, perfil, cerrar sesión
  02-usuario-final.tex      disponibilidad, reservar, ver y cancelar reservas
  03-administrador.tex      dashboard, canchas, reservas, usuarios, reportes
  04-preguntas-frecuentes.tex
figuras/
  capturas/                 capturas de pantalla de la aplicación (.jpg)
```

## Convenciones

**Capturas** — usa el comando `\captura`, que ya centra la imagen, la ajusta
al ancho pedido (como fracción de `\linewidth`) y avisa en el PDF si el
archivo todavía no existe en `figuras/capturas/`:

```latex
\captura{admin-dashboard}{1}{Panel principal con los indicadores del día.}{admin-dashboard}
%        ^archivo (sin .jpg)  ^ancho (0-1)         ^pie de figura          ^etiqueta para \cref
```

**Referencias cruzadas** — con `\cref` no se escribe la palabra «apartado»:

```latex
Contacta al club para que la reactive (\cref{sec:admin:usuarios}).
```

**Cajas de aviso** — `\nota{...}` para aclaraciones, `\aviso{...}` para
advertencias sobre algo irreversible o que requiere cuidado.

**Elementos de interfaz** — `\boton{Guardar}` para botones y pestañas,
`\campo{usuario}` para campos de formulario, `\ruta{Canchas > Editar}` para
rutas de navegación.

## Actualizar las capturas

Las capturas se tomaron sobre el sistema levantado con
`docker compose up`, navegando la aplicación real con las cuentas de
prueba del `quickstart` (`admin`, `cliente1`, `cliente2`, `inactivo`).
Si la interfaz cambia, vuelve a capturar la pantalla correspondiente y
reemplaza el archivo en `figuras/capturas/` manteniendo el mismo nombre;
no hace falta tocar el `.tex`.
