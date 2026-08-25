package com.ups.reservacanchas.usuarios.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadatos del Swagger que springdoc publica en /swagger-ui.html.
 * Lo que se describe aquí y lo que dice contracts/auth-usuarios.yaml tienen
 * que coincidir; si divergen, manda el contrato escrito.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI msUsuariosOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("ms-usuarios — autenticación y usuarios")
                        .version("1.0.0")
                        .description("""
                                Registro, autenticación y gestión de usuarios y roles.
                                Dueño de usuarios_db; ningún otro servicio lee esa base (Principio IV).

                                /api/auth/** es público; /api/usuarios/** exige rol ADMINISTRADOR."""))
                .components(new Components()
                        .addSecuritySchemes("basicAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("basic")
                                .description("Verificada por el gateway en cada petición (R-003).")));
    }
}
