/**
 * Cliente HTTP de mf-reportes. Mismo patrón que el shell y los otros remotes,
 * repetido y no importado: los remotes son autónomos (Principio V).
 */
export declare class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
export type Deporte = 'PADEL' | 'TENIS' | 'BASQUET';
export type ConteoCancha = {
    canchaId: number;
    canchaNombre: string;
    deporte: Deporte;
    reservas: number;
};
export type ConteoDeporte = {
    deporte: Deporte;
    reservas: number;
};
export type ReservasPorPeriodo = {
    desde: string;
    hasta: string;
    total: number;
    porCancha: ConteoCancha[];
    porDeporte: ConteoDeporte[];
};
export type OcupacionCancha = {
    canchaId: number;
    canchaNombre: string;
    deporte: Deporte;
    horasReservadas: number;
    horasDisponibles: number;
    porcentaje: number;
};
export type Cancelaciones = {
    desde: string;
    hasta: string;
    total: number;
    porCancha: ConteoCancha[];
};
export type FilaRanking = {
    posicion: number;
    canchaId: number;
    canchaNombre: string;
    deporte: Deporte;
    reservas: number;
};
export type RankingDemanda = {
    desde: string;
    hasta: string;
    ranking: FilaRanking[];
    mayorDemanda: FilaRanking | null;
    menorDemanda: FilaRanking | null;
};
export type Resumen = {
    reservas: ReservasPorPeriodo;
    ocupacion: OcupacionCancha[];
    cancelaciones: Cancelaciones;
    demanda: RankingDemanda;
};
/**
 * Una sola llamada para los cuatro indicadores. Es lo que /resumen existe para
 * evitar: encadenar cuatro peticiones que consultan exactamente lo mismo.
 */
export declare function cargarResumen(desde: string, hasta: string): Promise<Resumen>;
