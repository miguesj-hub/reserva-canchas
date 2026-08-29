/**
 * La ÚNICA definición del menú de la aplicación.
 *
 * Hasta la feature 003 esto vivía duplicado en el layout de cada microfrontend:
 * el menú de administración estaba copiado en mf-administracion y mf-reportes, y
 * se desincronizó al añadir las pantallas de la feature 002 (las entradas nuevas
 * desaparecían al entrar en Reportes). Ahora hay una sola copia, aquí, y el
 * Principio V —«la navegación de nivel superior vive en el shell»— por fin se
 * cumple.
 *
 * Las rutas son absolutas a propósito: son rutas del shell, no de un remote.
 */

export type EntradaMenu = {
  to: string;
  label: string;
  icon: string;
  /** `true` cuando la ruta solo debe marcarse activa en coincidencia exacta. */
  end: boolean;
};

/**
 * Menú del ADMINISTRADOR. Las seis primeras las sirve mf-administracion y la
 * última mf-reportes: que estén en la misma lista es justamente el punto de esta
 * feature — el menú es del rol, no del microfrontend que sirve cada sección.
 */
export const MENU_ADMINISTRADOR: EntradaMenu[] = [
  { to: '/administracion', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/administracion/reservas', label: 'Reservas', icon: 'event_available', end: false },
  { to: '/administracion/canchas', label: 'Canchas', icon: 'sports_tennis', end: false },
  { to: '/administracion/disponibilidad', label: 'Disponibilidad', icon: 'calendar_month', end: false },
  { to: '/administracion/usuarios', label: 'Usuarios', icon: 'group', end: false },
  { to: '/administracion/configuracion', label: 'Configuración', icon: 'tune', end: false },
  { to: '/reportes', label: 'Reportes', icon: 'assessment', end: false },
];

/** Menú del USUARIO_FINAL. Lo sirve entero mf-reservas. */
export const MENU_USUARIO_FINAL: EntradaMenu[] = [
  { to: '/reservas', label: 'Mis Reservas', icon: 'event_available', end: true },
  { to: '/reservas/disponibilidad', label: 'Disponibilidad', icon: 'dashboard', end: false },
];

/**
 * Acción destacada de la barra inferior del socio en móvil. Se conserva tal como
 * estaba en mf-reservas: lleva al flujo de reserva, que es una de las rutas sin
 * chrome.
 */
export const ACCION_MOVIL_SOCIO = {
  to: '/reservas/nueva',
  label: 'Nueva',
  icon: 'add_circle',
};

/**
 * Rutas que se muestran SIN marco: ni barra lateral, ni cabecera.
 *
 * `/reservas/nueva` es un flujo transaccional a pantalla completa, así diseñado
 * desde antes de esta feature. Mantenerlo obliga al shell a conocer una ruta
 * interna de un remote, que es un acoplamiento que el Principio V no aplaude.
 * Se asume a conciencia: es una línea con nombre, frente a inventar un contrato
 * para que el remote pida «móntame sin marco». El razonamiento completo está en
 * R-013 de specs/003-chrome-en-el-shell/research.md.
 *
 * `/login` no necesita entrar aquí: sin sesión no hay menú que pintar, y el
 * shell ni siquiera monta el chrome.
 */
export const RUTAS_SIN_CHROME = ['/reservas/nueva'];

/** `true` si esa ruta debe mostrarse sin marco. */
export function sinChrome(pathname: string): boolean {
  return RUTAS_SIN_CHROME.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}
