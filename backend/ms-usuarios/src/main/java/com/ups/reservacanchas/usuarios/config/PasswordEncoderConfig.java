package com.ups.reservacanchas.usuarios.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Cableado del algoritmo de hash. **Solo el encoder**: no hay cadena de
 * filtros de Spring Security en este servicio ni en ningún otro
 * microservicio. Quien autentica es el gateway (R-003); los microservicios
 * confían en las cabeceras X-User-* que él escribe.
 *
 * Por eso el pom trae `spring-security-crypto` y no
 * `spring-boot-starter-security`: la librería de criptografía, no el
 * framework de seguridad web.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
