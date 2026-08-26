import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';

/** Debe coincidir con la duración total definida en App.css (--curtain-duration). */
const DURACION_MS = 800;

/** Primer segmento de la ruta ("/reservas/disponibilidad" → "/reservas"). */
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
 * Envuelve el <Outlet/> del menú (Mis Reservas ↔ Disponibilidad) con una
 * transición de cortina: un panel sólido sube desde abajo hasta cubrir toda
 * la pantalla, el contenido cambia detrás de él, y el panel sigue subiendo
 * hasta salir por arriba, revelando la siguiente sección debajo.
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

    // El destino sale de /reservas/* (p. ej. "Perfil", que vive en el shell):
    // este remote está a punto de desmontarse, y animar aquí duplicaría la
    // cortina de entrada que ya trae el destino.
    if (primerSegmento(location.pathname) !== primerSegmento(mostrado.pathname)) return;

    setCortinaKey(location.key);

    // El contenido se reemplaza a la mitad de la animación, cuando los paños
    // ya cubren toda la pantalla: el usuario nunca ve el salto.
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
