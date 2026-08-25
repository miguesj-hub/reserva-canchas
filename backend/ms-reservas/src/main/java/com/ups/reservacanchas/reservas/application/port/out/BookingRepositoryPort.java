package com.ups.reservacanchas.reservas.application.port.out;

import com.ups.reservacanchas.reservas.domain.Booking;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Puerto de salida hacia reservas_db, expresado en términos de dominio.
 *
 * `save` puede lanzar SlotAlreadyBookedException: el adaptador traduce ahí la
 * violación de la restricción EXCLUDE, para que el dominio no vea nunca una
 * excepción de base de datos (R-004).
 */
public interface BookingRepositoryPort {

    Booking save(Booking booking);

    Optional<Booking> findById(Long id);

    /** Todas las de un usuario, en cualquier estado. El filtro por estado se aplica arriba. */
    List<Booking> findByUsuario(Long usuarioId);

    /** Las confirmadas de una cancha en una fecha: lo que ocupa bloques (RN-02, FR-009). */
    List<Booking> findConfirmadasDe(Long canchaId, LocalDate fecha);

    /**
     * El listado global (FR-035). Los filtros de fecha y cancha se aplican en la
     * consulta —son índices— y el de estado arriba, porque FINALIZADA se deriva
     * al leer y la base no la conoce.
     */
    List<Booking> buscarTodas(LocalDate desde, LocalDate hasta, Long canchaId);
}
