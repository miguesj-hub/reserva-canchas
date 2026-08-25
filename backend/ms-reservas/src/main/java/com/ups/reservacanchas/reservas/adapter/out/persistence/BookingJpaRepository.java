package com.ups.reservacanchas.reservas.adapter.out.persistence;

import com.ups.reservacanchas.reservas.domain.BookingStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Detalle de Spring Data, usado solo por BookingRepositoryAdapter. */
interface BookingJpaRepository extends JpaRepository<BookingEntity, Long> {

    List<BookingEntity> findByUsuarioIdOrderByFechaDescHoraInicioDesc(Long usuarioId);

    List<BookingEntity> findByCanchaIdAndFechaAndEstado(Long canchaId, LocalDate fecha, BookingStatus estado);
}
