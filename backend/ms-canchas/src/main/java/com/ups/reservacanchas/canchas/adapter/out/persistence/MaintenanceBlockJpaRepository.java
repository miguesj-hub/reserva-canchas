package com.ups.reservacanchas.canchas.adapter.out.persistence;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/** Detalle de Spring Data, usado solo por CourtRepositoryAdapter. */
interface MaintenanceBlockJpaRepository extends JpaRepository<MaintenanceBlockEntity, Long> {

    /**
     * Los bloqueos de una cancha que se solapan con el rango. Los extremos son
     * opcionales: null en cualquiera de los dos lo deja abierto por ese lado.
     *
     * El extremo opcional se resuelve con COALESCE y no con `:desde IS NULL OR
     * ...`, que es la forma que primero sale: esa deja un parámetro suelto en un
     * `? IS NULL` cuyo tipo PostgreSQL no puede inferir, y la consulta revienta
     * con "could not determine data type of parameter". Con COALESCE el tipo
     * viene de la columna con la que se compara.
     *
     * Cuando el extremo es null, la condición degenera en `b.hasta > b.desde` y
     * `b.desde < b.hasta`, siempre ciertas por el CHECK de la tabla.
     */
    @Query("""
            SELECT b FROM MaintenanceBlockEntity b
            WHERE b.canchaId = :canchaId
              AND b.hasta > COALESCE(:desde, b.desde)
              AND b.desde < COALESCE(:hasta, b.hasta)
            ORDER BY b.desde
            """)
    List<MaintenanceBlockEntity> buscar(Long canchaId, LocalDateTime desde, LocalDateTime hasta);
}
