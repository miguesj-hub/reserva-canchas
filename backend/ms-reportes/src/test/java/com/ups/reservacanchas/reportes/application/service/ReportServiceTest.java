package com.ups.reservacanchas.reportes.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ups.reservacanchas.reportes.application.port.out.BookingsClientPort;
import com.ups.reservacanchas.reportes.application.port.out.CourtsClientPort;
import com.ups.reservacanchas.reportes.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reportes.domain.exception.InvalidDateRangeException;
import com.ups.reservacanchas.reportes.dto.Cancelaciones;
import com.ups.reservacanchas.reportes.dto.ConteoCancha;
import com.ups.reservacanchas.reportes.dto.OcupacionCancha;
import com.ups.reservacanchas.reportes.dto.RankingDemanda;
import com.ups.reservacanchas.reportes.dto.ReservasPorPeriodo;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Los cuatro indicadores sobre un conjunto conocido, con los dos puertos
 * mockeados: sin Spring, sin red y sin base de datos (Principio II).
 *
 * El conjunto está elegido para que los números se puedan contar a mano, que es
 * exactamente lo que pide SC-006: los indicadores tienen que coincidir con un
 * conteo manual sobre el listado global del mismo rango.
 *
 *   Cancha 1 (PADEL, 07:00–22:00) — 3 usos (2 confirmadas + 1 finalizada)
 *   Cancha 2 (PADEL, 07:00–22:00) — 1 uso
 *   Cancha 3 (TENIS, 07:00–22:00) — 0 usos
 *   Además: 1 cancelada en cancha 1 (no cuenta como uso) y 1 uso fuera del rango.
 */
@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    private static final String ADMIN = "ADMINISTRADOR";
    private static final String CLIENTE = "USUARIO_FINAL";

    private static final LocalDate DESDE = LocalDate.of(2026, 9, 1);
    private static final LocalDate HASTA = LocalDate.of(2026, 9, 30);

    @Mock BookingsClientPort reservas;
    @Mock CourtsClientPort canchas;

    ReportService service;

    @BeforeEach
    void setUp() {
        service = new ReportService(reservas, canchas);
    }

    private void catalogoDeTres() {
        lenient().when(canchas.todas()).thenReturn(List.of(
                new CourtsClientPort.Cancha(1L, "Pádel 1", "PADEL", LocalTime.of(7, 0), LocalTime.of(22, 0), true),
                new CourtsClientPort.Cancha(2L, "Pádel 2", "PADEL", LocalTime.of(7, 0), LocalTime.of(22, 0), true),
                new CourtsClientPort.Cancha(3L, "Tenis 1", "TENIS", LocalTime.of(7, 0), LocalTime.of(22, 0), true)));
    }

    private BookingsClientPort.Reserva reserva(
            long id, long canchaId, LocalDate fecha, int hora, String estado, LocalDateTime canceladaEn) {
        return new BookingsClientPort.Reserva(
                id, canchaId, 2L, fecha,
                LocalTime.of(hora, 0), LocalTime.of(hora + 1, 0), estado, canceladaEn);
    }

    private void reservasDelPeriodo() {
        lenient().when(reservas.reservasDelPeriodo(DESDE, HASTA)).thenReturn(List.of(
                reserva(1, 1L, LocalDate.of(2026, 9, 10), 19, "CONFIRMADA", null),
                reserva(2, 1L, LocalDate.of(2026, 9, 11), 20, "CONFIRMADA", null),
                reserva(3, 1L, LocalDate.of(2026, 9, 5), 18, "FINALIZADA", null),
                reserva(4, 2L, LocalDate.of(2026, 9, 12), 10, "CONFIRMADA", null),
                // Cancelada: no cuenta como uso en ninguno de los indicadores 1, 2 y 4.
                reserva(5, 1L, LocalDate.of(2026, 9, 13), 9, "CANCELADA",
                        LocalDateTime.of(2026, 9, 8, 12, 0)),
                // Fuera del rango: ms-reservas no debería devolverla, pero si lo
                // hiciera, el servicio la descarta igual.
                reserva(6, 1L, LocalDate.of(2026, 10, 2), 19, "CONFIRMADA", null)));
    }

    // --- Indicador 1 (FR-038) ----------------------------------------------

    @Test
    void cuenta_reservas_por_cancha_y_por_deporte_FR038() {
        catalogoDeTres();
        reservasDelPeriodo();

        ReservasPorPeriodo r = service.reservas(DESDE, HASTA, ADMIN);

        assertThat(r.total()).isEqualTo(4);
        assertThat(r.porCancha()).extracting(ConteoCancha::canchaId, ConteoCancha::reservas)
                .containsExactly(
                        org.assertj.core.api.Assertions.tuple(1L, 3),
                        org.assertj.core.api.Assertions.tuple(2L, 1),
                        // La cancha sin reservas aparece con 0, no se omite.
                        org.assertj.core.api.Assertions.tuple(3L, 0));
        assertThat(r.porDeporte()).extracting("deporte", "reservas")
                .containsExactlyInAnyOrder(
                        org.assertj.core.api.Assertions.tuple("PADEL", 4),
                        org.assertj.core.api.Assertions.tuple("TENIS", 0));
        // El total por deporte y el total por cancha son el mismo número.
        assertThat(r.porDeporte().stream().mapToInt(c -> c.reservas()).sum()).isEqualTo(r.total());
    }

    @Test
    void las_canceladas_no_cuentan_como_reservas_FR038() {
        catalogoDeTres();
        reservasDelPeriodo();

        // Hay 5 reservas dentro del rango, pero una está cancelada: son 4.
        assertThat(service.reservas(DESDE, HASTA, ADMIN).total()).isEqualTo(4);
    }

    // --- Indicador 2 (FR-039) ----------------------------------------------

    @Test
    void calcula_la_ocupacion_sobre_el_horario_de_atencion_FR039() {
        catalogoDeTres();
        reservasDelPeriodo();

        List<OcupacionCancha> ocupacion = service.ocupacion(DESDE, HASTA, ADMIN);

        // 15 horas de atención × 30 días = 450 horas disponibles por cancha.
        assertThat(ocupacion).hasSize(3);
        OcupacionCancha padel1 = ocupacion.get(0);
        assertThat(padel1.horasDisponibles()).isEqualTo(450.0);
        assertThat(padel1.horasReservadas()).isEqualTo(3.0);
        assertThat(padel1.porcentaje()).isEqualTo(0.7);
    }

    @Test
    void una_cancha_sin_reservas_aparece_con_cero_por_ciento_FR039() {
        catalogoDeTres();
        reservasDelPeriodo();

        OcupacionCancha tenis = service.ocupacion(DESDE, HASTA, ADMIN).stream()
                .filter(o -> o.canchaId() == 3L).findFirst().orElseThrow();

        // No se omite: es la que el ranking necesita en el extremo inferior.
        assertThat(tenis.horasReservadas()).isZero();
        assertThat(tenis.porcentaje()).isZero();
    }

    // --- Indicador 3 (FR-040) ----------------------------------------------

    @Test
    void cuenta_las_cancelaciones_por_fecha_de_cancelacion_FR040() {
        catalogoDeTres();
        when(reservas.canceladas()).thenReturn(List.of(
                // Cancelada dentro del rango: cuenta.
                reserva(5, 1L, LocalDate.of(2026, 12, 1), 9, "CANCELADA",
                        LocalDateTime.of(2026, 9, 8, 12, 0)),
                // Bloque DENTRO del rango pero cancelada antes: no cuenta.
                reserva(7, 2L, LocalDate.of(2026, 9, 20), 9, "CANCELADA",
                        LocalDateTime.of(2026, 8, 30, 12, 0))));

        Cancelaciones c = service.cancelaciones(DESDE, HASTA, ADMIN);

        // La primera es de un bloque de diciembre y aun así es una cancelación
        // de septiembre: la pregunta es cuánto se canceló en el período.
        assertThat(c.total()).isEqualTo(1);
        assertThat(c.porCancha()).extracting(ConteoCancha::canchaId, ConteoCancha::reservas)
                .contains(org.assertj.core.api.Assertions.tuple(1L, 1),
                          org.assertj.core.api.Assertions.tuple(2L, 0));
    }

    // --- Indicador 4 (FR-041) ----------------------------------------------

    @Test
    void ordena_el_ranking_de_mayor_a_menor_con_los_dos_extremos_FR041() {
        catalogoDeTres();
        reservasDelPeriodo();

        RankingDemanda ranking = service.demanda(DESDE, HASTA, ADMIN);

        assertThat(ranking.ranking()).extracting("posicion", "canchaId", "reservas")
                .containsExactly(
                        org.assertj.core.api.Assertions.tuple(1, 1L, 3),
                        org.assertj.core.api.Assertions.tuple(2, 2L, 1),
                        org.assertj.core.api.Assertions.tuple(3, 3L, 0));
        assertThat(ranking.mayorDemanda().canchaId()).isEqualTo(1L);
        // El extremo inferior es una cancha sin reservas, y es información:
        // omitirla dejaría el indicador a medias.
        assertThat(ranking.menorDemanda().canchaId()).isEqualTo(3L);
        assertThat(ranking.menorDemanda().reservas()).isZero();
    }

    // --- Rango vacío y validaciones (FR-043, FR-044) ------------------------

    @Test
    void un_rango_sin_datos_devuelve_ceros_y_no_falla_FR044() {
        catalogoDeTres();
        when(reservas.reservasDelPeriodo(any(), any())).thenReturn(List.of());

        ReservasPorPeriodo r = service.reservas(DESDE, HASTA, ADMIN);

        // Cero es una respuesta legítima, no un error: el club pudo no tener
        // ninguna reserva ese mes.
        assertThat(r.total()).isZero();
        assertThat(r.porCancha()).hasSize(3).allMatch(c -> c.reservas() == 0);
    }

    @Test
    void rechaza_un_rango_invertido_FR044() {
        assertThatThrownBy(() -> service.reservas(HASTA, DESDE, ADMIN))
                .isInstanceOf(InvalidDateRangeException.class)
                .hasMessageContaining("invertido");

        verify(reservas, never()).reservasDelPeriodo(any(), any());
    }

    @Test
    void un_usuario_final_no_consulta_reportes_FR043() {
        for (Runnable llamada : List.<Runnable>of(
                () -> service.reservas(DESDE, HASTA, CLIENTE),
                () -> service.ocupacion(DESDE, HASTA, CLIENTE),
                () -> service.cancelaciones(DESDE, HASTA, CLIENTE),
                () -> service.demanda(DESDE, HASTA, CLIENTE),
                () -> service.resumen(DESDE, HASTA, CLIENTE))) {
            assertThatThrownBy(llamada::run).isInstanceOf(ForbiddenOperationException.class);
        }

        // La comprobación va antes que cualquier llamada a otro servicio: no se
        // consulta nada por una petición que no es legítima.
        verify(reservas, never()).reservasDelPeriodo(any(), any());
        verify(canchas, never()).todas();
    }

    // --- Resumen ------------------------------------------------------------

    @Test
    void el_resumen_devuelve_los_mismos_numeros_que_los_cuatro_indicadores() {
        catalogoDeTres();
        reservasDelPeriodo();
        when(reservas.canceladas()).thenReturn(List.of());

        var resumen = service.resumen(DESDE, HASTA, ADMIN);

        assertThat(resumen.reservas().total()).isEqualTo(service.reservas(DESDE, HASTA, ADMIN).total());
        assertThat(resumen.demanda().mayorDemanda().canchaId())
                .isEqualTo(service.demanda(DESDE, HASTA, ADMIN).mayorDemanda().canchaId());
        assertThat(resumen.ocupacion()).hasSize(3);
        assertThat(resumen.cancelaciones().total()).isZero();
    }
}
