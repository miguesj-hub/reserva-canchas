/**
 * Cliente HTTP de mf-reservas.
 *
 * Repite el patrón del cliente del shell en lugar de importarlo: los remotes
 * son autónomos (Principio V) y no comparten código entre paquetes; lo único
 * que cruza la frontera es la prop `sesion` y los chunks federados de React.
 *
 * La credencial vive en el localStorage del origen —uno solo para todo el
 * sistema, gracias al edge—, así que el shell la escribe al entrar y este
 * remote la lee sin que haya que pasársela.
 */
export declare class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
export type Deporte = 'PADEL' | 'TENIS' | 'BASQUET';
export type EstadoReserva = 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA';
export type EstadoBloque = 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO';
export type Cancha = {
    id: number;
    nombre: string;
    deporte: Deporte;
    horaApertura: string;
    horaCierre: string;
    activa: boolean;
};
export type Bloque = {
    horaInicio: string;
    horaFin: string;
    estado: EstadoBloque;
};
export type Disponibilidad = {
    canchaId: number;
    fecha: string;
    bloques: Bloque[];
};
export type Reserva = {
    id: number;
    canchaId: number;
    canchaNombre: string | null;
    deporte: Deporte | null;
    usuarioId: number;
    usuarioNombre: string | null;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado: EstadoReserva;
    creadaEn: string | null;
    canceladaEn: string | null;
};
/** Sin `activa`: el backend devuelve solo las activas, que es lo que hay que ofrecer (FR-011). */
export declare function listarCanchas(deporte?: Deporte): Promise<Cancha[]>;
export declare function consultarDisponibilidad(canchaId: number, fecha: string): Promise<Disponibilidad>;
/** El cuerpo no lleva usuarioId: el dueño es quien la pide, y lo pone el gateway. */
export declare function crearReserva(canchaId: number, fecha: string, horaInicio: string): Promise<Reserva>;
export declare function listarMisReservas(): Promise<Reserva[]>;
/** POST sobre un subrecurso, no DELETE: la reserva no desaparece, cambia de estado. */
export declare function cancelarReserva(id: number): Promise<Reserva>;
