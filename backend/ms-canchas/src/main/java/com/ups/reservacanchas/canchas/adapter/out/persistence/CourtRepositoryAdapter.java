package com.ups.reservacanchas.canchas.adapter.out.persistence;

import com.ups.reservacanchas.canchas.application.port.out.CourtRepositoryPort;
import com.ups.reservacanchas.canchas.domain.Court;
import com.ups.reservacanchas.canchas.domain.MaintenanceBlock;
import com.ups.reservacanchas.canchas.domain.OpeningHours;
import com.ups.reservacanchas.canchas.domain.Sport;
import java.time.LocalDateTime;
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
    private final MaintenanceBlockJpaRepository bloqueoRepository;

    public CourtRepositoryAdapter(
            CourtJpaRepository jpaRepository, MaintenanceBlockJpaRepository bloqueoRepository) {
        this.jpaRepository = jpaRepository;
        this.bloqueoRepository = bloqueoRepository;
    }

    @Override
    public List<Court> buscar(Sport deporte, Boolean activa) {
        return jpaRepository.buscar(deporte, activa).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Court> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Court save(Court court) {
        CourtEntity entity = new CourtEntity(
                court.getId(),
                court.getNombre(),
                court.getDeporte(),
                court.getHorario().apertura(),
                court.getHorario().cierre(),
                court.isActiva());
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public boolean existsById(Long id) {
        return jpaRepository.existsById(id);
    }

    // --- Bloqueos de mantenimiento ---------------------------------------

    @Override
    public List<MaintenanceBlock> buscarBloqueos(Long canchaId, LocalDateTime desde, LocalDateTime hasta) {
        return bloqueoRepository.buscar(canchaId, desde, hasta).stream().map(this::toDomain).toList();
    }

    @Override
    public MaintenanceBlock saveBloqueo(MaintenanceBlock bloqueo) {
        MaintenanceBlockEntity entity = new MaintenanceBlockEntity(
                bloqueo.getId(),
                bloqueo.getCanchaId(),
                bloqueo.getDesde(),
                bloqueo.getHasta(),
                bloqueo.getMotivo());
        return toDomain(bloqueoRepository.save(entity));
    }

    @Override
    public Optional<MaintenanceBlock> findBloqueoById(Long bloqueoId) {
        return bloqueoRepository.findById(bloqueoId).map(this::toDomain);
    }

    @Override
    public void deleteBloqueo(Long bloqueoId) {
        bloqueoRepository.deleteById(bloqueoId);
    }

    private MaintenanceBlock toDomain(MaintenanceBlockEntity e) {
        return new MaintenanceBlock(
                e.getId(), e.getCanchaId(), e.getDesde(), e.getHasta(), e.getMotivo());
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
