package com.ups.reservacanchas.reservas.application.port.in;

import com.ups.reservacanchas.reservas.domain.BookingStatus;
import com.ups.reservacanchas.reservas.dto.DisponibilidadResponse;
import com.ups.reservacanchas.reservas.dto.ReservaRequest;
import com.ups.reservacanchas.reservas.dto.ReservaResponse;
import java.time.LocalDate;
import java.util.List;

/**
 * Puerto de entrada. La identidad (`usuarioId`) y el `rol` son parámetros
 * explícitos y no algo que el servicio vaya a buscar: llegan en X-User-Id y
 * X-User-Role, escritas por el gateway, y este servicio no autentica.
 *
 * Pasarlos por la firma es lo que permite probar RN-03 y FR-018 sin levantar
 * Spring ni fabricar cabeceras HTTP.
 */
public interface BookingUseCase {

    /** RN-01, RN-02, RN-06, RN-08 y FR-018. */
    ReservaResponse crear(ReservaRequest request, Long usuarioId, String rol);

    /** FR-007 a FR-009: todos los bloques del horario, marcados libre u ocupado. */
    DisponibilidadResponse consultarDisponibilidad(Long canchaId, LocalDate fecha);

    /** FR-025, FR-026. El filtro es el usuario que pregunta: no hay forma de pedir las de otro. */
    List<ReservaResponse> listarMias(Long usuarioId, BookingStatus estado);

    /**
     * FR-035: el listado global de §3.2, solo para el ADMINISTRADOR. Lo consume
     * también ms-reportes por BookingsClientPort.
     */
    List<ReservaResponse> listarTodas(
            String rol, LocalDate desde, LocalDate hasta, Long canchaId, BookingStatus estado);

    /** RN-03, RN-04, RN-05. */
    ReservaResponse cancelar(Long reservaId, Long usuarioId, String rol);
}
