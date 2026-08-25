/**
 * Sports Court Booking System
 * C4 model in Structurizr DSL
 *
 * Desarrollo de Aplicaciones Empresariales — Maestría en Ingeniería de Software
 *
 * Views included:
 *   01. Context               — the system and its users
 *   02. Containers             — microfrontends, gateway, microservices, and databases
 *   03. Components (ms-reservas)   — where rules RN-01..RN-08 live
 *   04. Deployment              — how it all materializes in Docker Compose
 *   05-08. Components (ms-usuarios, ms-canchas, ms-reportes, gateway)
 *   09-12. Components (shell, mf-reservas, mf-administracion, mf-reportes)
 *
 * Start the viewer:  docker compose up -d   (in this same folder)
 */
workspace "Sports Court Booking System" "Microfrontend and microservices architecture for booking padel, tennis, and basketball courts." {

    model {

        // ===================================================================
        //  Actors
        // ===================================================================
        usuarioFinal = person "End User" "Checks availability, creates and cancels their own bookings."
        administrador = person "Administrator" "Manages the court catalog, cancels any booking, and views occupancy reports."

        // ===================================================================
        //  System
        // ===================================================================
        sistema = softwareSystem "Court Booking System" "Allows booking sports courts by time blocks, with administrative management and occupancy reports." {

            // --- Entry layer -------------------------------------------
            edge = container "Edge" "Serves the shell, the remote microfrontends, and the API under a single origin (http://localhost)." "nginx 1.27" {
                tags "Infrastructure"
            }

            // --- Microfrontends --------------------------------------------
            shell = container "Shell (host)" "Main container: layout, navigation, user session, and runtime orchestration of the remotes." "React + Module Federation" {
                tags "Microfrontend" "Host"

                // --- Internal components ---------------------------------
                routerShell = component "Router" "Defines the top-level routes and resolves which remote to delegate each one to." "React Router"
                layoutShell = component "Layout" "Shared visual structure (header, navigation) that wraps the active remote." "React"
                sessionContext = component "SessionContext" "Holds the authenticated user's identity and role, and exposes session state to the shell and the remotes." "React Context"
                remoteLoader = component "RemoteLoader" "Loads each microfrontend's remoteEntry.js at runtime." "Module Federation"
            }

            mfReservas = container "mf-reservas" "Availability lookup, booking creation, and cancellation for the end user." "React + Module Federation (remote)" {
                tags "Microfrontend"

                // --- Internal components ---------------------------------
                viewsReservas = component "Views" "Availability, booking creation and cancellation screens, and the \"My Bookings\" history." "React Router (remote routes)"
                uiComponentsReservas = component "UI Components" "Reusable pieces: time-block calendar, booking card, court selector." "React"
                stateReservas = component "State" "Holds the selected court/date and the availability result while the user builds a booking." "React Context / hooks"
                apiClientReservas = component "ApiClient" "Wraps the HTTP calls to /api/reservas and /api/disponibilidad." "Fetch API"
            }

            mfAdministracion = container "mf-administracion" "Management of the court catalog, schedules, blocks, and cancellation of any booking." "React + Module Federation (remote)" {
                tags "Microfrontend"

                // --- Internal components ---------------------------------
                viewsAdministracion = component "Views" "Court catalog, schedules, maintenance blocks, and administrative booking-cancellation screens." "React Router (remote routes)"
                uiComponentsAdministracion = component "UI Components" "Reusable pieces: court form, bookings table, schedule editor." "React"
                stateAdministracion = component "State" "Holds the active form and filters while the administrator edits the catalog." "React Context / hooks"
                apiClientAdministracion = component "ApiClient" "Wraps the HTTP calls to /api/canchas and /api/reservas." "Fetch API"
            }

            mfReportes = container "mf-reportes" "Displays occupancy reports, bookings by period, and cancellations." "React + Module Federation (remote)" {
                tags "Microfrontend"

                // --- Internal components ---------------------------------
                viewsReportes = component "Views" "Occupancy, bookings-by-period, and cancellations screens." "React Router (remote routes)"
                uiComponentsReportes = component "UI Components" "Reusable pieces: report charts and tables, date-range picker." "React"
                stateReportes = component "State" "Holds the date range and filters selected by the administrator." "React Context / hooks"
                apiClientReportes = component "ApiClient" "Wraps the HTTP calls to /api/reportes." "Fetch API"
            }

            // --- API Gateway -----------------------------------------------
            gateway = container "API Gateway" "Single entry point to the API. Identifies the authenticated user (RN-03) and routes each request to the corresponding microservice." "Spring Cloud Gateway (:8080)" {
                tags "Gateway"

                // --- Internal components ---------------------------------
                // Basic role-based authentication (scope document §4.4): no
                // advanced mechanism such as OAuth2/JWT is required.
                authenticationFilter = component "AuthenticationFilter" "Identifies the user making the request and propagates their identity and role as X-Usuario-Id / X-Usuario-Rol headers." "GlobalFilter"
                routeConfig = component "RouteConfig" "Defines the routes to each microservice (predicates and filters)." "Spring Cloud Gateway (RouteLocator)"
                errorHandlerGateway = component "ErrorHandler" "Translates failures from the target microservices (timeout, unavailable) or missing/invalid identity into HTTP status codes." "ErrorWebExceptionHandler"
            }

            // --- Microservices (hexagonal: ports & adapters) ---------------
            // Each microservice's core (use case + port interfaces) has no
            // dependency on Spring MVC or Spring Data; only the adapters do.
            // Driving adapters (web) call the input port; the application
            // service implements it. The application service depends only on
            // output ports; driven adapters (JPA, RestClient) implement them.
            msUsuarios = container "ms-usuarios" "Registration, authentication, and management of users and roles. Validates the end user's or administrator's credentials and confirms their role." "Spring Boot 4 (:8081)" {
                tags "Microservice"

                // --- Driving adapter (web) --------------------------------
                userController = component "UserController" "Exposes the registration, login, and user/role management endpoints; translates HTTP requests into calls to the input port." "Spring MVC @RestController" {
                    tags "Adapter-In"
                }
                errorHandlerUser = component "ErrorHandler" "Translates invalid credentials and conflicts (user already registered) into HTTP status codes." "@RestControllerAdvice" {
                    tags "Adapter-In"
                }

                // --- Domain: input port + application ---------------------
                userUseCase = component "UserUseCase" "Input port: registration, authentication, and role management operations, with no dependency on Spring MVC or JPA." "Java interface" {
                    tags "Port"
                }
                userService = component "UserService" "Implements the input port: validates credentials and manages the user and role lifecycle." "Spring @Service" {
                    tags "Application"
                }

                // --- Domain: output port -----------------------------------
                userRepositoryPort = component "UserRepositoryPort" "Output port: persistence operations over users and roles that the application core needs." "Java interface" {
                    tags "Port"
                }

                // --- Driven adapter (persistence) --------------------------
                userRepositoryAdapter = component "UserRepositoryAdapter" "Implements the output port against the users and roles table." "Spring Data JPA" {
                    tags "Adapter-Out"
                }
            }

            msCanchas = container "ms-canchas" "Catalog of courts and sports, opening hours, and maintenance blocks." "Spring Boot 4 (:8082)" {
                tags "Microservice"

                // --- Driving adapter (web) --------------------------------
                courtController = component "CourtController" "Exposes the endpoints for the court catalog, opening hours, and maintenance blocks; translates HTTP requests into calls to the input port." "Spring MVC @RestController" {
                    tags "Adapter-In"
                }
                errorHandlerCourt = component "ErrorHandler" "Translates non-existent or inactive courts into HTTP status codes." "@RestControllerAdvice" {
                    tags "Adapter-In"
                }

                // --- Domain: input port + application ---------------------
                courtUseCase = component "CourtUseCase" "Input port: catalog, schedule, and maintenance-block operations, with no dependency on Spring MVC or JPA." "Java interface" {
                    tags "Port"
                }
                courtService = component "CourtService" "Implements the input port: applies the catalog rules (court activation, schedule and block validation)." "Spring @Service" {
                    tags "Application"
                }

                // --- Domain: output port -----------------------------------
                courtRepositoryPort = component "CourtRepositoryPort" "Output port: persistence operations over courts, schedules, and blocks that the application core needs." "Java interface" {
                    tags "Port"
                }

                // --- Driven adapter (persistence) --------------------------
                courtRepositoryAdapter = component "CourtRepositoryAdapter" "Implements the output port against the courts, schedules, and blocks tables." "Spring Data JPA" {
                    tags "Adapter-Out"
                }
            }

            msReservas = container "ms-reservas" "Creation, lookup, and cancellation of bookings. Concentrates business rules RN-01 through RN-08." "Spring Boot 4 (:8083)" {
                tags "Microservice"

                // --- Driving adapter (web) --------------------------------
                bookingController = component "BookingController" "Exposes the REST endpoints for bookings and availability; translates HTTP requests into calls to the input port." "Spring MVC @RestController" {
                    tags "Adapter-In"
                }
                errorHandlerBooking = component "ErrorHandler" "Translates business exceptions (overlap, permissions, booking not found) into HTTP status codes (409 on overlap)." "@RestControllerAdvice" {
                    tags "Adapter-In"
                }

                // --- Domain: input port + application ---------------------
                bookingUseCase = component "BookingUseCase" "Input port: create, look up, and cancel bookings; calculate availability. No dependency on Spring MVC or JPA." "Java interface" {
                    tags "Port"
                }
                bookingService = component "BookingService" "Implements the input port: applies RN-01..RN-08 (availability, active-bookings limit RN-06, future-only cancellation RN-04, role-based permissions RN-03)." "Spring @Service" {
                    tags "Application"
                }

                // --- Domain: output ports ------------------------------------
                bookingRepositoryPort = component "BookingRepositoryPort" "Output port: persistence operations over bookings that the application core needs." "Java interface" {
                    tags "Port"
                }
                configurationRepositoryPort = component "ConfigurationRepositoryPort" "Output port: reads configurable parameters, such as the maximum number of simultaneous active bookings." "Java interface" {
                    tags "Port"
                }
                courtClientPort = component "CourtClientPort" "Output port: checks whether a court exists, is active, and its opening hours, without depending on how that check travels over the network." "Java interface" {
                    tags "Port"
                }

                // --- Driven adapters ------------------------------------------
                bookingRepositoryAdapter = component "BookingRepositoryAdapter" "Implements the booking-persistence output port. The PostgreSQL EXCLUDE constraint prevents overlap (RN-02)." "Spring Data JPA" {
                    tags "Adapter-Out"
                }
                configurationRepositoryAdapter = component "ConfigurationRepositoryAdapter" "Implements the configuration-reading output port." "Spring Data JPA" {
                    tags "Adapter-Out"
                }
                courtClientAdapter = component "CourtClientAdapter" "Implements the court-check output port by calling ms-canchas over REST." "Spring RestClient" {
                    tags "Adapter-Out"
                }
            }

            msReportes = container "ms-reportes" "Generates occupancy reports, bookings by period, and cancellations. Has no database of its own: aggregates via REST." "Spring Boot 4 (:8084)" {
                tags "Microservice"

                // --- Driving adapter (web) --------------------------------
                reportController = component "ReportController" "Exposes the occupancy, bookings-by-period, and cancellations endpoints; translates HTTP requests into calls to the input port." "Spring MVC @RestController" {
                    tags "Adapter-In"
                }
                errorHandlerReport = component "ErrorHandler" "Translates failures from the source services (unavailable) into HTTP status codes." "@RestControllerAdvice" {
                    tags "Adapter-In"
                }

                // --- Domain: input port + application ---------------------
                reportUseCase = component "ReportUseCase" "Input port: occupancy, bookings-by-period, and cancellations operations. No dependency on Spring MVC or the REST clients." "Java interface" {
                    tags "Port"
                }
                reportService = component "ReportService" "Implements the input port: aggregates and computes occupancy metrics by combining bookings and catalog data." "Spring @Service" {
                    tags "Application"
                }

                // --- Domain: output ports ------------------------------------
                bookingsClientPort = component "BookingsClientPort" "Output port: gets the period's bookings, without depending on how that call travels over the network." "Java interface" {
                    tags "Port"
                }
                courtsClientPort = component "CourtsClientPort" "Output port: gets the court catalog and schedules, without depending on how that call travels over the network." "Java interface" {
                    tags "Port"
                }

                // --- Driven adapters ------------------------------------------
                bookingsClientAdapter = component "BookingsClientAdapter" "Implements the bookings output port by calling ms-reservas over REST." "Spring RestClient" {
                    tags "Adapter-Out"
                }
                courtsClientAdapter = component "CourtsClientAdapter" "Implements the catalog output port by calling ms-canchas over REST." "Spring RestClient" {
                    tags "Adapter-Out"
                }
            }

            // --- Persistence ------------------------------------------------
            usuariosDb = container "usuarios_db" "Users, roles, and credentials." "PostgreSQL 16" {
                tags "Database"
            }

            canchasDb = container "canchas_db" "Courts, sports, opening hours, and maintenance blocks." "PostgreSQL 16" {
                tags "Database"
            }

            reservasDb = container "reservas_db" "Bookings with their status, plus configurable parameters. Hosts the exclusion constraint that implements RN-02." "PostgreSQL 16" {
                tags "Database"
            }
        }

        // ===================================================================
        //  Relationships — context level
        // ===================================================================
        usuarioFinal -> sistema "Checks availability, books, and cancels their bookings"
        administrador -> sistema "Manages courts and bookings, and views reports"

        // ===================================================================
        //  Relationships — container level
        // ===================================================================
        usuarioFinal -> edge "Accesses the application" "HTTP :80"
        administrador -> edge "Accesses the application" "HTTP :80"

        edge -> shell "Serves the container application" "HTTP"
        edge -> mfReservas "Serves /mf-reservas/" "HTTP"
        edge -> mfAdministracion "Serves /mf-administracion/" "HTTP"
        edge -> mfReportes "Serves /mf-reportes/" "HTTP"
        edge -> gateway "Routes /api/*" "HTTP"

        shell -> mfReservas "Loads the remote at runtime" "Module Federation (remoteEntry.js)"
        shell -> mfAdministracion "Loads the remote at runtime" "Module Federation (remoteEntry.js)"
        shell -> mfReportes "Loads the remote at runtime" "Module Federation (remoteEntry.js)"

        shell -> edge "Authenticates the user" "JSON/HTTPS · /api/auth"
        mfReservas -> edge "Checks availability and manages bookings" "JSON/HTTPS · /api"
        mfAdministracion -> edge "Manages courts and bookings" "JSON/HTTPS · /api"
        mfReportes -> edge "Requests the reports" "JSON/HTTPS · /api"

        gateway -> msUsuarios "Routes /api/auth and /api/usuarios" "JSON/HTTP"
        gateway -> msCanchas "Routes /api/canchas" "JSON/HTTP"
        gateway -> msReservas "Routes /api/reservas and /api/disponibilidad" "JSON/HTTP"
        gateway -> msReportes "Routes /api/reportes" "JSON/HTTP"

        msReservas -> msCanchas "Checks that the court exists, is active, and the block is within its schedule" "JSON/HTTP (synchronous)"
        msReportes -> msReservas "Gets the period's bookings" "JSON/HTTP (synchronous)"
        msReportes -> msCanchas "Gets the court catalog and schedules" "JSON/HTTP (synchronous)"

        msUsuarios -> usuariosDb "Reads and writes" "JDBC"
        msCanchas -> canchasDb "Reads and writes" "JDBC"
        msReservas -> reservasDb "Reads and writes" "JDBC"

        // ===================================================================
        //  Relationships — component level (ms-reservas, hexagonal)
        // ===================================================================
        gateway -> bookingController "Routes /api/reservas and /api/disponibilidad" "JSON/HTTP"

        bookingController -> bookingUseCase "Invokes"
        bookingController -> errorHandlerBooking "Unhandled exceptions"
        bookingService -> bookingUseCase "Implements"

        bookingService -> courtClientPort "Checks the court and gets its opening hours"
        bookingService -> bookingRepositoryPort "Persists, queries, and calculates availability over bookings"
        bookingService -> configurationRepositoryPort "Reads the maximum active bookings (RN-06)"

        courtClientAdapter -> courtClientPort "Implements"
        bookingRepositoryAdapter -> bookingRepositoryPort "Implements"
        configurationRepositoryAdapter -> configurationRepositoryPort "Implements"

        courtClientAdapter -> msCanchas "Queries the catalog" "JSON/HTTP"
        bookingRepositoryAdapter -> reservasDb "Reads and writes" "JDBC"
        configurationRepositoryAdapter -> reservasDb "Reads" "JDBC"

        // ===================================================================
        //  Relationships — component level (ms-usuarios, hexagonal)
        // ===================================================================
        gateway -> userController "Routes /api/auth and /api/usuarios" "JSON/HTTP"

        userController -> userUseCase "Invokes"
        userController -> errorHandlerUser "Unhandled exceptions"
        userService -> userUseCase "Implements"

        userService -> userRepositoryPort "Persists and queries users and roles"
        userRepositoryAdapter -> userRepositoryPort "Implements"

        userRepositoryAdapter -> usuariosDb "Reads and writes" "JDBC"

        // ===================================================================
        //  Relationships — component level (ms-canchas, hexagonal)
        // ===================================================================
        gateway -> courtController "Routes /api/canchas" "JSON/HTTP"

        courtController -> courtUseCase "Invokes"
        courtController -> errorHandlerCourt "Unhandled exceptions"
        courtService -> courtUseCase "Implements"

        courtService -> courtRepositoryPort "Persists and queries the catalog"
        courtRepositoryAdapter -> courtRepositoryPort "Implements"

        courtRepositoryAdapter -> canchasDb "Reads and writes" "JDBC"

        // ===================================================================
        //  Relationships — component level (ms-reportes, hexagonal)
        // ===================================================================
        gateway -> reportController "Routes /api/reportes" "JSON/HTTP"

        reportController -> reportUseCase "Invokes"
        reportController -> errorHandlerReport "Unhandled exceptions"
        reportService -> reportUseCase "Implements"

        reportService -> bookingsClientPort "Gets the period's bookings"
        reportService -> courtsClientPort "Gets the court catalog and schedules"

        bookingsClientAdapter -> bookingsClientPort "Implements"
        courtsClientAdapter -> courtsClientPort "Implements"

        bookingsClientAdapter -> msReservas "Gets the period's bookings" "JSON/HTTP (synchronous)"
        courtsClientAdapter -> msCanchas "Gets the court catalog and schedules" "JSON/HTTP (synchronous)"

        // ===================================================================
        //  Relationships — component level (Gateway)
        // ===================================================================
        edge -> authenticationFilter "Routes /api/*" "HTTP"

        authenticationFilter -> routeConfig "Identity propagated, routing continues"
        authenticationFilter -> errorHandlerGateway "Missing or invalid identity"

        routeConfig -> msUsuarios "Routes /api/auth and /api/usuarios" "JSON/HTTP"
        routeConfig -> msCanchas "Routes /api/canchas" "JSON/HTTP"
        routeConfig -> msReservas "Routes /api/reservas and /api/disponibilidad" "JSON/HTTP"
        routeConfig -> msReportes "Routes /api/reportes" "JSON/HTTP"
        routeConfig -> errorHandlerGateway "Target service unavailable"

        // ===================================================================
        //  Relationships — component level (Shell)
        // ===================================================================
        routerShell -> sessionContext "Checks whether there is an active session before resolving the route"
        routerShell -> layoutShell "Renders within"
        layoutShell -> remoteLoader "Mounts the remote for the active route"

        sessionContext -> edge "Authenticates the user" "JSON/HTTPS · /api/auth"
        remoteLoader -> mfReservas "Loads the remote at runtime" "Module Federation (remoteEntry.js)"
        remoteLoader -> mfAdministracion "Loads the remote at runtime" "Module Federation (remoteEntry.js)"
        remoteLoader -> mfReportes "Loads the remote at runtime" "Module Federation (remoteEntry.js)"

        // ===================================================================
        //  Relationships — component level (mf-reservas)
        // ===================================================================
        viewsReservas -> uiComponentsReservas "Composes the screen with"
        viewsReservas -> stateReservas "Reads and updates"
        viewsReservas -> apiClientReservas "Requests data"
        apiClientReservas -> edge "Checks availability and manages bookings" "JSON/HTTPS · /api"

        // ===================================================================
        //  Relationships — component level (mf-administracion)
        // ===================================================================
        viewsAdministracion -> uiComponentsAdministracion "Composes the screen with"
        viewsAdministracion -> stateAdministracion "Reads and updates"
        viewsAdministracion -> apiClientAdministracion "Requests data"
        apiClientAdministracion -> edge "Manages courts and bookings" "JSON/HTTPS · /api"

        // ===================================================================
        //  Relationships — component level (mf-reportes)
        // ===================================================================
        viewsReportes -> uiComponentsReportes "Composes the screen with"
        viewsReportes -> stateReportes "Reads and updates"
        viewsReportes -> apiClientReportes "Requests data"
        apiClientReportes -> edge "Requests the reports" "JSON/HTTPS · /api"

        // ===================================================================
        //  Deployment — Docker Compose
        // ===================================================================
        deploymentEnvironment "Local (Docker Compose)" {

            equipo = deploymentNode "Developer's machine" "Project evaluation environment." "macOS / Linux / Windows" {

                docker = deploymentNode "Docker Engine" "Orchestrated with Docker Compose v2." "Docker 24+" {

                    redFrontend = deploymentNode "Network: frontend" "Bridge network that isolates the presentation containers." "docker network (bridge)" {

                        nodoEdge = deploymentNode "rc-edge" "Only container connected to both networks." "nginx:1.27-alpine · port 80" {
                            containerInstance edge
                        }

                        deploymentNode "rc-shell" "" "nginx:1.27-alpine · port 3000" {
                            containerInstance shell
                        }
                        deploymentNode "rc-mf-reservas" "" "nginx:1.27-alpine · port 3001" {
                            containerInstance mfReservas
                        }
                        deploymentNode "rc-mf-administracion" "" "nginx:1.27-alpine · port 3002" {
                            containerInstance mfAdministracion
                        }
                        deploymentNode "rc-mf-reportes" "" "nginx:1.27-alpine · port 3003" {
                            containerInstance mfReportes
                        }
                    }

                    redBackend = deploymentNode "Network: backend" "Bridge network that isolates the API and persistence." "docker network (bridge)" {

                        deploymentNode "rc-gateway" "" "eclipse-temurin:21-jre · port 8080" {
                            containerInstance gateway
                        }
                        deploymentNode "rc-ms-usuarios" "" "eclipse-temurin:21-jre · port 8081" {
                            containerInstance msUsuarios
                        }
                        deploymentNode "rc-ms-canchas" "" "eclipse-temurin:21-jre · port 8082" {
                            containerInstance msCanchas
                        }
                        deploymentNode "rc-ms-reservas" "" "eclipse-temurin:21-jre · port 8083" {
                            containerInstance msReservas
                        }
                        deploymentNode "rc-ms-reportes" "" "eclipse-temurin:21-jre · port 8084" {
                            containerInstance msReportes
                        }

                        nodoPostgres = deploymentNode "rc-postgres" "Single instance with three independent databases. Each microservice has credentials that only allow it to connect to its own database." "postgres:16-alpine · port 5432" {
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

                        volumen = infrastructureNode "pgdata volume" "Docker volume with the PostgreSQL data. The infra/postgres/init scripts run only when it is empty." "docker volume" {
                            tags "Infrastructure"
                        }
                    }

                    // Relationships between containers replicate automatically
                    // between their instances; here we only need to declare
                    // the one involving the infrastructure node.
                    nodoPostgres -> volumen "Persists data to" "file system"
                }
            }
        }
    }

    // =======================================================================
    //  Views
    // =======================================================================
    views {

        // LAYOUT NOTE
        // No view uses `autoLayout`: a view with automatic layout arranges
        // itself, but Structurizr then blocks dragging its elements. The
        // starting positions of all twelve views are saved in
        // workspace.json, so they open already arranged and can be moved by
        // hand; dragging shows a save button, and the new positions are
        // written to that same file.
        //
        // workspace.json should be versioned alongside this .dsl file: it is
        // what keeps the layout. If `autoLayout` is added to a view and then
        // removed, the "automaticLayout" key left behind in workspace.json
        // must also be deleted, or the viewer will keep applying it.

        systemContext sistema "01-Contexto" "Level 1 — The system and its users." {
            include *
        }

        container sistema "02-Contenedores" "Level 2 — Microfrontends, gateway, microservices, and databases." {
            include *
        }

        component msReservas "03-Componentes-ms-reservas" "Level 3 — Interior of ms-reservas (hexagonal architecture), where the business rules are applied." {
            include *
        }

        deployment sistema "Local (Docker Compose)" "04-Despliegue" "Materialization of the system in Docker containers." {
            include *
        }

        component msUsuarios "05-Componentes-ms-usuarios" "Level 3 — Interior of ms-usuarios (hexagonal architecture): registration and basic role-based authentication." {
            include *
        }

        component msCanchas "06-Componentes-ms-canchas" "Level 3 — Interior of ms-canchas (hexagonal architecture): catalog, schedules, and blocks." {
            include *
        }

        component msReportes "07-Componentes-ms-reportes" "Level 3 — Interior of ms-reportes (hexagonal architecture): REST aggregation, no database of its own." {
            include *
        }

        component gateway "08-Componentes-gateway" "Level 3 — Interior of the API Gateway: user identification and routing." {
            include *
        }

        component shell "09-Componentes-shell" "Level 3 — Interior of the shell: layout, session, and remote loading." {
            include *
        }

        component mfReservas "10-Componentes-mf-reservas" "Level 3 — Interior of mf-reservas." {
            include *
        }

        component mfAdministracion "11-Componentes-mf-administracion" "Level 3 — Interior of mf-administracion." {
            include *
        }

        component mfReportes "12-Componentes-mf-reportes" "Level 3 — Interior of mf-reportes." {
            include *
        }

        // --- Styles --------------------------------------------------------
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

            element "Microservice" {
                background #2e8b57
                color #ffffff
                shape RoundedBox
            }

            // --- Hexagonal architecture (ports & adapters) ------------------
            element "Adapter-In" {
                background #4a7ebb
                color #ffffff
            }

            element "Port" {
                background #e8a33d
                color #000000
                shape Hexagon
            }

            element "Application" {
                background #2e8b57
                color #ffffff
            }

            element "Adapter-Out" {
                background #8e5b3f
                color #ffffff
            }

            element "Database" {
                background #7a5195
                color #ffffff
                shape Cylinder
            }

            element "Infrastructure" {
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
