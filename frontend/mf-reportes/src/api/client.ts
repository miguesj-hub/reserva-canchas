/**
 * Cliente HTTP de mf-reportes. Mismo patrón que el shell y los otros remotes,
 * repetido y no importado: los remotes son autónomos (Principio V).
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

async function api<T>(ruta: string): Promise<T> {
  const headers: Record<string, string> = {};
  const credencial = localStorage.getItem(CREDENCIAL_KEY);
  if (credencial) headers.Authorization = `Basic ${credencial}`;

  const respuesta = await fetch(`/api${ruta}`, { headers });
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
  if (status === 400) return 'El rango de fechas no es válido.';
  if (status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  if (status === 403) return 'El módulo de reportes es solo del administrador.';
  if (status === 503) return 'No se pudo consultar el origen de los datos. Inténtalo de nuevo.';
  return 'No se pudieron cargar los indicadores.';
}

// --- Tipos del contrato ----------------------------------------------------

export type Deporte = 'PADEL' | 'TENIS' | 'BASQUET';

export type ConteoCancha = {
  canchaId: number;
  canchaNombre: string;
  deporte: Deporte;
  reservas: number;
};

export type ConteoDeporte = { deporte: Deporte; reservas: number };

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
export function cargarResumen(desde: string, hasta: string): Promise<Resumen> {
  return api<Resumen>(`/reportes/resumen?desde=${desde}&hasta=${hasta}`);
}
