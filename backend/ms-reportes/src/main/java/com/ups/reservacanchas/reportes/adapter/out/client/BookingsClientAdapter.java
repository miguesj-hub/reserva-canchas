package com.ups.reservacanchas.reportes.adapter.out.client;

import com.ups.reservacanchas.reportes.application.port.out.BookingsClientPort;
import com.ups.reservacanchas.reportes.domain.exception.UpstreamUnavailableException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Adaptador de salida hacia ms-reservas por HTTP. Sin JPA, sin driver, sin
 * credencial: este servicio no tiene base (Principio IV).
 *
 * El listado global exige rol ADMINISTRADOR, y las peticiones que llegan aquí ya
 * vienen de un administrador —FR-043 se comprobó antes—, así que se propaga esa
 * identidad en las cabeceras que ms-reservas espera del gateway.
 */
@Component
public class BookingsClientAdapter implements BookingsClientPort {

    private final RestClient restClient;

    public BookingsClientAdapter(@Qualifier("reservasRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public List<Reserva> reservasDelPeriodo(LocalDate desde, LocalDate hasta) {
        return pedir("/api/reservas?desde={desde}&hasta={hasta}", desde, hasta);
    }

    @Override
    public List<Reserva> canceladas() {
        // Sin rango: el filtro de ms-reservas es por la fecha del bloque y aquí
        // interesa la de cancelación, que es otra. Se acota por estado, que sí
        // reduce el conjunto, y ReportService filtra por fecha en memoria.
        return pedir("/api/reservas?estado=CANCELADA");
    }

    private List<Reserva> pedir(String uri, Object... variables) {
        try {
            ReservaHttp[] cuerpo = restClient.get()
                    .uri(uri, variables)
                    .header("X-User-Id", "0")
                    .header("X-User-Role", "ADMINISTRADOR")
                    .retrieve()
                    .body(ReservaHttp[].class);
            return cuerpo == null ? List.of() : Arrays.stream(cuerpo).map(BookingsClientAdapter::toPort).toList();
        } catch (RestClientException noResponde) {
            // Se traduce aquí para que el dominio no vea una excepción de HTTP.
            throw new UpstreamUnavailableException(
                    "ms-reservas no respondió; el reporte no se puede calcular.", noResponde);
        }
    }

    private static Reserva toPort(ReservaHttp r) {
        return new Reserva(
                r.id(), r.canchaId(), r.usuarioId(), r.fecha(),
                LocalTime.parse(r.horaInicio()), LocalTime.parse(r.horaFin()),
                r.estado(), r.canceladaEn());
    }

    /** La forma del JSON de ms-reservas, detalle de este adaptador. */
    private record ReservaHttp(
            Long id, Long canchaId, String canchaNombre, String deporte,
            Long usuarioId, String usuarioNombre, LocalDate fecha,
            String horaInicio, String horaFin, String estado,
            LocalDateTime creadaEn, LocalDateTime canceladaEn) {}
}
