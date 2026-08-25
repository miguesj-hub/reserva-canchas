package com.ups.reservacanchas.canchas.config;

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
    public OpenAPI msCanchasOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("ms-canchas — catálogo de canchas")
                        .version("1.0.0")
                        .description("""
                                Catálogo de canchas, deportes y horarios de atención. Dueño de canchas_db.

                                Lectura: cualquier usuario autenticado. Escritura: solo ADMINISTRADOR (RN-07)."""))
                .components(new Components()
                        .addSecuritySchemes("basicAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("basic")));
    }
}
