package com.ups.reservacanchas.canchas.adapter.out.persistence;

import com.ups.reservacanchas.canchas.domain.Sport;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/** Detalle de Spring Data, usado solo por CourtRepositoryAdapter. */
interface CourtJpaRepository extends JpaRepository<CourtEntity, Long> {

    /**
     * Un solo método para las cuatro combinaciones de filtro: los parámetros
     * nulos se ignoran. Evita cuatro derivaciones de nombre casi idénticas y
     * deja el orden del listado fijado en un sitio.
     */
    @Query("""
            SELECT c FROM CourtEntity c
            WHERE (:deporte IS NULL OR c.deporte = :deporte)
              AND (:activa IS NULL OR c.activa = :activa)
            ORDER BY c.deporte, c.nombre
            """)
    List<CourtEntity> buscar(Sport deporte, Boolean activa);
}
