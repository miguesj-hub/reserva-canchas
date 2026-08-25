package com.ups.reservacanchas.canchas.application.service;

import com.ups.reservacanchas.canchas.application.port.in.CourtUseCase;
import com.ups.reservacanchas.canchas.application.port.out.CourtRepositoryPort;
import com.ups.reservacanchas.canchas.domain.Court;
import com.ups.reservacanchas.canchas.domain.Sport;
import com.ups.reservacanchas.canchas.domain.exception.CourtNotFoundException;
import com.ups.reservacanchas.canchas.dto.CanchaResponse;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Implementa el caso de uso del catálogo. Depende solo del puerto de salida.
 */
@Service
public class CourtService implements CourtUseCase {

    /** "HH:mm", el formato que fija contracts/README.md § Formatos. */
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final CourtRepositoryPort repository;

    public CourtService(CourtRepositoryPort repository) {
        this.repository = repository;
    }

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
        Court court = repository.findById(id)
                .orElseThrow(() -> new CourtNotFoundException("La cancha " + id + " no existe."));
        return toResponse(court);
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
}
