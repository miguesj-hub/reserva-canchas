package com.ups.reservacanchas.reservas.application.service;

import com.ups.reservacanchas.reservas.application.port.in.BookingUseCase;
import com.ups.reservacanchas.reservas.application.port.out.BookingRepositoryPort;
import com.ups.reservacanchas.reservas.application.port.out.ConfigurationRepositoryPort;
import com.ups.reservacanchas.reservas.application.port.out.CourtClientPort;
import com.ups.reservacanchas.reservas.domain.Booking;
import com.ups.reservacanchas.reservas.domain.BookingStatus;
import com.ups.reservacanchas.reservas.domain.TimeSlot;
import com.ups.reservacanchas.reservas.domain.exception.ActiveBookingLimitExceededException;
import com.ups.reservacanchas.reservas.domain.exception.BookingNotFoundException;
import com.ups.reservacanchas.reservas.domain.exception.CourtNotBookableException;
import com.ups.reservacanchas.reservas.domain.exception.CourtNotFoundException;
import com.ups.reservacanchas.reservas.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reservas.domain.exception.PastBookingCancellationException;
import com.ups.reservacanchas.reservas.domain.exception.SlotAlreadyBookedException;
import com.ups.reservacanchas.reservas.dto.Bloque;
import com.ups.reservacanchas.reservas.dto.DisponibilidadResponse;
import com.ups.reservacanchas.reservas.dto.ReservaRequest;
import com.ups.reservacanchas.reservas.dto.ReservaResponse;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Donde viven RN-01 a RN-06 y RN-08 (Principio II). No importa nada de
 * `adapter/`: pide lo que necesita por puertos de salida, y por eso se puede
 * probar entero con ellos mockeados, sin Spring y sin base de datos.
 *
 * El reloj se inyecta en lugar de llamar a LocalDateTime.now() por ahí suelto:
 * RN-04 y la derivación de FINALIZADA dependen del instante actual, y un test
 * que no pueda fijarlo tendría que dormir o depender de la hora a la que se
 * ejecute.
 */
@Service
public class BookingService implements BookingUseCase {

    /** El rol llega en X-User-Role, escrito por el gateway. Aquí solo se lee. */
    private static final String ROL_ADMINISTRADOR = "ADMINISTRADOR";

    private static final String CLAVE_TOPE = "max_reservas_activas";
    private static final int TOPE_POR_DEFECTO = 3;

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final BookingRepositoryPort bookings;
    private final ConfigurationRepositoryPort configuracion;
    private final CourtClientPort canchas;
    private final Clock clock;

    public BookingService(
            BookingRepositoryPort bookings,
            ConfigurationRepositoryPort configuracion,
            CourtClientPort canchas,
            Clock clock) {
        this.bookings = bookings;
        this.configuracion = configuracion;
        this.canchas = canchas;
        this.clock = clock;
    }

    // ------------------------------------------------------------------ crear

    @Override
    public ReservaResponse crear(ReservaRequest request, Long usuarioId, String rol) {
        // FR-018: §3.1 no le asigna esta acción al administrador. Va lo primero
        // porque no tiene sentido validar una cancha para alguien que no puede
        // reservar en ningún caso.
        if (ROL_ADMINISTRADOR.equals(rol)) {
            throw new ForbiddenOperationException(
                    "Un administrador no crea reservas; esa acción es del usuario final.");
        }

        LocalDateTime ahora = LocalDateTime.now(clock);
        TimeSlot bloque = TimeSlot.deUnaHoraDesde(LocalTime.parse(request.horaInicio(), HORA));
        CourtClientPort.Cancha cancha = canchaReservable(request.canchaId(), request.fecha(), bloque, ahora);

        // RN-06 antes que RN-02: si el usuario ya llegó al tope, el bloque
        // concreto da igual, y el mensaje es más útil.
        verificarTope(usuarioId, ahora);

        // RN-02, comprobación previa. Es la que da el mensaje claro en el caso
        // normal; la carrera entre dos peticiones simultáneas la cubre la
        // restricción EXCLUDE, que BookingRepositoryAdapter traduce a esta
        // misma excepción.
        boolean ocupado = bookings.findConfirmadasDe(request.canchaId(), request.fecha()).stream()
                .anyMatch(reservada -> reservada.getBloque().seSolapaCon(bloque));
        if (ocupado) {
            throw new SlotAlreadyBookedException(mensajeBloqueOcupado(bloque, request.canchaId()));
        }

        // RN-01 y RN-08: nace CONFIRMADA, y el constructor no admite otra cosa.
        Booking creada = bookings.save(
                new Booking(request.canchaId(), usuarioId, request.fecha(), bloque));
        return toResponse(creada, cancha, ahora);
    }

    /** RN-01 y FR-011/FR-016: la cancha tiene que existir, estar activa y admitir el bloque. */
    private CourtClientPort.Cancha canchaReservable(
            Long canchaId, LocalDate fecha, TimeSlot bloque, LocalDateTime ahora) {
        CourtClientPort.Cancha cancha = canchas.buscar(canchaId)
                .orElseThrow(() -> new CourtNotFoundException("La cancha " + canchaId + " no existe."));

        if (!cancha.activa()) {
            throw new CourtNotBookableException(
                    "La cancha '" + cancha.nombre() + "' está inactiva y no admite reservas.");
        }
        // FR-016: reservar en el pasado no es un conflicto que pueda resolverse
        // reintentando, es una petición que nunca va a funcionar.
        if (!bloque.inicioEn(fecha).isAfter(ahora)) {
            throw new CourtNotBookableException(
                    "El bloque " + bloque.inicio().format(HORA) + " del " + fecha + " ya pasó.");
        }
        if (!dentroDelHorario(cancha, bloque)) {
            throw new CourtNotBookableException(
                    "El bloque " + textoBloque(bloque) + " queda fuera del horario de atención de '"
                            + cancha.nombre() + "' (" + cancha.horaApertura().format(HORA) + "–"
                            + cancha.horaCierre().format(HORA) + ").");
        }
        return cancha;
    }

    /** RN-06: el tope se lee de la base en cada creación, no se cachea. */
    private void verificarTope(Long usuarioId, LocalDateTime ahora) {
        int tope = configuracion.valorDe(CLAVE_TOPE)
                .map(BookingService::comoEntero)
                .orElse(TOPE_POR_DEFECTO);

        long activas = bookings.findByUsuario(usuarioId).stream()
                .filter(reserva -> reserva.cuentaComoActiva(ahora))
                .count();

        if (activas >= tope) {
            throw new ActiveBookingLimitExceededException(
                    "Ya tienes " + activas + " reservas activas, que es el máximo permitido.");
        }
    }

    // --------------------------------------------------------- disponibilidad

    @Override
    public DisponibilidadResponse consultarDisponibilidad(Long canchaId, LocalDate fecha) {
        CourtClientPort.Cancha cancha = canchas.buscar(canchaId)
                .orElseThrow(() -> new CourtNotFoundException("La cancha " + canchaId + " no existe."));

        List<Booking> confirmadas = bookings.findConfirmadasDe(canchaId, fecha);

        // FR-008: TODOS los bloques del horario, no solo los libres. La pantalla
        // necesita pintar la rejilla completa para que se vea qué hay ocupado.
        List<Bloque> bloques = new ArrayList<>();
        for (TimeSlot bloque : bloquesDelHorario(cancha)) {
            boolean ocupado = confirmadas.stream()
                    .anyMatch(reservada -> reservada.getBloque().seSolapaCon(bloque));
            bloques.add(new Bloque(
                    bloque.inicio().format(HORA),
                    bloque.fin().format(HORA),
                    // MANTENIMIENTO todavía no lo produce nadie: los bloqueos
                    // (FR-010) se administran en US2.
                    ocupado ? Bloque.Estado.OCUPADO : Bloque.Estado.LIBRE));
        }
        return new DisponibilidadResponse(canchaId, fecha, bloques);
    }

    /** Los bloques de una hora que caben enteros en el horario de atención (RN-07). */
    private List<TimeSlot> bloquesDelHorario(CourtClientPort.Cancha cancha) {
        List<TimeSlot> bloques = new ArrayList<>();
        LocalTime inicio = cancha.horaApertura();
        while (true) {
            LocalTime fin = inicio.plus(TimeSlot.DURACION);
            // fin.isAfter(inicio) corta el bucle si el horario llegara a cruzar
            // la medianoche: LocalTime da la vuelta y esto sería infinito.
            if (!fin.isAfter(inicio) || fin.isAfter(cancha.horaCierre())) {
                return bloques;
            }
            bloques.add(new TimeSlot(inicio, fin));
            inicio = fin;
        }
    }

    private boolean dentroDelHorario(CourtClientPort.Cancha cancha, TimeSlot bloque) {
        return !bloque.inicio().isBefore(cancha.horaApertura())
                && bloque.fin().isAfter(bloque.inicio())
                && !bloque.fin().isAfter(cancha.horaCierre());
    }

    // ----------------------------------------------------------------- listar

    @Override
    public List<ReservaResponse> listarMias(Long usuarioId, BookingStatus estado) {
        LocalDateTime ahora = LocalDateTime.now(clock);
        // Una cancha por reserva sería una llamada HTTP por tarjeta; se resuelve
        // una vez por cancha distinta.
        Map<Long, Optional<CourtClientPort.Cancha>> cache = new HashMap<>();

        return bookings.findByUsuario(usuarioId).stream()
                .filter(reserva -> estado == null || reserva.estadoVigente(ahora) == estado)
                .map(reserva -> toResponse(
                        reserva,
                        cache.computeIfAbsent(reserva.getCanchaId(), canchas::buscar).orElse(null),
                        ahora))
                .toList();
    }

    // --------------------------------------------------------------- cancelar

    @Override
    public ReservaResponse cancelar(Long reservaId, Long usuarioId, String rol) {
        LocalDateTime ahora = LocalDateTime.now(clock);
        Booking reserva = bookings.findById(reservaId)
                .orElseThrow(() -> new BookingNotFoundException("La reserva " + reservaId + " no existe."));

        // RN-03: el administrador cancela cualquiera; el usuario final, solo las
        // suyas. 403 y no 404: fingir que no existe ocultaría el motivo real.
        boolean esAdministrador = ROL_ADMINISTRADOR.equals(rol);
        if (!esAdministrador && !reserva.perteneceA(usuarioId)) {
            throw new ForbiddenOperationException("Solo puedes cancelar tus propias reservas.");
        }

        // FR-023: cancelar algo ya cancelado no es un error, simplemente no
        // tiene efecto. Devolverlo tal cual evita que dos clics seguidos den un
        // error que confunda.
        if (reserva.estadoVigente(ahora) == BookingStatus.CANCELADA) {
            return toResponse(reserva, canchas.buscar(reserva.getCanchaId()).orElse(null), ahora);
        }

        // RN-04: solo antes de la hora de inicio, y también para el
        // administrador. Cubre de paso FR-028: una FINALIZADA ya empezó.
        if (!reserva.sePuedeCancelarEn(ahora)) {
            throw new PastBookingCancellationException(
                    "La reserva del " + reserva.getFecha() + " a las "
                            + reserva.getBloque().inicio().format(HORA)
                            + " ya inició; no se puede cancelar.");
        }

        // RN-05: pasa a CANCELADA y el bloque queda libre, porque la restricción
        // EXCLUDE solo alcanza a las confirmadas.
        reserva.cancelar(ahora);
        Booking guardada = bookings.save(reserva);
        return toResponse(guardada, canchas.buscar(guardada.getCanchaId()).orElse(null), ahora);
    }

    // ---------------------------------------------------------------- comunes

    private String mensajeBloqueOcupado(TimeSlot bloque, Long canchaId) {
        return "El bloque " + textoBloque(bloque) + " de la cancha " + canchaId + " ya está reservado.";
    }

    private String textoBloque(TimeSlot bloque) {
        return bloque.inicio().format(HORA) + "-" + bloque.fin().format(HORA);
    }

    private static int comoEntero(String valor) {
        try {
            return Integer.parseInt(valor.trim());
        } catch (NumberFormatException noEsNumero) {
            // Un valor corrupto en `configuracion` no debe abrir el tope: se cae
            // al valor por defecto en lugar de dejar reservar sin límite.
            return TOPE_POR_DEFECTO;
        }
    }

    private ReservaResponse toResponse(Booking b, CourtClientPort.Cancha cancha, LocalDateTime ahora) {
        return new ReservaResponse(
                b.getId(),
                b.getCanchaId(),
                cancha != null ? cancha.nombre() : null,
                cancha != null ? cancha.deporte() : null,
                b.getUsuarioId(),
                // Solo lo rellena el listado global del administrador (US2).
                null,
                b.getFecha(),
                b.getBloque().inicio().format(HORA),
                b.getBloque().fin().format(HORA),
                b.estadoVigente(ahora),
                b.getCreadaEn(),
                b.getCanceladaEn());
    }
}
