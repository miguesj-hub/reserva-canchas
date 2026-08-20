/**
 * Sistema de Reserva de Canchas Deportivas
 * Modelo C4 en Structurizr DSL
 *
 * Desarrollo de Aplicaciones Empresariales — Maestría en Ingeniería de Software
 *
 * Vistas incluidas:
 *   1. Contexto      — el sistema y sus usuarios
 *   2. Contenedores  — microfrontends, gateway, microservicios y bases de datos
 *   3. Componentes   — interior de ms-reservas (donde viven las reglas RN-01..RN-08)
 *   4. Despliegue    — cómo se materializa todo en Docker Compose
 *
 * Levantar el visor:  docker compose up -d   (en esta misma carpeta)
 */
workspace "Sistema de Reserva de Canchas Deportivas" "Arquitectura de microfrontends y microservicios para la reserva de canchas de pádel, tenis y básquet." {

    model {

        // ===================================================================
        //  Actores
        // ===================================================================
        usuarioFinal = person "Usuario Final" "Consulta disponibilidad, crea y cancela sus propias reservas."
        administrador = person "Administrador" "Gestiona el catálogo de canchas, cancela cualquier reserva y consulta los reportes de ocupación."

        // ===================================================================
        //  Sistema
        // ===================================================================
        sistema = softwareSystem "Sistema de Reserva de Canchas" "Permite reservar canchas deportivas por bloques horarios, con gestión administrativa y reportes de ocupación." {

            // --- Capa de entrada -------------------------------------------
            edge = container "Edge" "Publica el shell, los microfrontends remotos y la API bajo un mismo origen (http://localhost). Al unificar el origen desaparece el CORS de los chunks federados y los remotes dejan de depender de hostnames internos de Docker." "nginx 1.27" {
                tags "Infraestructura"
            }

            // --- Microfrontends --------------------------------------------
            shell = container "Shell (host)" "Contenedor principal: layout, navegación, sesión del usuario y orquestación de los remotes en tiempo de ejecución." "React + Module Federation" {
                tags "Microfrontend" "Host"

                // --- Componentes internos ---------------------------------
                routerShell = component "Router" "Define las rutas de nivel superior y resuelve a qué remote delegar cada una." "React Router"
                layoutShell = component "Layout" "Estructura visual común (header, navegación) que envuelve al remote activo." "React"
                sesionContext = component "SesionContext" "Mantiene la identidad y el rol del usuario autenticado, y expone el estado de sesión al shell y a los remotes." "React Context"
                remoteLoader = component "RemoteLoader" "Carga en tiempo de ejecución el remoteEntry.js de cada microfrontend." "Module Federation"
            }

            mfReservas = container "mf-reservas" "Consulta de disponibilidad, creación y cancelación de reservas del usuario final." "React + Module Federation (remote)" {
                tags "Microfrontend"

                // --- Componentes internos ---------------------------------
                vistasReservas = component "Vistas" "Pantallas de disponibilidad, creación y cancelación de reservas, y el historial \"Mis reservas\"." "React Router (rutas del remote)"
                componentesReservas = component "Componentes UI" "Piezas reutilizables: calendario de bloques, tarjeta de reserva, selector de cancha." "React"
                estadoReservas = component "Estado" "Mantiene en memoria la cancha/fecha seleccionada y el resultado de disponibilidad mientras el usuario arma la reserva." "React Context / hooks"
                apiClientReservas = component "ApiClient" "Encapsula las llamadas HTTP a /api/reservas y /api/disponibilidad." "Fetch API"
            }

            mfAdministracion = container "mf-administracion" "Gestión del catálogo de canchas, horarios, bloqueos y cancelación de cualquier reserva." "React + Module Federation (remote)" {
                tags "Microfrontend"

                // --- Componentes internos ---------------------------------
                vistasAdministracion = component "Vistas" "Pantallas de catálogo de canchas, horarios, bloqueos por mantenimiento y cancelación administrativa de reservas." "React Router (rutas del remote)"
                componentesAdministracion = component "Componentes UI" "Piezas reutilizables: formulario de cancha, tabla de reservas, editor de horarios." "React"
                estadoAdministracion = component "Estado" "Mantiene el formulario y los filtros activos mientras el administrador edita el catálogo." "React Context / hooks"
                apiClientAdministracion = component "ApiClient" "Encapsula las llamadas HTTP a /api/canchas y /api/reservas." "Fetch API"
            }

            mfReportes = container "mf-reportes" "Visualización de los reportes de ocupación, reservas por período y cancelaciones." "React + Module Federation (remote)" {
                tags "Microfrontend"

                // --- Componentes internos ---------------------------------
                vistasReportes = component "Vistas" "Pantallas de ocupación, reservas por período y cancelaciones." "React Router (rutas del remote)"
                componentesReportes = component "Componentes UI" "Piezas reutilizables: gráficos y tablas de reporte, selector de rango de fechas." "React"
                estadoReportes = component "Estado" "Mantiene el rango de fechas y los filtros seleccionados por el administrador." "React Context / hooks"
                apiClientReportes = component "ApiClient" "Encapsula las llamadas HTTP a /api/reportes." "Fetch API"
            }

            // --- API Gateway -----------------------------------------------
            gateway = container "API Gateway" "Punto de entrada único a la API. Identifica al usuario autenticado (RN-03) y enruta cada petición al microservicio correspondiente." "Spring Cloud Gateway (:8080)" {
                tags "Gateway"

                // --- Componentes internos ---------------------------------
                // Autenticación básica con roles (§4.4 del alcance): no se
                // exige un mecanismo avanzado tipo OAuth2/JWT.
                autenticacionFilter = component "AutenticacionFilter" "Identifica al usuario de la petición entrante y propaga su identidad y rol como cabeceras X-Usuario-Id / X-Usuario-Rol." "GlobalFilter"
                routeConfig = component "RouteConfig" "Define las rutas hacia cada microservicio (predicates y filtros)." "Spring Cloud Gateway (RouteLocator)"
                manejadorErroresGateway = component "ManejadorDeErrores" "Traduce fallos de los microservicios destino (timeout, no disponible) o identidad ausente/inválida a códigos HTTP." "ErrorWebExceptionHandler"
            }

            // --- Microservicios ---------------------------------------------
            msUsuarios = container "ms-usuarios" "Registro, autenticación y gestión de usuarios y roles. Valida las credenciales del usuario final o administrador y confirma su rol." "Spring Boot 4 (:8081)" {
                tags "Microservicio"

                // --- Componentes internos ---------------------------------
                usuarioController = component "UsuarioController" "Expone los endpoints de registro, login y gestión de usuarios y roles." "Spring MVC @RestController"
                usuarioService = component "UsuarioService" "Valida las credenciales (usuario/contraseña) y gestiona el ciclo de vida de usuarios y roles." "Spring @Service"
                usuarioRepository = component "UsuarioRepository" "Acceso a la tabla de usuarios y roles." "Spring Data JPA"
                manejadorErroresUsuarios = component "ManejadorDeErrores" "Traduce credenciales inválidas y conflictos (usuario ya registrado) a códigos HTTP." "@RestControllerAdvice"
            }

            msCanchas = container "ms-canchas" "Catálogo de canchas y deportes, horarios de atención y bloqueos por mantenimiento." "Spring Boot 4 (:8082)" {
                tags "Microservicio"

                // --- Componentes internos ---------------------------------
                canchaController = component "CanchaController" "Expone los endpoints del catálogo de canchas, horarios de atención y bloqueos por mantenimiento." "Spring MVC @RestController"
                canchaService = component "CanchaService" "Aplica las reglas del catálogo: activación de canchas, validación de horarios y bloqueos." "Spring @Service"
                canchaRepository = component "CanchaRepository" "Acceso a canchas, horarios y bloqueos." "Spring Data JPA"
                manejadorErroresCanchas = component "ManejadorDeErrores" "Traduce canchas inexistentes o inactivas a códigos HTTP." "@RestControllerAdvice"
            }

            msReservas = container "ms-reservas" "Creación, consulta y cancelación de reservas. Concentra las reglas de negocio RN-01 a RN-08." "Spring Boot 4 (:8083)" {
                tags "Microservicio"

                // --- Componentes internos ---------------------------------
                // Nota: reservas y disponibilidad viven en un único controller
                // y un único service en el código (ReservaController /
                // ReservaService); no existen clases Disponibilidad* separadas.
                reservaController = component "ReservaController" "Expone los endpoints REST de reservas y disponibilidad, y traduce las violaciones de reglas de negocio a códigos HTTP (409 ante solapamiento)." "Spring MVC @RestController"
                reservaService = component "ReservaService" "Aplica las reglas de negocio: calcula la disponibilidad, límite de reservas activas (RN-06), cancelación solo de reservas futuras (RN-04) y permisos por rol (RN-03)." "Spring @Service"
                canchaClient = component "CanchaClient" "Consulta a ms-canchas que la cancha exista, esté activa y que el bloque caiga dentro de su horario de atención." "Spring RestClient"
                reservaRepository = component "ReservaRepository" "Acceso a la tabla reservas. La restricción EXCLUDE de PostgreSQL garantiza el no solapamiento (RN-02) incluso ante peticiones concurrentes." "Spring Data JPA"
                configuracionRepository = component "ConfiguracionRepository" "Lee los parámetros configurables, como el máximo de reservas activas simultáneas." "Spring Data JPA"
                manejadorErroresReservas = component "ManejadorDeErrores" "Traduce las excepciones de negocio (solapamiento, permisos, reserva no encontrada) a códigos HTTP." "@RestControllerAdvice"
            }

            msReportes = container "ms-reportes" "Genera los reportes de ocupación, reservas por período y cancelaciones. No tiene base de datos propia: agrega vía REST para respetar la independencia de datos entre microservicios." "Spring Boot 4 (:8084)" {
                tags "Microservicio"

                // --- Componentes internos ---------------------------------
                reporteController = component "ReporteController" "Expone los endpoints de ocupación, reservas por período y cancelaciones." "Spring MVC @RestController"
                reporteService = component "ReporteService" "Agrega y calcula las métricas de ocupación combinando reservas y catálogo." "Spring @Service"
                clienteReservas = component "ReservasClient" "Consulta a ms-reservas las reservas del período." "Spring RestClient"
                clienteCanchas = component "CanchasClient" "Consulta a ms-canchas el catálogo de canchas y sus horarios." "Spring RestClient"
                manejadorErroresReportes = component "ManejadorDeErrores" "Traduce los fallos de los servicios origen (no disponible) a códigos HTTP." "@RestControllerAdvice"
            }

            // --- Persistencia ------------------------------------------------
            usuariosDb = container "usuarios_db" "Usuarios, roles y credenciales." "PostgreSQL 16" {
                tags "Base de Datos"
            }

            canchasDb = container "canchas_db" "Canchas, deportes, horarios de atención y bloqueos de mantenimiento." "PostgreSQL 16" {
                tags "Base de Datos"
            }

            reservasDb = container "reservas_db" "Reservas con su estado, más los parámetros configurables. Aloja la restricción de exclusión que implementa RN-02." "PostgreSQL 16" {
                tags "Base de Datos"
            }
        }

        // ===================================================================
        //  Relaciones — nivel de contexto
        // ===================================================================
        usuarioFinal -> sistema "Consulta disponibilidad, reserva y cancela sus reservas"
        administrador -> sistema "Gestiona canchas y reservas, y consulta reportes"

        // ===================================================================
        //  Relaciones — nivel de contenedores
        // ===================================================================
        usuarioFinal -> edge "Accede a la aplicación" "HTTP :80"
        administrador -> edge "Accede a la aplicación" "HTTP :80"

        edge -> shell "Sirve la aplicación contenedora" "HTTP"
        edge -> mfReservas "Sirve /mf-reservas/" "HTTP"
        edge -> mfAdministracion "Sirve /mf-administracion/" "HTTP"
        edge -> mfReportes "Sirve /mf-reportes/" "HTTP"
        edge -> gateway "Enruta /api/*" "HTTP"

        shell -> mfReservas "Carga el remote en tiempo de ejecución" "Module Federation (remoteEntry.js)"
        shell -> mfAdministracion "Carga el remote en tiempo de ejecución" "Module Federation (remoteEntry.js)"
        shell -> mfReportes "Carga el remote en tiempo de ejecución" "Module Federation (remoteEntry.js)"

        shell -> edge "Autentica al usuario" "JSON/HTTPS · /api/auth"
        mfReservas -> edge "Consulta disponibilidad y gestiona reservas" "JSON/HTTPS · /api"
        mfAdministracion -> edge "Gestiona canchas y reservas" "JSON/HTTPS · /api"
        mfReportes -> edge "Solicita los reportes" "JSON/HTTPS · /api"

        gateway -> msUsuarios "Enruta /api/auth y /api/usuarios" "JSON/HTTP"
        gateway -> msCanchas "Enruta /api/canchas" "JSON/HTTP"
        gateway -> msReservas "Enruta /api/reservas y /api/disponibilidad" "JSON/HTTP"
        gateway -> msReportes "Enruta /api/reportes" "JSON/HTTP"

        msReservas -> msCanchas "Valida que la cancha exista, esté activa y el bloque esté dentro de su horario" "JSON/HTTP (síncrono)"
        msReportes -> msReservas "Obtiene las reservas del período" "JSON/HTTP (síncrono)"
        msReportes -> msCanchas "Obtiene el catálogo de canchas y sus horarios" "JSON/HTTP (síncrono)"

        msUsuarios -> usuariosDb "Lee y escribe" "JDBC"
        msCanchas -> canchasDb "Lee y escribe" "JDBC"
        msReservas -> reservasDb "Lee y escribe" "JDBC"

        // ===================================================================
        //  Relaciones — nivel de componentes (ms-reservas)
        // ===================================================================
        gateway -> reservaController "Enruta /api/reservas y /api/disponibilidad" "JSON/HTTP"

        reservaController -> reservaService "Invoca"
        reservaController -> manejadorErroresReservas "Excepciones no controladas"

        reservaService -> canchaClient "Valida la cancha y obtiene su horario de atención"
        reservaService -> reservaRepository "Persiste, consulta y calcula disponibilidad sobre las reservas"
        reservaService -> configuracionRepository "Lee el máximo de reservas activas (RN-06)"

        canchaClient -> msCanchas "Consulta el catálogo" "JSON/HTTP"
        reservaRepository -> reservasDb "Lee y escribe" "JDBC"
        configuracionRepository -> reservasDb "Lee" "JDBC"

        // ===================================================================
        //  Relaciones — nivel de componentes (ms-usuarios)
        // ===================================================================
        gateway -> usuarioController "Enruta /api/auth y /api/usuarios" "JSON/HTTP"

        usuarioController -> usuarioService "Invoca"
        usuarioController -> manejadorErroresUsuarios "Excepciones no controladas"

        usuarioService -> usuarioRepository "Persiste y consulta usuarios y roles"

        usuarioRepository -> usuariosDb "Lee y escribe" "JDBC"

        // ===================================================================
        //  Relaciones — nivel de componentes (ms-canchas)
        // ===================================================================
        gateway -> canchaController "Enruta /api/canchas" "JSON/HTTP"

        canchaController -> canchaService "Invoca"
        canchaController -> manejadorErroresCanchas "Excepciones no controladas"

        canchaService -> canchaRepository "Persiste y consulta el catálogo"

        canchaRepository -> canchasDb "Lee y escribe" "JDBC"

        // ===================================================================
        //  Relaciones — nivel de componentes (ms-reportes)
        // ===================================================================
        gateway -> reporteController "Enruta /api/reportes" "JSON/HTTP"

        reporteController -> reporteService "Invoca"
        reporteController -> manejadorErroresReportes "Excepciones no controladas"

        reporteService -> clienteReservas "Obtiene las reservas del período"
        reporteService -> clienteCanchas "Obtiene el catálogo de canchas y sus horarios"

        clienteReservas -> msReservas "Obtiene las reservas del período" "JSON/HTTP (síncrono)"
        clienteCanchas -> msCanchas "Obtiene el catálogo de canchas y sus horarios" "JSON/HTTP (síncrono)"

        // ===================================================================
        //  Relaciones — nivel de componentes (Gateway)
        // ===================================================================
        edge -> autenticacionFilter "Enruta /api/*" "HTTP"

        autenticacionFilter -> routeConfig "Identidad propagada, continúa el enrutamiento"
        autenticacionFilter -> manejadorErroresGateway "Identidad ausente o inválida"

        routeConfig -> msUsuarios "Enruta /api/auth y /api/usuarios" "JSON/HTTP"
        routeConfig -> msCanchas "Enruta /api/canchas" "JSON/HTTP"
        routeConfig -> msReservas "Enruta /api/reservas y /api/disponibilidad" "JSON/HTTP"
        routeConfig -> msReportes "Enruta /api/reportes" "JSON/HTTP"
        routeConfig -> manejadorErroresGateway "Servicio destino no disponible"

        // ===================================================================
        //  Relaciones — nivel de componentes (Shell)
        // ===================================================================
        routerShell -> sesionContext "Consulta si hay sesión activa antes de resolver la ruta"
        routerShell -> layoutShell "Renderiza dentro de"
        layoutShell -> remoteLoader "Monta el remote correspondiente a la ruta activa"

        sesionContext -> edge "Autentica al usuario" "JSON/HTTPS · /api/auth"
        remoteLoader -> mfReservas "Carga el remote en tiempo de ejecución" "Module Federation (remoteEntry.js)"
        remoteLoader -> mfAdministracion "Carga el remote en tiempo de ejecución" "Module Federation (remoteEntry.js)"
        remoteLoader -> mfReportes "Carga el remote en tiempo de ejecución" "Module Federation (remoteEntry.js)"

        // ===================================================================
        //  Relaciones — nivel de componentes (mf-reservas)
        // ===================================================================
        vistasReservas -> componentesReservas "Compone la pantalla con"
        vistasReservas -> estadoReservas "Lee y actualiza"
        vistasReservas -> apiClientReservas "Solicita datos"
        apiClientReservas -> edge "Consulta disponibilidad y gestiona reservas" "JSON/HTTPS · /api"

        // ===================================================================
        //  Relaciones — nivel de componentes (mf-administracion)
        // ===================================================================
        vistasAdministracion -> componentesAdministracion "Compone la pantalla con"
        vistasAdministracion -> estadoAdministracion "Lee y actualiza"
        vistasAdministracion -> apiClientAdministracion "Solicita datos"
        apiClientAdministracion -> edge "Gestiona canchas y reservas" "JSON/HTTPS · /api"

        // ===================================================================
        //  Relaciones — nivel de componentes (mf-reportes)
        // ===================================================================
        vistasReportes -> componentesReportes "Compone la pantalla con"
        vistasReportes -> estadoReportes "Lee y actualiza"
        vistasReportes -> apiClientReportes "Solicita datos"
        apiClientReportes -> edge "Solicita los reportes" "JSON/HTTPS · /api"

        // ===================================================================
        //  Despliegue — Docker Compose
        // ===================================================================
        deploymentEnvironment "Local (Docker Compose)" {

            equipo = deploymentNode "Equipo del desarrollador" "Entorno de evaluación del proyecto." "macOS / Linux / Windows" {

                docker = deploymentNode "Docker Engine" "Orquestado con Docker Compose v2." "Docker 24+" {

                    redFrontend = deploymentNode "Red: frontend" "Red bridge que aísla los contenedores de presentación." "docker network (bridge)" {

                        nodoEdge = deploymentNode "rc-edge" "Único contenedor conectado a ambas redes." "nginx:1.27-alpine · puerto 80" {
                            containerInstance edge
                        }

                        deploymentNode "rc-shell" "" "nginx:1.27-alpine · puerto 3000" {
                            containerInstance shell
                        }
                        deploymentNode "rc-mf-reservas" "" "nginx:1.27-alpine · puerto 3001" {
                            containerInstance mfReservas
                        }
                        deploymentNode "rc-mf-administracion" "" "nginx:1.27-alpine · puerto 3002" {
                            containerInstance mfAdministracion
                        }
                        deploymentNode "rc-mf-reportes" "" "nginx:1.27-alpine · puerto 3003" {
                            containerInstance mfReportes
                        }
                    }

                    redBackend = deploymentNode "Red: backend" "Red bridge que aísla la API y la persistencia." "docker network (bridge)" {

                        deploymentNode "rc-gateway" "" "eclipse-temurin:21-jre · puerto 8080" {
                            containerInstance gateway
                        }
                        deploymentNode "rc-ms-usuarios" "" "eclipse-temurin:21-jre · puerto 8081" {
                            containerInstance msUsuarios
                        }
                        deploymentNode "rc-ms-canchas" "" "eclipse-temurin:21-jre · puerto 8082" {
                            containerInstance msCanchas
                        }
                        deploymentNode "rc-ms-reservas" "" "eclipse-temurin:21-jre · puerto 8083" {
                            containerInstance msReservas
                        }
                        deploymentNode "rc-ms-reportes" "" "eclipse-temurin:21-jre · puerto 8084" {
                            containerInstance msReportes
                        }

                        nodoPostgres = deploymentNode "rc-postgres" "Una sola instancia con tres bases independientes. Cada microservicio recibe credenciales que solo le permiten conectarse a la suya: el aislamiento lo impone el motor, no una convención." "postgres:16-alpine · puerto 5432" {
                            deploymentNode "usuarios_db" "" "PostgreSQL database" {
                                containerInstance usuariosDb
                            }
                            deploymentNode "canchas_db" "" "PostgreSQL database" {
                                containerInstance canchasDb
                            }
                            deploymentNode "reservas_db" "" "PostgreSQL database" {
                                containerInstance reservasDb
                            }
                        }

                        volumen = infrastructureNode "Volumen pgdata" "Volumen Docker con los datos de PostgreSQL. Los scripts de infra/postgres/init se ejecutan solo cuando está vacío." "docker volume" {
                            tags "Infraestructura"
                        }
                    }

                    // Las relaciones entre contenedores se replican solas entre
                    // sus instancias; aquí solo hace falta declarar la que
                    // involucra al nodo de infraestructura.
                    nodoPostgres -> volumen "Persiste los datos en" "sistema de archivos"
                }
            }
        }
    }

    // =======================================================================
    //  Vistas
    // =======================================================================
    views {

        // NOTA SOBRE EL LAYOUT
        // Ninguna vista lleva `autoLayout`: una vista con layout automático se
        // ordena sola, pero Structurizr bloquea el arrastre de sus elementos.
        // Las posiciones iniciales de las cuatro vistas están guardadas en
        // workspace.json, así que abren ordenadas y se pueden mover a mano; al
        // arrastrar aparece el botón de guardar y las nuevas posiciones se
        // escriben en ese mismo archivo.
        //
        // Conviene versionar workspace.json junto a este .dsl: es lo que
        // conserva el layout. Si se añade `autoLayout` a una vista y luego se
        // quita, hay que borrar también la clave "automaticLayout" que quedó
        // escrita en workspace.json, o el visor la seguirá aplicando.

        systemContext sistema "01-Contexto" "Nivel 1 — El sistema y sus usuarios." {
            include *
        }

        container sistema "02-Contenedores" "Nivel 2 — Microfrontends, gateway, microservicios y bases de datos." {
            include *
        }

        component msReservas "03-Componentes-ms-reservas" "Nivel 3 — Interior de ms-reservas, donde se aplican las reglas de negocio." {
            include *
        }

        deployment sistema "Local (Docker Compose)" "04-Despliegue" "Materialización del sistema en contenedores Docker." {
            include *
        }

        component msUsuarios "05-Componentes-ms-usuarios" "Nivel 3 — Interior de ms-usuarios: registro y autenticación básica con roles." {
            include *
        }

        component msCanchas "06-Componentes-ms-canchas" "Nivel 3 — Interior de ms-canchas: catálogo, horarios y bloqueos." {
            include *
        }

        component msReportes "07-Componentes-ms-reportes" "Nivel 3 — Interior de ms-reportes: agregación vía REST sin base propia." {
            include *
        }

        component gateway "08-Componentes-gateway" "Nivel 3 — Interior del API Gateway: identificación del usuario y enrutamiento." {
            include *
        }

        component shell "09-Componentes-shell" "Nivel 3 — Interior del shell: layout, sesión y carga de remotes." {
            include *
        }

        component mfReservas "10-Componentes-mf-reservas" "Nivel 3 — Interior de mf-reservas." {
            include *
        }

        component mfAdministracion "11-Componentes-mf-administracion" "Nivel 3 — Interior de mf-administracion." {
            include *
        }

        component mfReportes "12-Componentes-mf-reportes" "Nivel 3 — Interior de mf-reportes." {
            include *
        }

        // --- Estilos --------------------------------------------------------
        styles {
            element "Person" {
                shape Person
                background #0b5394
                color #ffffff
                fontSize 22
            }

            element "Software System" {
                background #1168bd
                color #ffffff
            }

            element "Container" {
                background #438dd5
                color #ffffff
            }

            element "Microfrontend" {
                background #6b4fbb
                color #ffffff
                shape WebBrowser
            }

            element "Host" {
                background #4b2e83
            }

            element "Gateway" {
                background #b5651d
                color #ffffff
                shape Hexagon
            }

            element "Microservicio" {
                background #2e8b57
                color #ffffff
                shape RoundedBox
            }

            element "Base de Datos" {
                background #7a5195
                color #ffffff
                shape Cylinder
            }

            element "Infraestructura" {
                background #6c757d
                color #ffffff
                shape Pipe
            }

            element "Component" {
                background #85bbf0
                color #000000
            }

            element "Deployment Node" {
                background #ffffff
                color #444444
                stroke #888888
            }

            relationship "Relationship" {
                thickness 2
                fontSize 20
            }
        }
    }
}
