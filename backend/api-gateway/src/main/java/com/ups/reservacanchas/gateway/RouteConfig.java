package com.ups.reservacanchas.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Enrutamiento: qué prefijo de /api va a qué microservicio.
 *
 * Las rutas se definen aquí en código y no en application.yml para que el
 * mapeo prefijo → servicio se lea de un vistazo junto al filtro que lo
 * atraviesa, y para que un prefijo nuevo sea un cambio compilable en lugar de
 * una cadena de texto que falla al arrancar.
 *
 * No hay reescritura de ruta: cada microservicio publica sus endpoints ya bajo
 * /api/..., así que la URI viaja tal cual. Es lo que hace que el Swagger
 * directo del servicio (:8081/swagger-ui.html) y la ruta a través del edge
 * describan exactamente los mismos caminos.
 *
 * El Gateway no sigue el patrón hexagonal (template-backend/ARQUITECTURA.md):
 * es infraestructura transversal, sin dominio propio que proteger.
 */
@Configuration
public class RouteConfig {

    private final String usuariosUrl;
    private final String canchasUrl;
    private final String reservasUrl;
    private final String reportesUrl;

    public RouteConfig(
            @Value("${servicios.usuarios-url}") String usuariosUrl,
            @Value("${servicios.canchas-url}") String canchasUrl,
            @Value("${servicios.reservas-url}") String reservasUrl,
            @Value("${servicios.reportes-url}") String reportesUrl) {
        this.usuariosUrl = usuariosUrl;
        this.canchasUrl = canchasUrl;
        this.reservasUrl = reservasUrl;
        this.reportesUrl = reportesUrl;
    }

    @Bean
    public RouteLocator rutas(RouteLocatorBuilder builder) {
        return builder.routes()
                // ms-usuarios atiende dos prefijos: el público de autenticación
                // y el de gestión de usuarios, que exige ADMINISTRADOR.
                .route("usuarios-auth", r -> r.path("/api/auth/**").uri(usuariosUrl))
                .route("usuarios", r -> r.path("/api/usuarios/**").uri(usuariosUrl))
                .route("canchas", r -> r.path("/api/canchas/**").uri(canchasUrl))
                .route("reservas", r -> r.path("/api/reservas/**").uri(reservasUrl))
                .route("reportes", r -> r.path("/api/reportes/**").uri(reportesUrl))
                .build();
    }
}
