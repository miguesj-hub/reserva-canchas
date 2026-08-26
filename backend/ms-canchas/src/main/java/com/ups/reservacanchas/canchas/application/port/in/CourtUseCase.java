package com.ups.reservacanchas.canchas.application.port.in;

import com.ups.reservacanchas.canchas.domain.Sport;
import com.ups.reservacanchas.canchas.dto.BloqueoRequest;
import com.ups.reservacanchas.canchas.dto.BloqueoResponse;
import com.ups.reservacanchas.canchas.dto.CanchaRequest;
import com.ups.reservacanchas.canchas.dto.CanchaResponse;
import java.time.LocalDate;
import java.util.List;

/**
 * Puerto de entrada del catálogo.
 *
 * Las operaciones de escritura reciben el `rol` como parámetro explícito: llega
 * en X-User-Role, escrita por el gateway, y este servicio no autentica. Pasarlo
 * por la firma es lo que permite probar RN-07 sin levantar Spring.
 *
 * Las de lectura no lo reciben porque están abiertas a cualquier usuario
 * autenticado: la disponibilidad las necesita, y de que esté autenticado ya se
 * encargó el gateway.
 */
public interface CourtUseCase {

    // --- Lectura, ambos roles -------------------------------------------

    /** FR-011. Si `activa` es null, devuelve solo las activas. */
    List<CanchaResponse> listar(Sport deporte, Boolean activa);

    CanchaResponse consultar(Long id);

    /** FR-010. Lo consume ms-reservas para descontar bloques de la disponibilidad. */
    List<BloqueoResponse> listarBloqueos(Long canchaId, LocalDate desde, LocalDate hasta);

    // --- Escritura, solo ADMINISTRADOR (RN-07) ---------------------------

    CanchaResponse crear(CanchaRequest request, String rol);

    CanchaResponse editar(Long id, CanchaRequest request, String rol);

    CanchaResponse cambiarEstado(Long id, boolean activa, String rol);

    BloqueoResponse registrarBloqueo(Long canchaId, BloqueoRequest request, String rol);

    void retirarBloqueo(Long canchaId, Long bloqueoId, String rol);
}
