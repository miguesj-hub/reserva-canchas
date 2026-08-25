package com.ups.reservacanchas.reportes.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Los dos clientes HTTP de los que depende este servicio. No hay ningún bean de
 * datasource: ms-reportes no tiene base, y su pom.xml no trae ni JPA, ni Flyway,
 * ni el driver de PostgreSQL, para que la tentación no esté disponible.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient reservasRestClient(@Value("${reportes.clientes.reservas-url}") String url) {
        return construir(url);
    }

    @Bean
    public RestClient canchasRestClient(@Value("${reportes.clientes.canchas-url}") String url) {
        return construir(url);
    }

    private RestClient construir(String baseUrl) {
        // Un reporte encadena varias llamadas; sin tiempos de espera acotados,
        // un servicio colgado deja la petición esperando en vez de devolver el
        // 503 que la pantalla sabe explicar.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(10));
        return RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }
}
