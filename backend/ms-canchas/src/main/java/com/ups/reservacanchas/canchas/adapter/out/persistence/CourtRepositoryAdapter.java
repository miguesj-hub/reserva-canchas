package com.ups.reservacanchas.canchas.adapter.out.persistence;

import com.ups.reservacanchas.canchas.application.port.out.CourtRepositoryPort;
import com.ups.reservacanchas.canchas.domain.Court;
import com.ups.reservacanchas.canchas.domain.OpeningHours;
import com.ups.reservacanchas.canchas.domain.Sport;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de salida (persistencia): implementa el puerto contra Spring Data
 * JPA, traduciendo entre domain.Court y CourtEntity.
 */
@Repository
public class CourtRepositoryAdapter implements CourtRepositoryPort {

    private final CourtJpaRepository jpaRepository;

    public CourtRepositoryAdapter(CourtJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public List<Court> buscar(Sport deporte, Boolean activa) {
        return jpaRepository.buscar(deporte, activa).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Court> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    private Court toDomain(CourtEntity e) {
        return new Court(
                e.getId(),
                e.getNombre(),
                e.getDeporte(),
                new OpeningHours(e.getHoraApertura(), e.getHoraCierre()),
                e.isActiva());
    }
}
