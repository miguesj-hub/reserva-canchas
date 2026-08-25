
# Diagramas de arquitectura (C4 · Structurizr DSL)

Modelo C4 del sistema, escrito en Structurizr DSL. Un único archivo,
`workspace.dsl`, genera las cuatro vistas del entregable **E1**.

## Ver los diagramas

```bash
docker compose up -d      # levantar
docker compose down       # detener
```

| URL | Qué es |
|---|---|
| http://localhost:8090/workspace/1/diagrams | **El visor.** Es la página con la barra de zoom y el botón de guardar |
| http://localhost:8090/ | Redirige al índice del workspace: lista de vistas, sin controles de diagrama |

Conviene marcar la primera: la raíz lleva al índice, no al visor, y desde ahí
no se puede hacer zoom ni mover elementos.

Al guardar `workspace.dsl` basta con recargar la página del navegador: el DSL
se vuelve a parsear en cada petición.

## Vistas

| Clave | Nivel C4 | Qué muestra |
|---|---|---|
| `01-Contexto` | 1 | El sistema y sus dos tipos de usuario |
| `02-Contenedores` | 2 | Edge, microfrontends, gateway, microservicios y bases de datos |
| `03-Componentes-ms-reservas` | 3 | Interior de `ms-reservas`, donde se aplican las reglas RN-01..RN-08 |
| `04-Despliegue` | — | Materialización en Docker Compose: redes, contenedores y volumen |
| `05-Componentes-ms-usuarios` | 3 | Interior de `ms-usuarios`: registro, autenticación y gestión de usuarios y roles |
| `06-Componentes-ms-canchas` | 3 | Interior de `ms-canchas`: catálogo, horarios y bloqueos |
| `07-Componentes-ms-reportes` | 3 | Interior de `ms-reportes`: agregación vía REST, sin base propia |
| `08-Componentes-gateway` | 3 | Interior del API Gateway: identificación del usuario y enrutamiento |
| `09-Componentes-shell` | 3 | Interior del shell: layout, sesión y carga de remotes |
| `10-Componentes-mf-reservas` | 3 | Interior de `mf-reservas`: vistas, estado y cliente de API |
| `11-Componentes-mf-administracion` | 3 | Interior de `mf-administracion`: vistas, estado y cliente de API |
| `12-Componentes-mf-reportes` | 3 | Interior de `mf-reportes`: vistas, estado y cliente de API |

Las vistas `05` a `12` usan capas genéricas de referencia (Controller/Service/
Repository/Client en backend; Vistas/Componentes UI/Estado/ApiClient en
frontend) en vez de mapear clase por clase el código actual, a diferencia de
`03-Componentes-ms-reservas` que sí está verificada contra las clases reales
de `ms-reservas`.

## Exportar para el informe

Desde la interfaz, en cada diagrama: menú de la esquina inferior izquierda →
**Export** → **PNG** o **SVG**. Para el informe LaTeX conviene SVG convertido
a PDF, o PNG a 2x de escala; los archivos van a `informe/figuras/`.

## Archivos

| Archivo | Rol |
|---|---|
| `workspace.dsl` | Fuente del modelo. Es lo único que se edita a mano. |
| `workspace.json` | Generado por Structurizr. Guarda las posiciones de los elementos tras mover cajas en la interfaz; conviene versionarlo para no perder el layout. |
| `docker-compose.yml` | Levanta el visor. |

## Nota sobre la imagen

La imagen `structurizr/lite` quedó descontinuada: su etiqueta `:latest` solo
imprime un aviso de migración y termina, dejando el contenedor reiniciándose
en bucle. Aquí se usa `structurizr/structurizr` con el subcomando `local`, que
es su sustituta directa.

## Correspondencia con el código

El modelo describe la arquitectura objetivo y debe mantenerse alineado con lo
que hay en el repositorio:

- Los nombres de contenedor (`rc-edge`, `rc-ms-reservas`, …) y los puertos de
  la vista de despliegue coinciden con `docker-compose.yml` en la raíz.
- Las tres bases y su aislamiento por credenciales están en
  `infra/postgres/init/01-bases-y-usuarios.sql`.
- La restricción que implementa RN-02, citada en la vista de componentes, está
  en `infra/postgres/init/04-reservas-db.sql`.
