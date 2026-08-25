package com.ups.reservacanchas.canchas.application.port.in;

import com.ups.reservacanchas.canchas.domain.Sport;
import com.ups.reservacanchas.canchas.dto.CanchaResponse;
import java.util.List;

/**
 * Puerto de entrada del catálogo. En esta historia solo el lado de lectura: la
 * administración (crear, editar, activar, bloqueos) llega con US2 y añadirá sus
 * operaciones aquí.
 */
public interface CourtUseCase {

    /**
     * Listado del catálogo (FR-011).
     *
     * @param deporte filtra por deporte; null los trae todos
     * @param activa  null devuelve **solo las activas**, que es lo que la
     *                consulta de disponibilidad necesita. La gestión pide
     *                explícitamente `false` o el listado completo.
     */
    List<CanchaResponse> listar(Sport deporte, Boolean activa);

    /** Consulta puntual. La usa ms-reservas por CourtClientPort antes de reservar. */
    CanchaResponse consultar(Long id);
}
