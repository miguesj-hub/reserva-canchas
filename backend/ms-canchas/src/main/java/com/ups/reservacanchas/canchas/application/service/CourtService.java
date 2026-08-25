package com.ups.reservacanchas.canchas.application.service;

import com.ups.reservacanchas.canchas.application.port.in.CourtUseCase;
import com.ups.reservacanchas.canchas.application.port.out.CourtRepositoryPort;
import com.ups.reservacanchas.canchas.domain.Court;
import com.ups.reservacanchas.canchas.domain.MaintenanceBlock;
import com.ups.reservacanchas.canchas.domain.OpeningHours;
import com.ups.reservacanchas.canchas.domain.Sport;
import com.ups.reservacanchas.canchas.domain.exception.CourtNotFoundException;
import com.ups.reservacanchas.canchas.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.canchas.domain.exception.MaintenanceBlockNotFoundException;
import com.ups.reservacanchas.canchas.domain.exception.MaintenanceBlockOverlapException;
import com.ups.reservacanchas.canchas.dto.BloqueoRequest;
import com.ups.reservacanchas.canchas.dto.BloqueoResponse;
import com.ups.reservacanchas.canchas.dto.CanchaRequest;
import com.ups.reservacanchas.canchas.dto.CanchaResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Implementa el caso de uso del catálogo. Depende solo del puerto de salida.
 *
 * RN-07 vive aquí y no en el controlador: es una decisión de negocio —quién
 * puede tocar el catálogo— y en el adaptador web no se podría probar sin
 * levantar Spring ni fabricar cabeceras.
 */
@Service
public class CourtService implements CourtUseCase {

    /** El rol llega en X-User-Role, escrita por el gateway. Aquí solo se lee. */
    private static final String ROL_ADMINISTRADOR = "ADMINISTRADOR";

    /** "HH:mm", el formato que fija contracts/README.md § Formatos. */
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final CourtRepositoryPort repository;

    public CourtService(CourtRepositoryPort repository) {
        this.repository = repository;
    }

    // ---------------------------------------------------------------- lectura

    @Override
    public List<CanchaResponse> listar(Sport deporte, Boolean activa) {
        // FR-011: sin filtro explícito, solo las activas. El valor por defecto
        // se decide aquí y no en el controlador, para que la regla no dependa
        // de por dónde entre la petición.
        Boolean filtroEstado = activa == null ? Boolean.TRUE : activa;
        return repository.buscar(deporte, filtroEstado).stream().map(this::toResponse).toList();
    }

    @Override
    public CanchaResponse consultar(Long id) {
        return toResponse(buscarOFallar(id));
    }

    @Override
    public List<BloqueoResponse> listarBloqueos(Long canchaId, LocalDate desde, LocalDate hasta) {
        if (!repository.existsById(canchaId)) {
            throw new CourtNotFoundException("La cancha " + canchaId + " no existe.");
        }
        // El rango llega en días y se traduce a instantes: `hasta` incluye el
        // día entero, no se corta a medianoche del propio día.
        LocalDateTime desdeInstante = desde == null ? null : desde.atStartOfDay();
        LocalDateTime hastaInstante = hasta == null ? null : hasta.plusDays(1).atStartOfDay();
        return repository.buscarBloqueos(canchaId, desdeInstante, hastaInstante).stream()
                .map(this::toResponse)
                .toList();
    }

    // -------------------------------------------------------------- escritura

    @Override
    public CanchaResponse crear(CanchaRequest request, String rol) {
        exigirAdministrador(rol, "crear canchas");
        Court nueva = new Court(
                request.nombre(), request.deporte(), horarioDe(request), request.activaODefecto());
        return toResponse(repository.save(nueva));
    }

    @Override
    public CanchaResponse editar(Long id, CanchaRequest request, String rol) {
        exigirAdministrador(rol, "editar canchas");
        Court court = buscarOFallar(id);
        // FR-030: cambiar el horario cambia los bloques que la disponibilidad
        // ofrece a partir de ese momento. Las reservas ya hechas no se tocan.
        court.actualizar(
                request.nombre(), request.deporte(), horarioDe(request), request.activaODefecto());
        return toResponse(repository.save(court));
    }

    @Override
    public CanchaResponse cambiarEstado(Long id, boolean activa, String rol) {
        exigirAdministrador(rol, "cambiar el estado de una cancha");
        Court court = buscarOFallar(id);
        // FR-032: inactivar no borra ni cancela nada. Deja de ofrecerse para
        // reservas nuevas, y las existentes siguen en pie.
        court.cambiarEstado(activa);
        return toResponse(repository.save(court));
    }

    @Override
    public BloqueoResponse registrarBloqueo(Long canchaId, BloqueoRequest request, String rol) {
        exigirAdministrador(rol, "registrar bloqueos de mantenimiento");
        if (!repository.existsById(canchaId)) {
            throw new CourtNotFoundException("La cancha " + canchaId + " no existe.");
        }

        // El constructor de MaintenanceBlock valida que el fin sea posterior al
        // inicio; aquí se comprueba lo que solo se sabe mirando a los demás.
        MaintenanceBlock nuevo = new MaintenanceBlock(
                canchaId, request.desde(), request.hasta(), request.motivo());

        boolean seSolapa = repository
                .buscarBloqueos(canchaId, request.desde(), request.hasta()).stream()
                .anyMatch(existente -> existente.cubre(request.desde(), request.hasta()));
        if (seSolapa) {
            throw new MaintenanceBlockOverlapException(
                    "Ya hay un bloqueo de mantenimiento que se solapa con ese rango.");
        }

        // FR-034 y §3.3.3: NO se cancelan las reservas que caigan dentro. El
        // bloqueo impide reservas nuevas; sobre las confirmadas decide el
        // administrador desde el listado global.
        return toResponse(repository.saveBloqueo(nuevo));
    }

    @Override
    public void retirarBloqueo(Long canchaId, Long bloqueoId, String rol) {
        exigirAdministrador(rol, "retirar bloqueos de mantenimiento");
        MaintenanceBlock bloqueo = repository.findBloqueoById(bloqueoId)
                .orElseThrow(() -> new MaintenanceBlockNotFoundException(
                        "El bloqueo " + bloqueoId + " no existe."));
        if (!bloqueo.getCanchaId().equals(canchaId)) {
            // Pertenece a otra cancha: para esta ruta, no existe.
            throw new MaintenanceBlockNotFoundException(
                    "El bloqueo " + bloqueoId + " no pertenece a la cancha " + canchaId + ".");
        }
        repository.deleteBloqueo(bloqueoId);
    }

    // ----------------------------------------------------------------- comunes

    /** RN-07 y FR-033: la gestión del catálogo es exclusiva del administrador. */
    private void exigirAdministrador(String rol, String operacion) {
        if (!ROL_ADMINISTRADOR.equals(rol)) {
            throw new ForbiddenOperationException(
                    "Solo un administrador puede " + operacion + ".");
        }
    }

    /**
     * Construye el horario, que es quien valida que el cierre sea posterior a la
     * apertura: la invariante vive en el objeto de valor, no repartida por aquí.
     */
    private OpeningHours horarioDe(CanchaRequest request) {
        return new OpeningHours(
                LocalTime.parse(request.horaApertura(), HORA),
                LocalTime.parse(request.horaCierre(), HORA));
    }

    private Court buscarOFallar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new CourtNotFoundException("La cancha " + id + " no existe."));
    }

    private CanchaResponse toResponse(Court c) {
        return new CanchaResponse(
                c.getId(),
                c.getNombre(),
                c.getDeporte(),
                c.getHorario().apertura().format(HORA),
                c.getHorario().cierre().format(HORA),
                c.isActiva());
    }

    private BloqueoResponse toResponse(MaintenanceBlock b) {
        return new BloqueoResponse(
                b.getId(), b.getCanchaId(), b.getDesde(), b.getHasta(), b.getMotivo());
    }
}
