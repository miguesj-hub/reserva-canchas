/**
 * Único punto por el que el shell habla con la API.
 *
 * Tres cosas que no conviene repetir en cada pantalla:
 *
 * 1. Adjunta `Authorization: Basic` desde localStorage. La autenticación es
 *    Basic en cada petición (R-003), no un token de sesión: no hay nada que
 *    renovar, pero sí una credencial que hay que mandar siempre.
 * 2. Traduce el cuerpo de error uniforme (contracts/README.md) a un objeto de
 *    error con `status` y `message`, para que la pantalla pueda decir el motivo
 *    real —"cuenta inactiva", "ese bloque ya está reservado"— en lugar de un
 *    "algo salió mal" genérico.
 * 3. Deja el código HTTP a la vista: la diferencia entre 401, 403 y 409 es
 *    justo lo que la pantalla necesita para reaccionar distinto.
 *
 * La URL base es siempre `/api`, en desarrollo y en producción: detrás hay un
 * edge nginx o el proxy del servidor de desarrollo, pero el código no lo sabe.
 */

const CREDENCIAL_KEY = 'reservasport_credencial';
const SESION_KEY = 'reservasport_sesion';

/** Error con el código HTTP y el motivo que devolvió el servidor. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Forma del cuerpo de error uniforme que producen gateway y microservicios. */
type CuerpoDeError = {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
};

export function guardarCredencial(username: string, password: string): void {
  localStorage.setItem(CREDENCIAL_KEY, btoa(`${username}:${password}`));
}

export function borrarCredencial(): void {
  localStorage.removeItem(CREDENCIAL_KEY);
}

export function hayCredencial(): boolean {
  return localStorage.getItem(CREDENCIAL_KEY) !== null;
}

type Opciones = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Las dos rutas de /api/auth no llevan credencial: sirven para obtenerla. */
  publica?: boolean;
};

export async function api<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { method = 'GET', body, publica = false } = opciones;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const credencial = localStorage.getItem(CREDENCIAL_KEY);
  if (!publica && credencial) headers.Authorization = `Basic ${credencial}`;

  const respuesta = await fetch(`/api${ruta}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (respuesta.status === 204) return undefined as T;

  // Un error puede llegar sin cuerpo (un 502 del edge, por ejemplo), así que
  // el parseo no puede dar por hecho que hay JSON detrás.
  const texto = await respuesta.text();
  const cuerpo: unknown = texto ? safeParse(texto) : null;

  if (!respuesta.ok) {
    const detalle = (cuerpo as CuerpoDeError | null)?.message;
    // Las rutas públicas se excluyen: el 401 de un login con credencial
    // equivocada no es una sesión caducada, y borrar la pantalla se llevaría
    // por delante el mensaje que explica el fallo.
    if (respuesta.status === 401 && !publica) {
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
  localStorage.removeItem(SESION_KEY);
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign(`/login?motivo=${encodeURIComponent(motivo)}`);
  }
}

function safeParse(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/** Solo para respuestas de error sin cuerpo; si lo hay, manda el del servidor. */
function mensajePorDefecto(status: number): string {
  if (status === 401) return 'Usuario o contraseña incorrectos.';
  if (status === 403) return 'Tu rol no permite esta operación.';
  if (status === 404) return 'No se encontró lo que buscabas.';
  if (status === 503) return 'El servicio no está disponible. Inténtalo de nuevo.';
  return 'No se pudo completar la operación.';
}
