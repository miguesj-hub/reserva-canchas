package com.ups.reservacanchas.reportes.adapter.out.client;

import com.ups.reservacanchas.reportes.application.port.out.CourtsClientPort;
import com.ups.reservacanchas.reportes.domain.exception.UpstreamUnavailableException;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Adaptador de salida hacia ms-canchas por HTTP. */
@Component
public class CourtsClientAdapter implements CourtsClientPort {

    private final RestClient restClient;

    public CourtsClientAdapter(@Qualifier("canchasRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public List<Cancha> todas() {
        // Dos llamadas porque el catálogo no expone un "todas": sin filtro
        // devuelve solo las activas (FR-011). Los reportes necesitan también las
        // inactivas —una cancha inactivada a medio mes tuvo reservas ese mes— o
        // los números no cuadrarían contra el listado global (FR-042).
        List<Cancha> todas = new ArrayList<>(pedir(true));
        todas.addAll(pedir(false));
        return todas;
    }

    private List<Cancha> pedir(boolean activa) {
        try {
            CanchaHttp[] cuerpo = restClient.get()
                    .uri("/api/canchas?activa={activa}", activa)
                    .header("X-User-Id", "0")
                    .header("X-User-Role", "ADMINISTRADOR")
                    .retrieve()
                    .body(CanchaHttp[].class);
            return cuerpo == null ? List.of() : Arrays.stream(cuerpo).map(CourtsClientAdapter::toPort).toList();
        } catch (RestClientException noResponde) {
            throw new UpstreamUnavailableException(
                    "ms-canchas no respondió; el reporte no se puede calcular.", noResponde);
        }
    }

    private static Cancha toPort(CanchaHttp c) {
        return new Cancha(
                c.id(), c.nombre(), c.deporte(),
                LocalTime.parse(c.horaApertura()), LocalTime.parse(c.horaCierre()), c.activa());
    }

    private record CanchaHttp(
            Long id, String nombre, String deporte,
            String horaApertura, String horaCierre, boolean activa) {}
}
