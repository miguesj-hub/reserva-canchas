package com.ups.reservacanchas.reportes.application.service;

import com.ups.reservacanchas.reportes.application.port.in.ReportUseCase;
import com.ups.reservacanchas.reportes.application.port.out.BookingsClientPort;
import com.ups.reservacanchas.reportes.application.port.out.CourtsClientPort;
import com.ups.reservacanchas.reportes.domain.CancellationReport;
import com.ups.reservacanchas.reportes.domain.DemandRanking;
import com.ups.reservacanchas.reportes.domain.OccupancyReport;
import com.ups.reservacanchas.reportes.domain.PeriodSummary;
import com.ups.reservacanchas.reportes.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reportes.domain.exception.InvalidDateRangeException;
import com.ups.reservacanchas.reportes.dto.Cancelaciones;
import com.ups.reservacanchas.reportes.dto.ConteoCancha;
import com.ups.reservacanchas.reportes.dto.ConteoDeporte;
import com.ups.reservacanchas.reportes.dto.FilaRanking;
import com.ups.reservacanchas.reportes.dto.OcupacionCancha;
import com.ups.reservacanchas.reportes.dto.RankingDemanda;
import com.ups.reservacanchas.reportes.dto.ReservasPorPeriodo;
import com.ups.reservacanchas.reportes.dto.Resumen;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Los cuatro indicadores de §3.3.5, agregados en memoria a partir de lo que
 * devuelven ms-reservas y ms-canchas.
 *
 * Este servicio no tiene base de datos y no la echa de menos: la pregunta que
 * responde cada indicador es un conteo sobre datos que ya son de otro, y
 * consultarlos por su dueño es lo que mantiene el Principio IV en pie. El
 * precio —agregar en memoria en vez de con un GROUP BY— es asumible a escala de
 * un club, y es un precio que se paga a cambio de que ningún servicio pueda leer
 * la base de otro.
 *
 * Los números tienen que coincidir con un conteo manual sobre el listado global
 * del mismo rango (FR-042, SC-006): de ahí que todos los indicadores partan de
 * las mismas reservas y del mismo criterio de qué cuenta.
 */
@Service
public class ReportService implements ReportUseCase {

    /** FR-043: el módulo de reportes es solo del administrador. */
    private static final String ROL_ADMINISTRADOR = "ADMINISTRADOR";

    private final BookingsClientPort reservas;
    private final CourtsClientPort canchas;

    public ReportService(BookingsClientPort reservas, CourtsClientPort canchas) {
        this.reservas = reservas;
        this.canchas = canchas;
    }

    // ------------------------------------------------- Indicador 1: reservas

    @Override
    public ReservasPorPeriodo reservas(LocalDate desde, LocalDate hasta, String rol) {
        PeriodSummary periodo = periodoValido(desde, hasta, rol);

        List<CourtsClientPort.Cancha> catalogo = canchas.todas();
        Map<Long, Integer> conteo = usosPorCancha(periodo);

        // Todas las canchas, también las de cero: un listado que omite las
        // vacías no permite contrastar contra el catálogo.
        List<ConteoCancha> porCancha = catalogo.stream()
                .map(c -> new ConteoCancha(
                        c.id(), c.nombre(), c.deporte(), conteo.getOrDefault(c.id(), 0)))
                .toList();

        // Por deporte se agrupa sobre lo ya contado por cancha, no volviendo a
        // recorrer las reservas: así los dos desgloses no pueden discrepar.
        Map<String, Integer> porDeporteAcumulado = new LinkedHashMap<>();
        porCancha.forEach(c -> porDeporteAcumulado.merge(c.deporte(), c.reservas(), Integer::sum));

        List<ConteoDeporte> porDeporte = porDeporteAcumulado.entrySet().stream()
                .map(e -> new ConteoDeporte(e.getKey(), e.getValue()))
                .toList();

        int total = porCancha.stream().mapToInt(ConteoCancha::reservas).sum();
        return new ReservasPorPeriodo(desde, hasta, total, porCancha, porDeporte);
    }

    // ------------------------------------------------ Indicador 2: ocupación

    @Override
    public List<OcupacionCancha> ocupacion(LocalDate desde, LocalDate hasta, String rol) {
        PeriodSummary periodo = periodoValido(desde, hasta, rol);

        Map<Long, Double> horasPorCancha = new LinkedHashMap<>();
        for (BookingsClientPort.Reserva r : reservas.reservasDelPeriodo(desde, hasta)) {
            if (r.cuentaComoUso() && periodo.contiene(r.fecha())) {
                horasPorCancha.merge(r.canchaId(), r.horas(), Double::sum);
            }
        }

        return canchas.todas().stream()
                .map(c -> {
                    // El denominador son las horas de atención de todos los
                    // días del rango, tal como lo define FR-039. No se
                    // descuentan los días en que la cancha estuviera inactiva:
                    // eso exigiría un histórico de activación que canchas_db no
                    // guarda, y ni FR-039 ni §3.3.5 lo piden. Una cancha
                    // inactiva aparece igual, con la ocupación que tuvo.
                    double disponibles = c.horasPorDia() * periodo.dias();
                    OccupancyReport reporte = new OccupancyReport(
                            c.id(), c.nombre(), c.deporte(),
                            horasPorCancha.getOrDefault(c.id(), 0d), disponibles);
                    return new OcupacionCancha(
                            reporte.canchaId(), reporte.canchaNombre(), reporte.deporte(),
                            redondear(reporte.horasReservadas()), redondear(reporte.horasDisponibles()),
                            reporte.porcentaje());
                })
                .toList();
    }

    // -------------------------------------------- Indicador 3: cancelaciones

    @Override
    public Cancelaciones cancelaciones(LocalDate desde, LocalDate hasta, String rol) {
        PeriodSummary periodo = periodoValido(desde, hasta, rol);

        Map<Long, Integer> conteo = new LinkedHashMap<>();
        int total = 0;
        for (BookingsClientPort.Reserva r : reservas.canceladas()) {
            // Por la fecha de CANCELACIÓN, no la del bloque: una reserva de
            // diciembre cancelada en octubre es una cancelación de octubre.
            if (r.canceladaEn() != null && periodo.contiene(r.canceladaEn().toLocalDate())) {
                conteo.merge(r.canchaId(), 1, Integer::sum);
                total++;
            }
        }

        List<CancellationReport.ConteoPorCancha> dominio = canchas.todas().stream()
                .map(c -> new CancellationReport.ConteoPorCancha(
                        c.id(), c.nombre(), c.deporte(), conteo.getOrDefault(c.id(), 0)))
                .toList();
        CancellationReport reporte = new CancellationReport(total, dominio);

        List<ConteoCancha> porCancha = reporte.porCancha().stream()
                .map(c -> new ConteoCancha(c.canchaId(), c.canchaNombre(), c.deporte(), c.reservas()))
                .toList();
        return new Cancelaciones(desde, hasta, reporte.total(), porCancha);
    }

    // ------------------------------------------------- Indicador 4: demanda

    @Override
    public RankingDemanda demanda(LocalDate desde, LocalDate hasta, String rol) {
        PeriodSummary periodo = periodoValido(desde, hasta, rol);
        Map<Long, Integer> conteo = usosPorCancha(periodo);

        List<DemandRanking.Fila> sinOrdenar = new ArrayList<>();
        for (CourtsClientPort.Cancha c : canchas.todas()) {
            // Posición provisional: la fija DemandRanking.de al ordenar.
            sinOrdenar.add(new DemandRanking.Fila(
                    0, c.id(), c.nombre(), c.deporte(), conteo.getOrDefault(c.id(), 0)));
        }
        DemandRanking ranking = DemandRanking.de(sinOrdenar);

        return new RankingDemanda(
                desde, hasta,
                ranking.filas().stream().map(ReportService::toFila).toList(),
                toFila(ranking.mayorDemanda()),
                toFila(ranking.menorDemanda()));
    }

    // ---------------------------------------------------------- Los cuatro

    @Override
    public Resumen resumen(LocalDate desde, LocalDate hasta, String rol) {
        // Se apoya en los cuatro métodos públicos en vez de recalcular: si un
        // indicador cambia, el panel del administrador cambia con él, sin que
        // haya dos versiones del mismo número.
        return new Resumen(
                reservas(desde, hasta, rol),
                ocupacion(desde, hasta, rol),
                cancelaciones(desde, hasta, rol),
                demanda(desde, hasta, rol));
    }

    // ----------------------------------------------------------------- común

    /** Cuántas reservas de uso real tuvo cada cancha en el rango (FR-038, FR-041). */
    private Map<Long, Integer> usosPorCancha(PeriodSummary periodo) {
        Map<Long, Integer> conteo = new LinkedHashMap<>();
        for (BookingsClientPort.Reserva r : reservas.reservasDelPeriodo(periodo.desde(), periodo.hasta())) {
            if (r.cuentaComoUso() && periodo.contiene(r.fecha())) {
                conteo.merge(r.canchaId(), 1, Integer::sum);
            }
        }
        return conteo;
    }

    /**
     * Las dos puertas por las que pasa cualquier indicador: el rol y el rango.
     * Juntas y al principio, para que ninguna consulta a otro servicio ocurra
     * antes de saber que la petición es legítima.
     */
    private PeriodSummary periodoValido(LocalDate desde, LocalDate hasta, String rol) {
        if (!ROL_ADMINISTRADOR.equals(rol)) {
            throw new ForbiddenOperationException(
                    "El módulo de reportes es exclusivo del administrador.");
        }
        if (desde == null || hasta == null) {
            throw new InvalidDateRangeException(
                    "Un reporte necesita las dos fechas del rango: 'desde' y 'hasta'.");
        }
        if (hasta.isBefore(desde)) {
            throw new InvalidDateRangeException(
                    "El rango está invertido: 'hasta' (" + hasta + ") es anterior a 'desde' (" + desde + ").");
        }
        return new PeriodSummary(desde, hasta);
    }

    private static FilaRanking toFila(DemandRanking.Fila f) {
        return f == null
                ? null
                : new FilaRanking(f.posicion(), f.canchaId(), f.canchaNombre(), f.deporte(), f.reservas());
    }

    /** Una décima basta: las horas salen de bloques de una hora. */
    private static double redondear(double valor) {
        return Math.round(valor * 10d) / 10d;
    }
}
