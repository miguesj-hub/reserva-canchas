package com.ups.reservacanchas.reportes.config;

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
    public OpenAPI msReportesOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("ms-reportes — indicadores de uso")
                        .version("1.0.0")
                        .description("""
                                Los cuatro indicadores de §3.3.5, de solo lectura y solo para el ADMINISTRADOR.

                                Este servicio NO tiene base de datos: sin JPA, sin driver JDBC y sin Flyway.
                                Obtiene las reservas de ms-reservas y el catálogo de ms-canchas por sus
                                puertos de salida, y agrega en memoria dentro de ReportService.

                                Los números coinciden con un conteo manual sobre el listado global de
                                reservas del mismo rango (FR-042, SC-006)."""))
                .components(new Components()
                        .addSecuritySchemes("basicAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("basic")));
    }
}
