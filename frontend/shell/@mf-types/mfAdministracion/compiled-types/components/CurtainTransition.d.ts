/**
 * Envuelve el <Outlet/> del menú (Dashboard / Reservas / Canchas / Usuarios)
 * con una transición de cortina: un panel sólido sube desde abajo hasta
 * cubrir toda la pantalla, el contenido cambia detrás de él, y el panel sigue
 * subiendo hasta salir por arriba, revelando la siguiente sección debajo.
 *
 * Copia deliberada de la de mf-reservas: cada microfrontend es un build
 * independiente (Module Federation), sin un paquete compartido de
 * componentes entre ellos.
 */
export declare function CurtainTransition(): import("react").JSX.Element;
