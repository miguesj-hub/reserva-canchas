package com.ups.reservacanchas.reportes.domain;

import java.util.Comparator;
import java.util.List;

/**
 * Ranking de canchas por demanda (FR-041), de mayor a menor.
 *
 * Incluye **todas** las canchas, también las de cero reservas: el extremo de
 * menor demanda es parte del indicador, y omitir las canchas vacías lo dejaría
 * sin la mitad de su información.
 */
public record DemandRanking(List<Fila> filas) {

    public record Fila(int posicion, Long canchaId, String canchaNombre, String deporte, int reservas) {}

    /**
     * Ordena y numera. El desempate por nombre no es cosmético: sin él, dos
     * canchas con las mismas reservas cambiarían de posición entre llamadas y el
     * ranking parecería inestable.
     */
    public static DemandRanking de(List<Fila> sinOrdenar) {
        List<Fila> ordenadas = sinOrdenar.stream()
                .sorted(Comparator.comparingInt(Fila::reservas).reversed()
                        .thenComparing(Fila::canchaNombre))
                .toList();

        return new DemandRanking(java.util.stream.IntStream.range(0, ordenadas.size())
                .mapToObj(i -> {
                    Fila f = ordenadas.get(i);
                    return new Fila(i + 1, f.canchaId(), f.canchaNombre(), f.deporte(), f.reservas());
                })
                .toList());
    }

    public Fila mayorDemanda() {
        return filas.isEmpty() ? null : filas.get(0);
    }

    public Fila menorDemanda() {
        return filas.isEmpty() ? null : filas.get(filas.size() - 1);
    }
}
