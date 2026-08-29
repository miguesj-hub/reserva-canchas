# Estructura de la presentación — qué va en cada diapositiva

Guion de la exposición final (**entregable E6**), medido para **15 minutos en
total**: 7:30 de diapositivas y el resto de demostración en vivo.

## De dónde sale esta estructura

El documento de alcance no describe la presentación más allá de definir el
entregable **E6 — «Presentación final del proyecto con demostración en vivo de
los flujos principales»**. Lo que se evalúa, por tanto, es la **rúbrica** (§6) y
los **criterios de aceptación** (§7). Cada lámina defiende un criterio, y el
orden va de mayor a menor peso:

| Criterio de la rúbrica | Peso | Dónde se defiende |
|---|---|---|
| Alcance funcional implementado | 25 % | Lámina 1 y, sobre todo, **la demo** |
| Arquitectura de microfrontends | 15 % | Lámina 4 |
| Arquitectura de microservicios | 15 % | Lámina 5 |
| Modelo de datos y persistencia | 15 % | Lámina 6 |
| Reglas de negocio y validaciones | 10 % | Láminas 7 y 8 |
| Módulo de reportes básicos | 10 % | Lámina 9 |
| Calidad técnica y documentación | 10 % | Láminas 2 y 10 |

El 25 % de mayor peso **no se gana en una diapositiva, se gana en la demo**.
Por eso las láminas se quedan en 7:30 de los 15 minutos: todo lo demás es el
sistema corriendo.

## Las doce láminas

| # | Lámina | Min | Qué tiene que quedar dicho |
|---|---|---|---|
| — | Portada | 0:15 | No se lee en voz alta |
| 1 | Lo que pedía el documento de alcance | 0:45 | Dos roles, ocho reglas, seis criterios — y lo que queda **fuera** (§3.5) |
| 2 | No fue *vibe coding*: Spec Kit | 0:50 | El esfuerzo se puso **antes** de generar código, con cifras |
| 3 | Once contenedores, un solo origen | 0:50 | El mapa completo de arriba abajo, en veinte segundos |
| 4 | Un host, tres remotes | 0:50 | Se resuelven en ejecución, y se redespliega uno solo |
| 5 | Cuatro servicios y un gateway | 0:45 | Responsabilidades, contrato OpenAPI, `ms-reportes` sin base |
| 6 | Tres bases aisladas | 0:45 | El aislamiento es un **permiso denegado**, no una convención |
| 7 | Ocho reglas, dónde vive cada una | 0:35 | Ninguna regla vive solo en la prosa del informe |
| 8 | **RN-02: validar en el servicio no basta** | 0:35 | La carrera, el `EXCLUDE`, y por qué el `WHERE` es el que libera el bloque |
| 9 | Los cuatro indicadores | 0:35 | Y el anuncio: en la demo el número se mueve |
| 10 | Un comando, once contenedores | 0:35 | Las cuatro cifras y el mecanismo de cada atributo de calidad |
| 11 | Lo que vais a ver corriendo | 0:20 | Se proyecta **mientras se cambia de ventana** |
| 12 | Los seis criterios de aceptación | 0:40 | La tabla que el evaluador busca |
| — | Gracias / ¿Preguntas? | — | |

### Las tres láminas que hay que saber defender

**Lámina 2 (Spec Kit).** El mensaje no es «usamos una herramienta», es que los
prompts de `/specify` se escribieron con el alcance entero traducido a
escenarios verificables **antes** de generar código: 48 requisitos, 31
escenarios *Given/When/Then*, 10 criterios medibles, 4 contratos OpenAPI y 134
tareas. Por eso el resto de la charla puede señalar el archivo del que sale
cada cosa. Si preguntan «¿cuánto lo escribió el modelo?», la respuesta honesta
es que la especificación la escribimos nosotros y el código salió de ella.

**Lámina 6 (aislamiento de datos).** La salida de `psql` es real, capturada
contra el contenedor. Se puede repetir en vivo:

```bash
docker compose exec postgres \
  psql "postgresql://reservas_app:reservas_app@localhost/canchas_db"
# FATAL: permission denied for database "canchas_db"
```

**Lámina 8 (RN-02).** La rúbrica dice literalmente «en especial la validación
de solapamiento de horarios». La historia: dos peticiones simultáneas preguntan
«¿está libre?», las dos oyen que sí, las dos insertan. La comprobación en el
servicio es necesaria para dar un mensaje decente; **la restricción de la base
es la que hace que la regla sea cierta**.

## La demostración — todo el tiempo restante

**Los ocho pasos** (lámina 11):

1. Entrar como socio y ver disponibilidad de una cancha para hoy.
2. Reservar un bloque libre.
3. Intentar reservar **el mismo bloque** desde otra sesión → rechazado (RN-02).
4. Cancelar desde «mis reservas».
5. Comprobar que el bloque volvió a estar libre (RN-05).
6. Como administrador: crear una cancha y verla en el catálogo del socio.
7. Cancelar la reserva de otro usuario (RN-03).
8. Abrir reportes: el número refleja lo que acaba de pasar.

El paso 3 es el momento importante de toda la charla: el 10 % de reglas de
negocio y parte del 25 % de alcance, demostrado en diez segundos.

**Regla de la casa:** el sistema se levanta **antes** de entrar al aula. Un
`docker compose up` en frío tarda minutos, y son minutos de silencio. La lista
de comprobación previa está en las láminas de respaldo.

**Plan B:** un vídeo corto de la demo, ya abierto en el escritorio, por si
falla la red o el proyector. Grábalo.

## Láminas de respaldo (apéndice)

No cuentan en la numeración ni en la barra de progreso. Son las respuestas ya
maquetadas a lo que uno espera que pregunten:

- Índice de respaldo (para el ponente)
- Las cuatro vistas C4 completas y el modelo entidad-relación
- Componentes del `shell`, `api-gateway`, `ms-canchas`, `ms-usuarios`, `ms-reportes`
- Reglas de negocio → respuestas HTTP (verificadas contra `ErrorHandler`)
- Estrategia de pruebas
- Lista de comprobación previa a la demo
- Preguntas que esperamos

**Apunta el número de cada lámina de respaldo en un papel.** Buscar una pasando
páginas delante del público arruina el efecto.

## Lo que queda por decidir

| Dónde | Qué falta |
|---|---|
| `config/datos.tex` | La **ciudad** de la portada |
| `config/datos.tex` | **Quién expone cada bloque** — no se imprime con `\guiafalse`, así que no bloquea |
| Ensayo | Cronometrar: si las láminas pasan de 8 minutos, se recorta la 2 y luego la 3 |
| Víspera | Revisar las marcas de la lámina 12 **con el sistema delante** |

Un criterio dado por bueno que luego falla en la demo cuesta más que uno
declarado pendiente.
