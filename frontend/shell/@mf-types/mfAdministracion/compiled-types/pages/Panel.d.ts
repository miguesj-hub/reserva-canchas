/**
 * Panel del administrador. Muestra los cuatro indicadores de §3.3.5 acotados al
 * día en curso (R-005), con una sola llamada a /reportes/resumen.
 *
 * La maqueta traía '+12% vs ayer', '+2% vs promedio' y 'Horario Pico
 * 18:00-21:00'. Se han retirado: ninguno es uno de los cuatro indicadores, y no
 * hay dato con el que calcularlos —no existe serie histórica ni agregado por
 * franja—. Una cifra inventada en un panel de administración es peor que un
 * hueco, porque nadie duda de ella.
 */
export default function Panel(): import("react").JSX.Element;
