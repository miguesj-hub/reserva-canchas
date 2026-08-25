package com.ups.reservacanchas.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Las dos garantías del filtro que no se pueden comprobar mirando el código en
 * producción, porque solo se ven desde el otro lado: qué recibe el
 * microservicio destino.
 *
 * Ninguna de las dos toca la red: ambas ejercen rutas públicas, que se
 * resuelven antes de llamar a ms-usuarios. Por eso el WebClient apunta a un
 * puerto donde no hay nada y aun así el test es determinista.
 */
class AuthenticationFilterTest {

    private final AuthenticationFilter filtro =
            new AuthenticationFilter("http://ms-usuarios-inexistente:1");

    /** Captura la petición tal como saldría hacia el microservicio destino. */
    private static final class CadenaQueCaptura
            implements org.springframework.cloud.gateway.filter.GatewayFilterChain {

        private final AtomicReference<ServerHttpRequest> capturada = new AtomicReference<>();

        @Override
        public Mono<Void> filter(ServerWebExchange exchange) {
            capturada.set(exchange.getRequest());
            return Mono.empty();
        }

        ServerHttpRequest capturada() {
            return capturada.get();
        }
    }

    @Test
    void descarta_la_identidad_que_el_cliente_intenta_falsificar_R003() {
        // Un cliente cualquiera se declara ADMINISTRADOR por su cuenta.
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/auth/login")
                        .header("X-User-Role", "ADMINISTRADOR")
                        .header("X-User-Id", "1")
                        .build());
        CadenaQueCaptura cadena = new CadenaQueCaptura();

        StepVerifier.create(filtro.filter(exchange, cadena)).verifyComplete();

        // El destino no ve ninguna de las dos: solo el gateway puede escribirlas.
        assertThat(cadena.capturada().getHeaders().getFirst("X-User-Role")).isNull();
        assertThat(cadena.capturada().getHeaders().getFirst("X-User-Id")).isNull();
    }

    @Test
    void deja_pasar_las_rutas_publicas_sin_credencial() {
        // Sin cabecera Authorization: exigirla aquí impediría crear una sesión.
        for (String rutaPublica : new String[] {"/api/auth/login", "/api/auth/registro"}) {
            MockServerWebExchange exchange =
                    MockServerWebExchange.from(MockServerHttpRequest.post(rutaPublica).build());
            CadenaQueCaptura cadena = new CadenaQueCaptura();

            StepVerifier.create(filtro.filter(exchange, cadena)).verifyComplete();

            assertThat(cadena.capturada())
                    .as("la ruta pública %s debe llegar al destino", rutaPublica)
                    .isNotNull();
        }
    }

    @Test
    void exige_credencial_en_todo_lo_demas() {
        MockServerWebExchange exchange =
                MockServerWebExchange.from(MockServerHttpRequest.get("/api/canchas").build());
        CadenaQueCaptura cadena = new CadenaQueCaptura();

        StepVerifier.create(filtro.filter(exchange, cadena))
                .expectErrorMatches(ex -> ex instanceof org.springframework.web.server.ResponseStatusException rse
                        && rse.getStatusCode().value() == 401)
                .verify();

        assertThat(cadena.capturada()).as("la petición no debe salir hacia el destino").isNull();
    }
}
