package com.ups.reservacanchas.reservas.config;

import java.time.Clock;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Cableado de las dependencias externas del servicio. No es un componente del
 * diagrama: es infraestructura interna.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient canchasRestClient(@Value("${servicios.canchas-url}") String canchasUrl) {
        // Con tiempos de espera acotados: sin ellos, un ms-canchas colgado
        // dejaría la petición de reserva esperando indefinidamente en lugar de
        // devolver un 503 que la pantalla pueda explicar.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));

        return RestClient.builder().baseUrl(canchasUrl).requestFactory(factory).build();
    }

    /**
     * El reloj como bean para que BookingService lo reciba inyectado: RN-04 y la
     * derivación de FINALIZADA dependen del instante actual, y un test que no
     * pueda fijarlo tendría que depender de la hora a la que se ejecute.
     */
    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
