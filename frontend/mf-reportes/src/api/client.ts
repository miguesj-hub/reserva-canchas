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
    throw new ApiError(respuesta.status, detalle ?? mensajePorDefecto(respuesta.status));
  }
  return cuerpo as T;
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
