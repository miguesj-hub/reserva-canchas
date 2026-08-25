package com.ups.reservacanchas.reservas.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
import com.ups.reservacanchas.reservas.domain.exception.ActiveBookingLimitExceededException;
import com.ups.reservacanchas.reservas.domain.exception.CourtNotBookableException;
import com.ups.reservacanchas.reservas.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reservas.domain.exception.SlotAlreadyBookedException;
import com.ups.reservacanchas.reservas.dto.ReservaRequest;
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
 * Las reglas de creación, con los tres puertos de salida mockeados: sin Spring,
 * sin base de datos y sin ms-canchas (Principio II).
 *
 * El reloj está fijado a un instante concreto para que "mañana" signifique
 * siempre lo mismo: con el reloj del sistema, un test que reserva a las 19:00
 * fallaría al ejecutarse a las 20:00.
 */
@ExtendWith(MockitoExtension.class)
class BookingServiceCreacionTest {

    private static final LocalDateTime AHORA = LocalDateTime.of(2026, 9, 15, 10, 0);
    private static final LocalDate MANANA = AHORA.toLocalDate().plusDays(1);
    private static final Long CLIENTE = 2L;
    private static final Long CANCHA = 1L;

    @Mock BookingRepositoryPort bookings;
    @Mock ConfigurationRepositoryPort configuracion;
    @Mock CourtClientPort canchas;

    BookingService service;

    @BeforeEach
    void setUp() {
        Clock reloj = Clock.fixed(AHORA.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        service = new BookingService(bookings, configuracion, canchas, reloj);
    }

    private void canchaActivaDe07a22() {
        lenient().when(canchas.buscar(CANCHA)).thenReturn(Optional.of(new CourtClientPort.Cancha(
                CANCHA, "Pádel 1 — Cristal", "PADEL", LocalTime.of(7, 0), LocalTime.of(22, 0), true)));
    }

    private void topeDeTres() {
        lenient().when(configuracion.valorDe("max_reservas_activas")).thenReturn(Optional.of("3"));
    }

    private Booking confirmadaDe(Long usuarioId, LocalDate fecha, int hora) {
        return new Booking(
                99L, CANCHA, usuarioId, fecha,
                TimeSlot.deUnaHoraDesde(LocalTime.of(hora, 0)),
                BookingStatus.CONFIRMADA, AHORA, null);
    }

    private ReservaRequest peticionA(int hora) {
        return new ReservaRequest(CANCHA, MANANA, String.format("%02d:00", hora));
    }

    // --- RN-01 y RN-08 ------------------------------------------------------

    @Test
    void crea_la_reserva_sobre_cancha_fecha_y_bloque_RN01() {
        canchaActivaDe07a22();
        topeDeTres();
        when(bookings.findByUsuario(CLIENTE)).thenReturn(List.of());
        when(bookings.findConfirmadasDe(CANCHA, MANANA)).thenReturn(List.of());
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaResponse response = service.crear(peticionA(19), CLIENTE, "USUARIO_FINAL");

        assertThat(response.canchaId()).isEqualTo(CANCHA);
        assertThat(response.fecha()).isEqualTo(MANANA);
        assertThat(response.horaInicio()).isEqualTo("19:00");
        // El bloque dura una hora: el fin se deriva, no se pide.
        assertThat(response.horaFin()).isEqualTo("20:00");
        assertThat(response.usuarioId()).isEqualTo(CLIENTE);
        assertThat(response.canchaNombre()).isEqualTo("Pádel 1 — Cristal");
    }

    @Test
    void toda_reserva_nace_confirmada_RN08() {
        canchaActivaDe07a22();
        topeDeTres();
        when(bookings.findByUsuario(CLIENTE)).thenReturn(List.of());
        when(bookings.findConfirmadasDe(CANCHA, MANANA)).thenReturn(List.of());
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaResponse response = service.crear(peticionA(19), CLIENTE, "USUARIO_FINAL");

        assertThat(response.estado()).isEqualTo(BookingStatus.CONFIRMADA);
        verify(bookings).save(org.mockito.ArgumentMatchers.argThat(
                b -> b.getEstado() == BookingStatus.CONFIRMADA));
    }

    // --- RN-02 --------------------------------------------------------------

    @Test
    void rechaza_reserva_solapada_RN02() {
        canchaActivaDe07a22();
        topeDeTres();
        when(bookings.findByUsuario(CLIENTE)).thenReturn(List.of());
        when(bookings.findConfirmadasDe(CANCHA, MANANA))
                .thenReturn(List.of(confirmadaDe(3L, MANANA, 19)));

        assertThatThrownBy(() -> service.crear(peticionA(19), CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(SlotAlreadyBookedException.class)
                .hasMessageContaining("19:00-20:00");

        verify(bookings, never()).save(any(Booking.class));
    }

    @Test
    void un_bloque_contiguo_no_choca_RN02() {
        // El fin es exclusivo: 19:00-20:00 no bloquea 20:00-21:00. Sin esto, una
        // reserva dejaría inservible el bloque siguiente.
        canchaActivaDe07a22();
        topeDeTres();
        when(bookings.findByUsuario(CLIENTE)).thenReturn(List.of());
        when(bookings.findConfirmadasDe(CANCHA, MANANA))
                .thenReturn(List.of(confirmadaDe(3L, MANANA, 19)));
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaResponse response = service.crear(peticionA(20), CLIENTE, "USUARIO_FINAL");

        assertThat(response.horaInicio()).isEqualTo("20:00");
    }

    // --- RN-06 --------------------------------------------------------------

    @Test
    void rechaza_al_superar_el_tope_de_activas_RN06() {
        canchaActivaDe07a22();
        topeDeTres();
        when(bookings.findByUsuario(CLIENTE)).thenReturn(List.of(
                confirmadaDe(CLIENTE, MANANA, 8),
                confirmadaDe(CLIENTE, MANANA, 9),
                confirmadaDe(CLIENTE, MANANA, 10)));

        assertThatThrownBy(() -> service.crear(peticionA(19), CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(ActiveBookingLimitExceededException.class)
                .hasMessageContaining("3 reservas activas");

        verify(bookings, never()).save(any(Booking.class));
    }

    @Test
    void las_reservas_ya_terminadas_no_cuentan_para_el_tope_RN06() {
        // Tres confirmadas, pero de ayer: se leen como FINALIZADA y no ocupan
        // cupo (FR-027). Si contaran, un usuario veterano no podría reservar más.
        canchaActivaDe07a22();
        topeDeTres();
        LocalDate ayer = AHORA.toLocalDate().minusDays(1);
        when(bookings.findByUsuario(CLIENTE)).thenReturn(List.of(
                confirmadaDe(CLIENTE, ayer, 8),
                confirmadaDe(CLIENTE, ayer, 9),
                confirmadaDe(CLIENTE, ayer, 10)));
        when(bookings.findConfirmadasDe(CANCHA, MANANA)).thenReturn(List.of());
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaResponse response = service.crear(peticionA(19), CLIENTE, "USUARIO_FINAL");

        assertThat(response.estado()).isEqualTo(BookingStatus.CONFIRMADA);
    }

    @Test
    void sin_fila_de_configuracion_usa_el_tope_por_defecto_RN06() {
        canchaActivaDe07a22();
        when(configuracion.valorDe("max_reservas_activas")).thenReturn(Optional.empty());
        when(bookings.findByUsuario(CLIENTE)).thenReturn(List.of(
                confirmadaDe(CLIENTE, MANANA, 8),
                confirmadaDe(CLIENTE, MANANA, 9),
                confirmadaDe(CLIENTE, MANANA, 10)));

        assertThatThrownBy(() -> service.crear(peticionA(19), CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(ActiveBookingLimitExceededException.class);
    }

    // --- FR-018, FR-011, FR-016 --------------------------------------------

    @Test
    void un_administrador_no_crea_reservas_FR018() {
        assertThatThrownBy(() -> service.crear(peticionA(19), 1L, "ADMINISTRADOR"))
                .isInstanceOf(ForbiddenOperationException.class);

        // Ni siquiera se molesta en consultar la cancha: la respuesta no depende de ella.
        verify(canchas, never()).buscar(anyLong());
        verify(bookings, never()).save(any(Booking.class));
    }

    @Test
    void rechaza_reservar_en_una_cancha_inactiva_FR011() {
        when(canchas.buscar(CANCHA)).thenReturn(Optional.of(new CourtClientPort.Cancha(
                CANCHA, "Tenis 2 — En obra", "TENIS", LocalTime.of(8, 0), LocalTime.of(20, 0), false)));

        assertThatThrownBy(() -> service.crear(peticionA(19), CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(CourtNotBookableException.class)
                .hasMessageContaining("inactiva");
    }

    @Test
    void rechaza_un_bloque_fuera_del_horario_de_atencion() {
        canchaActivaDe07a22();

        // 22:00-23:00 empieza justo al cerrar: no cabe entero dentro del horario.
        assertThatThrownBy(() -> service.crear(peticionA(22), CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(CourtNotBookableException.class)
                .hasMessageContaining("fuera del horario");
    }

    @Test
    void rechaza_reservar_en_el_pasado_FR016() {
        canchaActivaDe07a22();

        ReservaRequest ayerALas19 = new ReservaRequest(
                CANCHA, AHORA.toLocalDate().minusDays(1), "19:00");

        assertThatThrownBy(() -> service.crear(ayerALas19, CLIENTE, "USUARIO_FINAL"))
                .isInstanceOf(CourtNotBookableException.class)
                .hasMessageContaining("ya pasó");
    }
}
