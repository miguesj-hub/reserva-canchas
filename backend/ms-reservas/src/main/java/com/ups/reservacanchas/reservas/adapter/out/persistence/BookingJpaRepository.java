package com.ups.reservacanchas.reservas.adapter.out.persistence;

import com.ups.reservacanchas.reservas.domain.BookingStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/** Detalle de Spring Data, usado solo por BookingRepositoryAdapter. */
interface BookingJpaRepository extends JpaRepository<BookingEntity, Long> {

    List<BookingEntity> findByUsuarioIdOrderByFechaDescHoraInicioDesc(Long usuarioId);

    List<BookingEntity> findByCanchaIdAndFechaAndEstado(Long canchaId, LocalDate fecha, BookingStatus estado);

    /**
     * Listado global con filtros opcionales; los nulos se ignoran.
     *
     * Con COALESCE y no con `:desde IS NULL OR ...`: esa forma deja un parámetro
     * suelto en un `? IS NULL` cuyo tipo PostgreSQL no puede inferir y la
     * consulta falla con "could not determine data type of parameter". Aquí el
     * tipo lo da la columna del otro operando, y un filtro nulo degenera en
     * `b.fecha >= b.fecha`, que siempre se cumple.
     */
    @Query("""
            SELECT b FROM BookingEntity b
            WHERE b.fecha >= COALESCE(:desde, b.fecha)
              AND b.fecha <= COALESCE(:hasta, b.fecha)
              AND b.canchaId = COALESCE(:canchaId, b.canchaId)
            ORDER BY b.fecha DESC, b.horaInicio DESC
            """)
    List<BookingEntity> buscarTodas(LocalDate desde, LocalDate hasta, Long canchaId);
}
