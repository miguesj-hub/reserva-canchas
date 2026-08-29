import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';

/**
 * Debe coincidir con la duración total definida en App.css
 * (--curtain-duration). En 0 la cortina queda desactivada y el contenido se
 * reemplaza de inmediato: bajar solo la variable CSS dejaría este temporizador
 * cambiando la sección a los 400ms sin nada que lo tape, que es peor que la
 * animación.
 */
const DURACION_MS = 0;

/** Primer segmento de la ruta ("/administracion/reservas" → "/administracion"). */
function primerSegmento(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg ? `/${seg}` : '/';
}

type Mostrado = {
  pathname: string;
  key: string;
  outlet: ReturnType<typeof useOutlet>;
};

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
export function CurtainTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [mostrado, setMostrado] = useState<Mostrado>({
    pathname: location.pathname,
    key: location.key,
    outlet,
  });
  const [cortinaKey, setCortinaKey] = useState<string | null>(null);

  const swapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const endTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (location.pathname === mostrado.pathname) return;

    // El destino sale de /administracion/*: este remote está a punto de
    // desmontarse (el shell carga otro por Module Federation). Animar aquí
    // no tiene sentido — el remote de destino ya trae su propia cortina de
    // entrada — y dos cortinas a la vez es justo lo que producía el glitch.
    if (primerSegmento(location.pathname) !== primerSegmento(mostrado.pathname)) return;

    setCortinaKey(location.key);

    // El contenido se reemplaza a la mitad de la animación, cuando el panel
    // ya cubre toda la pantalla: el usuario nunca ve el salto.
    swapTimer.current = setTimeout(() => {
      setMostrado({ pathname: location.pathname, key: location.key, outlet });
    }, DURACION_MS / 2);

    endTimer.current = setTimeout(() => setCortinaKey(null), DURACION_MS);

    return () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
      if (endTimer.current) clearTimeout(endTimer.current);
    };
    // `outlet` no entra en las dependencias a propósito: solo importa su
    // valor en el instante del swap (ya capturado en el closure), no como
    // disparador — si no, cualquier re-render del padre reiniciaría el timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.key]);

  return (
    <div className="relative min-h-full">
      <div key={mostrado.key}>{mostrado.outlet}</div>

      {cortinaKey && (
        // Prefijo en la key: a mitad de la animación `mostrado.key` pasa a
        // valer lo mismo que `cortinaKey` (ambos son el location.key del
        // destino), y sin el prefijo React ve dos hermanos con la misma key.
        <div
          key={`cortina-${cortinaKey}`}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60]"
        >
          <div className="curtain-panel" />
        </div>
      )}
    </div>
  );
}
