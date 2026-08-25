package com.ups.reservacanchas.usuarios;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Arranca la aplicación completa contra un PostgreSQL efímero.
 *
 * Lo que comprueba de verdad es que las migraciones de Flyway y el mapeo de
 * UserEntity concuerdan: el servicio arranca con `ddl-auto: validate`, así que
 * si una columna del esquema y su campo divergen, el contexto no carga y este
 * test se pone en rojo. Es el fallo que `validate` existe para atrapar.
 *
 * De paso ejerce el seed: V2__seed_usuarios.sql se aplica contra una base
 * limpia en cada ejecución, así que un error en el seed también sale aquí.
 */
@Testcontainers
@SpringBootTest
class MsUsuariosApplicationTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void contextLoads() {
        // Sin cuerpo a propósito: lo que se comprueba es que llegar hasta aquí
        // fue posible.
    }
}
