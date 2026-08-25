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

const CREDENCIAL_KEY = 'reservasport_credencial';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type CuerpoDeError = { message?: string };

type Opciones = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

async function api<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { method = 'GET', body } = opciones;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const credencial = localStorage.getItem(CREDENCIAL_KEY);
  if (credencial) headers.Authorization = `Basic ${credencial}`;

  const respuesta = await fetch(`/api${ruta}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  let cuerpo: unknown = null;
  if (texto) {
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      cuerpo = null;
    }
  }

  if (!respuesta.ok) {
    const detalle = (cuerpo as CuerpoDeError | null)?.message;
    throw new ApiError(respuesta.status, detalle ?? mensajePorDefecto(respuesta.status));
  }
  return cuerpo as T;
}

/** Solo para errores sin cuerpo; si el servidor manda motivo, manda el suyo. */
function mensajePorDefecto(status: number): string {
  if (status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  if (status === 403) return 'Tu rol no permite esta operación.';
  if (status === 404) return 'No se encontró lo que buscabas.';
  if (status === 409) return 'Ese bloque ya no está disponible.';
  if (status === 422) return 'Esa cancha no admite la reserva.';
  if (status === 503) return 'El servicio no está disponible. Inténtalo de nuevo.';
  return 'No se pudo completar la operación.';
}

// --- Tipos del contrato ----------------------------------------------------
// Los valores son los canónicos de contracts/README.md § Vocabulario: los
// mismos en la base, en el contrato y aquí. Traducirlos es cosa de la pantalla.

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

// --- Llamadas ---------------------------------------------------------------

/** Sin `activa`: el backend devuelve solo las activas, que es lo que hay que ofrecer (FR-011). */
export function listarCanchas(deporte?: Deporte): Promise<Cancha[]> {
  const query = deporte ? `?deporte=${deporte}` : '';
  return api<Cancha[]>(`/canchas${query}`);
}

export function consultarDisponibilidad(canchaId: number, fecha: string): Promise<Disponibilidad> {
  return api<Disponibilidad>(`/reservas/disponibilidad?canchaId=${canchaId}&fecha=${fecha}`);
}

/** El cuerpo no lleva usuarioId: el dueño es quien la pide, y lo pone el gateway. */
export function crearReserva(
  canchaId: number,
  fecha: string,
  horaInicio: string,
): Promise<Reserva> {
  return api<Reserva>('/reservas', { method: 'POST', body: { canchaId, fecha, horaInicio } });
}

export function listarMisReservas(): Promise<Reserva[]> {
  return api<Reserva[]>('/reservas/mias');
}

/** POST sobre un subrecurso, no DELETE: la reserva no desaparece, cambia de estado. */
export function cancelarReserva(id: number): Promise<Reserva> {
  return api<Reserva>(`/reservas/${id}/cancelacion`, { method: 'POST' });
}
