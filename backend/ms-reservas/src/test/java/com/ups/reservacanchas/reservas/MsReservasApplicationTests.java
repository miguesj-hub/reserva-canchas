package com.ups.reservacanchas.reservas;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Arranca la aplicación completa contra un PostgreSQL efímero.
 *
 * Es el más valioso de los tres, porque aquí Flyway crea la restricción EXCLUDE
 * que implementa RN-02. Si esa definición se rompiera —un tipo no indexable, un
 * operador equivocado— la migración fallaría y este test lo diría, sin tener que
 * levantar el sistema entero con Docker para descubrirlo.
 *
 * El script de inicialización instala btree_gist antes de migrar, igual que hace
 * infra/postgres/init/02-extensiones.sql en el despliegue real: sin esa
 * extensión, el índice GiST de la restricción no se puede crear.
 */
@Testcontainers
@SpringBootTest
class MsReservasApplicationTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withInitScript("init-extensiones.sql");

    @Test
    void contextLoads() {
        // Sin cuerpo a propósito: lo que se comprueba es que llegar hasta aquí
        // fue posible, incluida la creación del EXCLUDE de RN-02.
    }
}
