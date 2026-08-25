package com.ups.reservacanchas.reservas.adapter.out.client;

import com.ups.reservacanchas.reservas.application.port.out.CourtClientPort;
import java.time.LocalTime;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Adaptador de salida hacia ms-canchas por HTTP.
 *
 * Es la pieza que hace cumplir el Principio IV: `ms-reservas` necesita saber el
 * horario de una cancha, y en vez de leer `canchas_db` —para la que ni siquiera
 * tiene credencial— se lo pregunta a su dueño.
 */
@Component
public class CourtClientAdapter implements CourtClientPort {

    private final RestClient restClient;

    public CourtClientAdapter(RestClient canchasRestClient) {
        this.restClient = canchasRestClient;
    }

    @Override
    public Optional<Cancha> buscar(Long canchaId) {
        // Con exchange y no con retrieve: hay que mirar el código ANTES de
        // deserializar. Un 404 trae el cuerpo de error uniforme, que no encaja
        // en CanchaHttp; intentar convertirlo fallaría y "esa cancha no existe"
        // acabaría contándose como "ms-canchas está caído".
        return restClient.get()
                .uri("/api/canchas/{id}", canchaId)
                .exchange((peticion, respuesta) -> {
                    int codigo = respuesta.getStatusCode().value();
                    if (codigo == 404) {
                        // Respuesta legítima, no un fallo: el servicio decide
                        // qué significa según la operación.
                        return Optional.<Cancha>empty();
                    }
                    if (respuesta.getStatusCode().isError()) {
                        // Se propaga: reservar sin poder validar la cancha sería
                        // peor que fallar, y el ErrorHandler lo traduce a 503.
                        throw new RestClientException(
                                "ms-canchas respondió " + codigo + " al consultar la cancha " + canchaId);
                    }
                    CanchaHttp cuerpo = respuesta.bodyTo(CanchaHttp.class);
                    return Optional.ofNullable(cuerpo).map(CourtClientAdapter::toPort);
                });
    }

    private static Cancha toPort(CanchaHttp c) {
        return new Cancha(
                c.id(),
                c.nombre(),
                c.deporte(),
                LocalTime.parse(c.horaApertura()),
                LocalTime.parse(c.horaCierre()),
                c.activa());
    }

    /**
     * La forma del JSON de ms-canchas, que es un detalle de este adaptador. El
     * puerto habla con su propio record y no con este, para que un cambio en el
     * contrato ajeno no se filtre hacia el dominio.
     */
    private record CanchaHttp(
            Long id,
            String nombre,
            String deporte,
            String horaApertura,
            String horaCierre,
            boolean activa) {}
}
