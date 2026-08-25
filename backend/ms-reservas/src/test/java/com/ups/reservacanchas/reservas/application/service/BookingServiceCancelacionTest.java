package com.ups.reservacanchas.reservas.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ups.reservacanchas.reservas.application.port.out.BookingRepositoryPort;
import com.ups.reservacanchas.reservas.application.port.out.ConfigurationRepositoryPort;
import com.ups.reservacanchas.reservas.application.port.out.CourtClientPort;
import com.ups.reservacanchas.reservas.domain.Booking;
import com.ups.reservacanchas.reservas.domain.BookingStatus;
import com.ups.reservacanchas.reservas.domain.TimeSlot;
import com.ups.reservacanchas.reservas.domain.exception.BookingNotFoundException;
import com.ups.reservacanchas.reservas.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reservas.domain.exception.PastBookingCancellationException;
import com.ups.reservacanchas.reservas.dto.ReservaResponse;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Las reglas de cancelación —RN-03, RN-04 y RN-05— con los puertos mockeados.
 *
 * RN-05 se comprueba por su efecto observable: la reserva queda CANCELADA, y
 * dejar de estar confirmada es exactamente lo que libera el bloque, porque la
 * restricción EXCLUDE de la base solo alcanza a las confirmadas.
 */
@ExtendWith(MockitoExtension.class)
class BookingServiceCancelacionTest {

    private static final LocalDateTime AHORA = LocalDateTime.of(2026, 9, 15, 10, 0);
    private static final Long CLIENTE = 2L;
    private static final Long OTRO_CLIENTE = 3L;
    private static final Long ADMIN = 1L;
    private static final Long CANCHA = 1L;

    @Mock BookingRepositoryPort bookings;
    @Mock ConfigurationRepositoryPort configuracion;
    @Mock CourtClientPort canchas;

    BookingService service;

    @BeforeEach
    void setUp() {
        Clock reloj = Clock.fixed(AHORA.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        service = new BookingService(bookings, configuracion, canchas, reloj);
        lenient().when(canchas.buscar(CANCHA)).thenReturn(Optional.of(new CourtClientPort.Cancha(
                CANCHA, "Pádel 1 — Cristal", "PADEL", LocalTime.of(7, 0), LocalTime.of(22, 0), true)));
    }

    private Booking reservaDe(Long usuarioId, LocalDate fecha, int hora, BookingStatus estado) {
        return new Booking(
                50L, CANCHA, usuarioId, fecha,
                TimeSlot.deUnaHoraDesde(LocalTime.of(hora, 0)),
                estado, AHORA.minusDays(1), null);
    }

    private Booking futuraDe(Long usuarioId) {
        return reservaDe(usuarioId, AHORA.toLocalDate().plusDays(1), 19, BookingStatus.CONFIRMADA);
    }

    // --- RN-03 --------------------------------------------------------------

    @Test
    void el_dueno_cancela_su_propia_reserva_RN03() {
        when(bookings.findById(50L)).thenReturn(Optional.of(futuraDe(CLIENTE)));
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaResponse response = service.cancelar(50L, CLIENTE, "USUARIO_FINAL");

        assertThat(response.estado()).isEqualTo(BookingStatus.CANCELADA);
    }

    @Test
    void un_usuario_final_no_cancela_una_reserva_ajena_RN03() {
        when(bookings.findById(50L)).thenReturn(Optional.of(futuraDe(OTRO_CLIENTE)));

        assertThatThrownBy(() -> service.cancelar(50L, CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("tus propias reservas");

        verify(bookings, never()).save(any(Booking.class));
    }

    @Test
    void el_administrador_cancela_cualquier_reserva_RN03() {
        when(bookings.findById(50L)).thenReturn(Optional.of(futuraDe(OTRO_CLIENTE)));
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaResponse response = service.cancelar(50L, ADMIN, "ADMINISTRADOR");

        assertThat(response.estado()).isEqualTo(BookingStatus.CANCELADA);
    }

    // --- RN-04 --------------------------------------------------------------

    @Test
    void cancela_una_reserva_futura_RN04() {
        when(bookings.findById(50L)).thenReturn(Optional.of(futuraDe(CLIENTE)));
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.cancelar(50L, CLIENTE, "USUARIO_FINAL").estado())
                .isEqualTo(BookingStatus.CANCELADA);
    }

    @Test
    void no_cancela_una_reserva_que_ya_inicio_RN04() {
        // Hoy a las 09:00, y son las 10:00: ya empezó.
        when(bookings.findById(50L)).thenReturn(
                Optional.of(reservaDe(CLIENTE, AHORA.toLocalDate(), 9, BookingStatus.CONFIRMADA)));

        assertThatThrownBy(() -> service.cancelar(50L, CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(PastBookingCancellationException.class)
                .hasMessageContaining("ya inició");

        verify(bookings, never()).save(any(Booking.class));
    }

    @Test
    void tampoco_el_administrador_cancela_una_reserva_pasada_RN04() {
        // La regla es del calendario, no del rol.
        when(bookings.findById(50L)).thenReturn(
                Optional.of(reservaDe(OTRO_CLIENTE, AHORA.toLocalDate().minusDays(2), 19, BookingStatus.CONFIRMADA)));

        assertThatThrownBy(() -> service.cancelar(50L, ADMIN, "ADMINISTRADOR"))
                .isInstanceOf(PastBookingCancellationException.class);
    }

    // --- RN-05 --------------------------------------------------------------

    @Test
    void al_cancelar_el_bloque_queda_libre_RN05() {
        Booking reserva = futuraDe(CLIENTE);
        when(bookings.findById(50L)).thenReturn(Optional.of(reserva));
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        service.cancelar(50L, CLIENTE, "USUARIO_FINAL");

        // Deja de estar CONFIRMADA, que es lo que la saca del alcance de la
        // restricción EXCLUDE y libera el horario. Y guarda la marca de tiempo
        // que alimenta el reporte de cancelaciones.
        verify(bookings).save(org.mockito.ArgumentMatchers.argThat(
                b -> b.getEstado() == BookingStatus.CANCELADA && b.getCanceladaEn() != null));
    }

    @Test
    void al_cancelar_se_recupera_cupo_para_RN06() {
        Booking cancelada = reservaDe(CLIENTE, AHORA.toLocalDate().plusDays(1), 19, BookingStatus.CANCELADA);
        Booking activa = reservaDe(CLIENTE, AHORA.toLocalDate().plusDays(2), 18, BookingStatus.CONFIRMADA);

        // Una cancelada y una confirmada futura: solo la segunda ocupa cupo.
        when(bookings.findByUsuario(CLIENTE)).thenReturn(List.of(cancelada, activa));

        long activas = bookings.findByUsuario(CLIENTE).stream()
                .filter(b -> b.cuentaComoActiva(AHORA))
                .count();

        assertThat(activas).isEqualTo(1);
    }

    // --- FR-023, 404 --------------------------------------------------------

    @Test
    void cancelar_algo_ya_cancelado_no_es_un_error_FR023() {
        Booking yaCancelada = reservaDe(CLIENTE, AHORA.toLocalDate().plusDays(1), 19, BookingStatus.CANCELADA);
        when(bookings.findById(50L)).thenReturn(Optional.of(yaCancelada));

        ReservaResponse response = service.cancelar(50L, CLIENTE, "USUARIO_FINAL");

        assertThat(response.estado()).isEqualTo(BookingStatus.CANCELADA);
        // Sin efecto: no se vuelve a guardar ni se pisa la fecha de cancelación.
        verify(bookings, never()).save(any(Booking.class));
    }

    @Test
    void una_reserva_inexistente_da_404() {
        when(bookings.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancelar(404L, CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(BookingNotFoundException.class);
    }
}
