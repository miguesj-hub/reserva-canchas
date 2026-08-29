# Sistema de Reserva de Canchas Deportivas

Pádel · tenis · básquet. Proyecto integrador de **Desarrollo de Aplicaciones
Empresariales**, Maestría en Ingeniería de Software, Universidad Politécnica
Salesiana.

Microfrontends con **Module Federation** sobre microservicios **Spring Boot** y
**PostgreSQL**, con todo el sistema levantándose con un solo comando.

El alcance, las reglas de negocio RN-01 a RN-08 y los criterios de aceptación
salen de [`Alcance_Funcional_Reserva_Canchas_v2.md`](Alcance_Funcional_Reserva_Canchas_v2.md),
que es la fuente de la verdad del proyecto.

---

## Levantar el sistema

### Requisito único

**Docker 24 o superior, con Compose v2.** Nada más.

No hace falta Java, Node, Maven ni PostgreSQL en la máquina: todo se compila y se
ejecuta dentro de los contenedores. Es deliberado — que la evaluación no dependa
de qué tenga instalado quien evalúa.

```bash
docker --version        # 24.x o superior
docker compose version  # v2.x
```

### Un comando

```bash
git clone <url-del-repositorio> && cd reserva-canchas
docker compose up -d --wait
```

Y abrir **<http://localhost>**.

El primer arranque compila once imágenes y tarda varios minutos; los siguientes
son cuestión de segundos. Cuando `--wait` termina, los once servicios están
`healthy`:

```bash
docker compose ps        # los once en healthy
```

### Usuarios de prueba

Los siembra la migración `V2__seed_usuarios.sql` en el primer arranque. Las
contraseñas se guardan hasheadas con BCrypt.

| Usuario | Contraseña | Rol | Para qué sirve |
|---|---|---|---|
| `admin` | `admin` | ADMINISTRADOR | Catálogo, listado global de reservas, usuarios y reportes |
| `cliente1` | `cliente1` | USUARIO_FINAL | El recorrido de reserva y cancelación |
| `cliente2` | `cliente2` | USUARIO_FINAL | El segundo lado del escenario de concurrencia |
| `inactivo` | `inactivo` | USUARIO_FINAL, inactivo | Demostrar el rechazo de una cuenta inactiva |

Son credenciales de demostración: en un despliegue real se cambian.

### Comprobar que levantó bien

```bash
curl -u cliente1:cliente1 http://localhost/api/canchas   # el catálogo sembrado
```

### Arranque limpio

Borra el volumen de PostgreSQL y vuelve a sembrar todo desde cero. Es lo que
conviene hacer antes de una demostración, para que los reportes no arrastren
reservas viejas:

```bash
docker compose down -v && docker compose up -d --wait
```

### Si algún puerto está ocupado

Todos los puertos publicados son variables de entorno con valor por defecto, así
que se cambian sin tocar el `docker-compose.yml`:

```bash
EDGE_PORT=8081 docker compose up -d --wait     # y entrar por http://localhost:8081
GATEWAY_PORT=18080 docker compose up -d --wait # si el 8080 lo tiene otro proyecto
```

Existen también `POSTGRES_PORT`, `SHELL_PORT`, `MF_*_PORT` y `MS_*_PORT`.

> **El manual completo está en [`docs/MANUAL-DESPLIEGUE.md`](docs/MANUAL-DESPLIEGUE.md)**
> (entregable E5): configuración por variables de entorno, registros, reconstrucción
> tras un cambio de código, trabajar solo en el frontend, tabla de problemas
> frecuentes y cómo ejecutar las pruebas. Lo de aquí arriba es lo que hace falta
> para levantarlo; ese documento es el que manda si algo difiere.

---

## Qué se levanta

Once contenedores en dos redes de Docker. **El `edge` es el único conectado a las
dos**, y es lo que impide que el navegador alcance un microservicio saltándose el
gateway.

```
navegador
    │  http://localhost — un único origen para el shell, los remotes y /api
    ▼
  edge (nginx)
    ├── shell (host) · mf-reservas · mf-administracion · mf-reportes   [red frontend]
    └── /api → api-gateway                                             [red backend]
                  ├── ms-usuarios  → usuarios_db
                  ├── ms-canchas   → canchas_db
                  ├── ms-reservas  → reservas_db
                  └── ms-reportes  → sin base propia: agrega por REST
```

Los puertos de los microservicios (8081–8084) se publican solo para inspeccionar
su Swagger en `/swagger-ui.html`; la aplicación no los usa.

**Tres bases aisladas por credenciales**, no por convención: cada microservicio
tiene su propio rol de PostgreSQL y no puede conectarse a las bases de los otros.
Se comprueba así:

```bash
docker compose exec postgres \
  psql "postgresql://reservas_app:reservas_app@localhost/canchas_db"
# FATAL: permission denied for database "canchas_db"
```

---

## Mapa del repositorio

| Carpeta | Qué hay |
|---|---|
| `frontend/` | El shell (host) y los tres microfrontends remotos |
| `backend/` | El API Gateway y los cuatro microservicios Spring Boot |
| `infra/` | Nginx del edge e inicialización de PostgreSQL: bases, roles y extensiones |
| `docker-compose.yml` | Los once servicios, las dos redes y el volumen |
| `diagramas/` | Modelo C4 en Structurizr DSL, y el exportador de figuras |
| `informe/` | El documento de arquitectura en LaTeX (E1) |
| `diapositivas/` | La presentación final en LaTeX (E6) |
| `manual/` | Manual de usuario en LaTeX |
| `docs/` | Manual de despliegue (E5) y la auditoría de alcance |
| `specs/` | Los artefactos de Spec Kit: constitución, especificación, plan y tareas |
| `Postman-collection/` | Colección de pruebas de la API (parte de E3) |

---

## Entregables

| | Entregable | Dónde |
|---|---|---|
| **E1** | Documento de arquitectura | [`informe/informe.pdf`](informe/informe.pdf) |
| **E2** | Shell y microfrontends integrados | [`frontend/`](frontend/) |
| **E3** | Microservicios con Swagger y colección de pruebas | [`backend/`](backend/) · [`Postman-collection/`](Postman-collection/) |
| **E4** | Scripts de base de datos y datos de prueba | [`infra/postgres/init/`](infra/postgres/init/) y las migraciones Flyway de cada servicio |
| **E5** | Manual de despliegue | [`despliegue/despliegue.pdf`](despliegue/despliegue.pdf) · fuente en [`docs/MANUAL-DESPLIEGUE.md`](docs/MANUAL-DESPLIEGUE.md) |
| **E6** | Presentación con demostración en vivo | [`diapositivas/presentacion.pdf`](diapositivas/presentacion.pdf) |

---

## Cómo se construyó

Con **Spec-Driven Development**, usando [Spec Kit](https://github.com/github/spec-kit):
la especificación es la fuente de la verdad y el código su consecuencia. Antes de
generar la primera línea, los prompts de `/specify` dejaron escritos los
requisitos funcionales, los escenarios de aceptación, los criterios de éxito
medibles y los contratos OpenAPI.

- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — los siete
  principios que gobiernan el proyecto y las nueve compuertas de calidad. Cada
  principio se verifica contra un criterio de la rúbrica: uno que no aterrice en
  puntos no pertenece a ese documento.
- [`specs/`](specs/) — especificación, plan, investigación, contratos y tareas.
- [`speckit-commands.md`](speckit-commands.md) — los mensajes que se le enviaron a
  cada comando de Spec Kit, para poder repetir el flujo.

---

## Documentación de cada parte

Cada carpeta tiene su propio README con el detalle:
[`frontend/`](frontend/README.md) ·
[`diagramas/`](diagramas/README.md) ·
[`informe/`](informe/README.md) ·
[`diapositivas/`](diapositivas/README.md) ·
[`manual/`](manual/README.md)
