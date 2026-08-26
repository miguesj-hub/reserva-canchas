package com.ups.reservacanchas.reservas.adapter.out.persistence;

import com.ups.reservacanchas.reservas.application.port.out.BookingRepositoryPort;
import com.ups.reservacanchas.reservas.domain.Booking;
import com.ups.reservacanchas.reservas.domain.BookingStatus;
import com.ups.reservacanchas.reservas.domain.TimeSlot;
import com.ups.reservacanchas.reservas.domain.exception.SlotAlreadyBookedException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de salida (persistencia).
 *
 * Además de traducir entidad ↔ dominio, aquí ocurre lo que hace segura a RN-02:
 * **la violación de la restricción EXCLUDE se traduce a
 * SlotAlreadyBookedException** (R-004). Sin esta traducción, la carrera entre
 * dos peticiones simultáneas llegaría al cliente como un 500 de base de datos,
 * y el dominio tendría que conocer PostgreSQL para evitarlo — justo lo que la
 * regla de dependencia prohíbe.
 */
@Repository
public class BookingRepositoryAdapter implements BookingRepositoryPort {

    /** El nombre que le da V1__reservas.sql a la restricción EXCLUDE. */
    private static final String RESTRICCION_SOLAPE = "reserva_sin_solape";

    private final BookingJpaRepository jpaRepository;

    public BookingRepositoryAdapter(BookingJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Booking save(Booking booking) {
        BookingEntity entity = new BookingEntity(
                booking.getId(),
                booking.getCanchaId(),
                booking.getUsuarioId(),
                booking.getFecha(),
                booking.getBloque().inicio(),
                booking.getBloque().fin(),
                booking.getEstado(),
                booking.getCanceladaEn());
        try {
            // saveAndFlush y no save: con save, la inserción se aplaza al cierre
            // de la transacción y la violación saltaría fuera de este try,
            // donde ya no se puede traducir.
            return toDomain(jpaRepository.saveAndFlush(entity));
        } catch (DataIntegrityViolationException ex) {
            if (violaElSolape(ex)) {
                throw bloqueOcupado(booking);
            }
            throw ex;
        } catch (CannotAcquireLockException ex) {
            // El otro desenlace de la misma carrera, y no es teórico: lo produce
            // ConcurrenciaReservaIT en varias de sus diez repeticiones.
            //
            // Al insertar contra una restricción EXCLUDE, PostgreSQL escribe
            // primero su entrada en el índice y después busca conflictos. Con
            // dos transacciones simultáneas, cada una encuentra la entrada aún
            // sin confirmar de la otra y se queda esperándola: un ciclo, que el
            // motor rompe abortando a una. La superviviente confirma igual, así
            // que para la abortada el bloque está tomado — exactamente lo mismo
            // que dice la violación de restricción, y merece el mismo 409.
            //
            // Sin esta rama, la mitad de las carreras devolvería un 500 y RN-02
            // parecería rota justo en el caso que la restricción existe para
            // cubrir.
            throw bloqueOcupado(booking);
        }
    }

    private SlotAlreadyBookedException bloqueOcupado(Booking booking) {
        return new SlotAlreadyBookedException(
                "El bloque " + booking.getBloque().inicio() + "-" + booking.getBloque().fin()
                        + " de la cancha " + booking.getCanchaId() + " ya está reservado.");
    }

    /**
     * Se busca el nombre de la restricción en toda la cadena de causas: Hibernate
     * envuelve la excepción de PostgreSQL varias veces, y solo el mensaje del
     * fondo trae el nombre.
     */
    private boolean violaElSolape(Throwable ex) {
        for (Throwable causa = ex; causa != null; causa = causa.getCause()) {
            if (causa.getMessage() != null && causa.getMessage().contains(RESTRICCION_SOLAPE)) {
                return true;
            }
            if (causa.getCause() == causa) {
                return false;
            }
        }
        return false;
    }

    @Override
    public Optional<Booking> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Booking> findByUsuario(Long usuarioId) {
        return jpaRepository.findByUsuarioIdOrderByFechaDescHoraInicioDesc(usuarioId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Booking> findConfirmadasDe(Long canchaId, LocalDate fecha) {
        return jpaRepository
                .findByCanchaIdAndFechaAndEstado(canchaId, fecha, BookingStatus.CONFIRMADA).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Booking> buscarTodas(LocalDate desde, LocalDate hasta, Long canchaId) {
        return jpaRepository.buscarTodas(desde, hasta, canchaId).stream().map(this::toDomain).toList();
    }

    private Booking toDomain(BookingEntity e) {
        return new Booking(
                e.getId(),
                e.getCanchaId(),
                e.getUsuarioId(),
                e.getFecha(),
                new TimeSlot(e.getHoraInicio(), e.getHoraFin()),
                e.getEstado(),
                e.getCreadaEn(),
                e.getCanceladaEn());
    }
}
