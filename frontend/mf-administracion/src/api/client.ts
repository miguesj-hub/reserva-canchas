/**
 * Cliente HTTP de mf-administracion.
 *
 * Repite el patrón del shell y de mf-reservas en lugar de importarlo: los
 * remotes son autónomos (Principio V). La credencial vive en el localStorage
 * del origen único que sirve el edge, así que el shell la escribe al entrar y
 * este remote la lee sin que nadie se la pase.
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
    const detalle = (cuerpo as { message?: string } | null)?.message;
    if (respuesta.status === 401) {
      cerrarSesionPorCredencialInvalida(detalle ?? 'Tu sesión ya no es válida.');
    }
    throw new ApiError(respuesta.status, detalle ?? mensajePorDefecto(respuesta.status));
  }
  return cuerpo as T;
}


/**
 * Un 401 en cualquier petición significa que la credencial guardada ya no vale:
 * el administrador inactivó la cuenta, o la cambió. El gateway la verifica en
 * CADA petición, así que se entera al instante, no al caducar un token.
 *
 * Quedarse en la pantalla sería peor que salir: todo lo que el usuario intente
 * fallará igual, sin explicar por qué. Se limpia la sesión y se vuelve al
 * inicio de sesión con el motivo.
 *
 * Se usa window.location y no el router porque este archivo no es un
 * componente, y porque una recarga completa garantiza que ningún remote ya
 * cargado conserve estado de la sesión anterior.
 */
function cerrarSesionPorCredencialInvalida(motivo: string): void {
  localStorage.removeItem(CREDENCIAL_KEY);
  localStorage.removeItem('reservasport_sesion');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign(`/login?motivo=${encodeURIComponent(motivo)}`);
  }
}

function mensajePorDefecto(status: number): string {
  if (status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  if (status === 403) return 'Tu rol no permite esta operación.';
  if (status === 404) return 'No se encontró lo que buscabas.';
  if (status === 409) return 'La operación entra en conflicto con el estado actual.';
  if (status === 422) return 'Los datos no permiten completar la operación.';
  if (status === 503) return 'El servicio no está disponible. Inténtalo de nuevo.';
  return 'No se pudo completar la operación.';
}

// --- Tipos del contrato ----------------------------------------------------

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

// Disponibilidad (feature 002, US1). Mismos tipos que el contrato de
// ms-reservas: se repiten aquí y no se importan de mf-reservas porque los
// remotes son autónomos (Principio V).
export type EstadoBloque = 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO';

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

/** Tope de reservas activas simultáneas por usuario final (RN-06). */
export type Configuracion = {
  maxReservasActivas: number;
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

// --- Catálogo de canchas ---------------------------------------------------

/** La gestión pide el listado COMPLETO: `activa=false` trae también las inactivas. */
export function listarCanchas(soloActivas = false): Promise<Cancha[]> {
  return soloActivas
    ? api<Cancha[]>('/canchas')
    : Promise.all([api<Cancha[]>('/canchas?activa=true'), api<Cancha[]>('/canchas?activa=false')])
        .then(([activas, inactivas]) => [...activas, ...inactivas]);
}

export function crearCancha(cancha: CanchaRequest): Promise<Cancha> {
  return api<Cancha>('/canchas', { method: 'POST', body: cancha });
}

export function editarCancha(id: number, cancha: CanchaRequest): Promise<Cancha> {
  return api<Cancha>(`/canchas/${id}`, { method: 'PUT', body: cancha });
}

export function cambiarEstadoCancha(id: number, activa: boolean): Promise<Cancha> {
  return api<Cancha>(`/canchas/${id}/estado`, { method: 'PATCH', body: { activa } });
}

// --- Bloqueos de mantenimiento ---------------------------------------------

/**
 * FR-049 y FR-050. El mismo endpoint que consume mf-reservas: no comprueba rol,
 * así que el administrador ve exactamente los mismos bloques y estados que un
 * usuario final. Solo lectura: §3.1 no le atribuye crear reservas (FR-051).
 */
export function consultarDisponibilidad(
  canchaId: number,
  fecha: string,
): Promise<Disponibilidad> {
  return api<Disponibilidad>(`/reservas/disponibilidad?canchaId=${canchaId}&fecha=${fecha}`);
}

export function listarBloqueos(canchaId: number): Promise<Bloqueo[]> {
  return api<Bloqueo[]>(`/canchas/${canchaId}/bloqueos`);
}

export function registrarBloqueo(
  canchaId: number,
  desde: string,
  hasta: string,
  motivo: string,
): Promise<Bloqueo> {
  return api<Bloqueo>(`/canchas/${canchaId}/bloqueos`, {
    method: 'POST',
    body: { desde, hasta, motivo: motivo || null },
  });
}

export function retirarBloqueo(canchaId: number, bloqueoId: number): Promise<void> {
  return api<void>(`/canchas/${canchaId}/bloqueos/${bloqueoId}`, { method: 'DELETE' });
}

// --- Reservas (listado global) ---------------------------------------------

export function listarReservas(filtros: {
  desde?: string;
  hasta?: string;
  canchaId?: number;
  estado?: EstadoReserva;
}): Promise<Reserva[]> {
  const params = new URLSearchParams();
  if (filtros.desde) params.set('desde', filtros.desde);
  if (filtros.hasta) params.set('hasta', filtros.hasta);
  if (filtros.canchaId) params.set('canchaId', String(filtros.canchaId));
  if (filtros.estado) params.set('estado', filtros.estado);
  const query = params.toString();
  return api<Reserva[]>(`/reservas${query ? `?${query}` : ''}`);
}

/** La misma operación que usa el dueño: la diferencia de rol la aplica el backend (RN-03). */
export function cancelarReserva(id: number): Promise<Reserva> {
  return api<Reserva>(`/reservas/${id}/cancelacion`, { method: 'POST' });
}

// --- Reportes (solo lo que el panel necesita) -------------------------------

export type ResumenReportes = {
  reservas: { total: number };
  ocupacion: { canchaId: number; canchaNombre: string; porcentaje: number }[];
  cancelaciones: { total: number };
  demanda: { mayorDemanda: { canchaNombre: string; reservas: number } | null };
};

/** Los cuatro indicadores del día en curso, para el panel (R-005). */
export function resumenDelDia(dia: string): Promise<ResumenReportes> {
  return api<ResumenReportes>(`/reportes/resumen?desde=${dia}&hasta=${dia}`);
}

// --- Usuarios ---------------------------------------------------------------

export type Rol = 'USUARIO_FINAL' | 'ADMINISTRADOR';

export type Usuario = {
  id: number;
  username: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
};

// --- Configuración de la política de reservas (RN-06, feature 002) ----------

/** FR-052. Solo ADMINISTRADOR: al usuario final el backend le responde 403. */
export function consultarConfiguracion(): Promise<Configuracion> {
  return api<Configuracion>('/reservas/configuracion');
}

/**
 * FR-053. El valor nuevo rige para la siguiente reserva que se intente crear,
 * sin reiniciar nada: `ms-reservas` lee la clave en cada creación.
 */
export function cambiarTope(maxReservasActivas: number): Promise<Configuracion> {
  return api<Configuracion>('/reservas/configuracion', {
    method: 'PUT',
    body: { maxReservasActivas },
  });
}

export function listarUsuarios(): Promise<Usuario[]> {
  return api<Usuario[]>('/usuarios');
}

/** FR-046. Inactivar no toca las reservas del usuario: son de otro dominio. */
export function cambiarEstadoUsuario(id: number, activo: boolean): Promise<Usuario> {
  return api<Usuario>(`/usuarios/${id}/estado`, { method: 'PATCH', body: { activo } });
}
