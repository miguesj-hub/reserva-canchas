package com.ups.reservacanchas.canchas;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Arranca la aplicación completa contra un PostgreSQL efímero.
 *
 * Antes esto era el `contextLoads` vacío que genera Spring Initializr, y fallaba
 * siempre: `@SpringBootTest` levanta el contexto entero, con Flyway migrando, y
 * eso exige una base real que en pruebas no existía.
 *
 * Con el contenedor deja además de ser un test vacío. Lo que comprueba de verdad
 * es que **las migraciones de Flyway y el mapeo de las entidades concuerdan**:
 * el servicio arranca con `ddl-auto: validate`, así que si una columna del
 * esquema y su campo en la entidad divergen, el contexto no carga y este test se
 * pone en rojo. Es justo el fallo que `validate` existe para atrapar, y que
 * hasta ahora solo se descubría levantando el sistema entero con Docker.
 *
 * Requiere Docker en la máquina que ejecuta las pruebas, que este proyecto ya
 * exige para todo lo demás.
 */
@Testcontainers
@SpringBootTest
class MsCanchasApplicationTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void contextLoads() {
        // Sin cuerpo a propósito: lo que se comprueba es que llegar hasta aquí
        // fue posible, es decir, que el contexto cargó y Flyway migró contra un
        // esquema que el mapeo JPA reconoce.
    }
}
