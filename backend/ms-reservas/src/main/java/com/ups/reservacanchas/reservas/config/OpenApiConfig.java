package com.ups.reservacanchas.reservas.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Metadatos del Swagger que springdoc publica en /swagger-ui.html. */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI msReservasOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("ms-reservas — reservas y disponibilidad")
                        .version("1.0.0")
                        .description("""
                                Dueño de reservas_db y de las reglas RN-01 a RN-06 y RN-08.

                                Las reglas viven en BookingService, no en el controlador ni en el
                                frontend (Principio II). La identidad y el rol llegan en X-User-Id y
                                X-User-Role, escritas por el gateway; este servicio no autentica.

                                RN-02 está garantizada además por una restricción EXCLUDE de
                                PostgreSQL: el 409 llega por la comprobación previa en el caso normal
                                y por la restricción cuando dos peticiones compiten."""))
                .components(new Components()
                        .addSecuritySchemes("basicAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("basic")));
    }
}
