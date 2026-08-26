/**
 * Cliente HTTP de mf-administracion.
 *
 * Repite el patrón del shell y de mf-reservas en lugar de importarlo: los
 * remotes son autónomos (Principio V). La credencial vive en el localStorage
 * del origen único que sirve el edge, así que el shell la escribe al entrar y
 * este remote la lee sin que nadie se la pase.
 */
export declare class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
export type Deporte = 'PADEL' | 'TENIS' | 'BASQUET';
export type EstadoReserva = 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA';
export type Cancha = {
    id: number;
    nombre: string;
    deporte: Deporte;
    horaApertura: string;
    horaCierre: string;
    activa: boolean;
};
export type CanchaRequest = {
    nombre: string;
    deporte: Deporte;
    horaApertura: string;
    horaCierre: string;
    activa?: boolean;
};
export type Bloqueo = {
    id: number;
    canchaId: number;
    desde: string;
    hasta: string;
    motivo: string | null;
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
/** La gestión pide el listado COMPLETO: `activa=false` trae también las inactivas. */
export declare function listarCanchas(soloActivas?: boolean): Promise<Cancha[]>;
export declare function crearCancha(cancha: CanchaRequest): Promise<Cancha>;
export declare function editarCancha(id: number, cancha: CanchaRequest): Promise<Cancha>;
export declare function cambiarEstadoCancha(id: number, activa: boolean): Promise<Cancha>;
export declare function listarBloqueos(canchaId: number): Promise<Bloqueo[]>;
export declare function registrarBloqueo(canchaId: number, desde: string, hasta: string, motivo: string): Promise<Bloqueo>;
export declare function retirarBloqueo(canchaId: number, bloqueoId: number): Promise<void>;
export declare function listarReservas(filtros: {
    desde?: string;
    hasta?: string;
    canchaId?: number;
    estado?: EstadoReserva;
}): Promise<Reserva[]>;
/** La misma operación que usa el dueño: la diferencia de rol la aplica el backend (RN-03). */
export declare function cancelarReserva(id: number): Promise<Reserva>;
export type ResumenReportes = {
    reservas: {
        total: number;
    };
    ocupacion: {
        canchaId: number;
        canchaNombre: string;
        porcentaje: number;
    }[];
    cancelaciones: {
        total: number;
    };
    demanda: {
        mayorDemanda: {
            canchaNombre: string;
            reservas: number;
        } | null;
    };
};
/** Los cuatro indicadores del día en curso, para el panel (R-005). */
export declare function resumenDelDia(dia: string): Promise<ResumenReportes>;
export type Rol = 'USUARIO_FINAL' | 'ADMINISTRADOR';
export type Usuario = {
    id: number;
    username: string;
    nombre: string;
    rol: Rol;
    activo: boolean;
};
export declare function listarUsuarios(): Promise<Usuario[]>;
/** FR-046. Inactivar no toca las reservas del usuario: son de otro dominio. */
export declare function cambiarEstadoUsuario(id: number, activo: boolean): Promise<Usuario>;
