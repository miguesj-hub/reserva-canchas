package com.ups.reservacanchas.canchas.application.port.out;

import com.ups.reservacanchas.canchas.domain.Court;
import com.ups.reservacanchas.canchas.domain.Sport;
import java.util.List;
import java.util.Optional;

/**
 * Puerto de salida: lo que el dominio necesita de la persistencia, expresado en
 * términos de dominio (Court), no de JPA.
 */
public interface CourtRepositoryPort {

    List<Court> buscar(Sport deporte, Boolean activa);

    Optional<Court> findById(Long id);
}
