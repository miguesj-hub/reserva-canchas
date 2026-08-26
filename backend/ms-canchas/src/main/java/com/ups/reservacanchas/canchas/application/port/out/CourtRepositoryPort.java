package com.ups.reservacanchas.canchas.application.port.out;

import com.ups.reservacanchas.canchas.domain.Court;
import com.ups.reservacanchas.canchas.domain.MaintenanceBlock;
import com.ups.reservacanchas.canchas.domain.Sport;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Puerto de salida: lo que el dominio necesita de la persistencia, expresado en
 * términos de dominio (Court, MaintenanceBlock), no de JPA.
 */
public interface CourtRepositoryPort {

    List<Court> buscar(Sport deporte, Boolean activa);

    Optional<Court> findById(Long id);

    Court save(Court court);

    boolean existsById(Long id);

    // --- Bloqueos de mantenimiento ---------------------------------------

    /**
     * Los bloqueos de una cancha que se solapan con el rango pedido. El rango es
     * opcional en ambos extremos: sin él, devuelve todos.
     */
    List<MaintenanceBlock> buscarBloqueos(Long canchaId, LocalDateTime desde, LocalDateTime hasta);

    MaintenanceBlock saveBloqueo(MaintenanceBlock bloqueo);

    Optional<MaintenanceBlock> findBloqueoById(Long bloqueoId);

    void deleteBloqueo(Long bloqueoId);
}
